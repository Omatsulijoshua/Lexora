const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend pages from root directory
app.use(express.static(path.join(__dirname, '.')));

// Setup PostgreSQL client Pool connected to Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'lexora_jwt_super_secret_session_key';

// Initialize Stripe SDK
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key_placeholder');

// Initialize OpenAI SDK
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock_openai_api_key_placeholder'
});

// ==========================================
// Middleware: verifyToken Route Guard
// ==========================================
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
        req.user = user; // Contains id, email, role, tenant_id, client_name
        next();
    });
}

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'OK', dbTime: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// ==========================================
// Authentication: Signup & Login
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
    const { firmName, email, password } = req.body;
    try {
        await pool.query('BEGIN');
        
        // 1. Create a new Tenant (Law Firm)
        const tenantRes = await pool.query(
            'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
            [firmName]
        );
        const tenantId = tenantRes.rows[0].id;

        // 2. Hash Password and Create Lawyer User
        const passwordHash = bcrypt.hashSync(password, 10);
        await pool.query(
            'INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4)',
            [email, passwordHash, 'lawyer', tenantId]
        );

        // 3. Setup Default Firm Details
        await pool.query(
            'INSERT INTO firm_details (firm, practice, address, phone, email, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [firmName, 'Corporate Law Practice', '120 Silicon Valley Blvd, Suite 400', '+1 (555) 898-0320', email, tenantId]
        );

        await pool.query('COMMIT');

        // 4. Generate Session Token
        const token = jwt.sign(
            { email, role: 'lawyer', tenant_id: tenantId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, email, role: 'lawyer', tenant_id: tenantId, firmName });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Email already registered or workspace name taken.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email credentials' });
        }
        
        const user = userRes.rows[0];
        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password credentials' });
        }

        const firmRes = await pool.query('SELECT firm FROM firm_details WHERE tenant_id = $1', [user.tenant_id]);
        const firmName = firmRes.rows[0]?.firm || 'Lexora Workspace';

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id, client_name: user.client_name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, email: user.email, role: user.role, tenant_id: user.tenant_id, client_name: user.client_name, firmName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 1. Clients Endpoints (Isolated by Tenant)
// ==========================================
app.get('/api/clients', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM clients WHERE tenant_id = $1 ORDER BY id ASC',
            [req.user.tenant_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', verifyToken, async (req, res) => {
    const { name, email, practice, balance } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Only lawyers can add clients.' });

    try {
        await pool.query('BEGIN');
        
        // 1. Register Client in Client database
        const clientRes = await pool.query(
            'INSERT INTO clients (name, email, practice, balance, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, practice, balance || 0, 'Active', req.user.tenant_id]
        );

        // 2. Create matching Client Portal login account automatically
        const clientPassHash = bcrypt.hashSync('password123', 10); // Default password
        await pool.query(
            'INSERT INTO users (email, password_hash, role, client_name, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
            [email, clientPassHash, 'client', name, req.user.tenant_id]
        );

        await pool.query('COMMIT');
        res.json(clientRes.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. Cases Endpoints (Isolated by Tenant & Role)
// ==========================================
app.get('/api/cases', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM cases WHERE tenant_id = $1';
        let params = [req.user.tenant_id];

        if (req.user.role === 'client') {
            query += ' AND client = $2';
            params.push(req.user.client_name);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cases', verifyToken, async (req, res) => {
    const { title, client, stage, priority, attorney } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            'INSERT INTO cases (title, client, stage, priority, attorney, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, client, stage || 'intake', priority || 'Mid', attorney || 'You', req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/cases/:id/stage', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            'UPDATE cases SET stage = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
            [stage, id, req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. Invoices Endpoints
// ==========================================
app.get('/api/invoices', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM invoices WHERE tenant_id = $1';
        let params = [req.user.tenant_id];

        if (req.user.role === 'client') {
            query += ' AND client = $2';
            params.push(req.user.client_name);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', verifyToken, async (req, res) => {
    const { client, date, description, amount, hours } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            'INSERT INTO invoices (client, date, description, amount, hours, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [client, date, description, amount, hours, 'Unpaid', req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Real Stripe Checkout Integration
app.post('/api/payments/create-checkout', verifyToken, async (req, res) => {
    const { invoiceId, amount, clientName } = req.body;
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_stripe_key_placeholder') {
            console.warn("Stripe key missing; executing sandbox test billing success transaction...");
            await pool.query('BEGIN');
            await pool.query('UPDATE invoices SET status = $1 WHERE id = $2 AND tenant_id = $3', ['Paid', invoiceId, req.user.tenant_id]);
            await pool.query('UPDATE clients SET balance = GREATEST(0, balance - $1) WHERE name = $2 AND tenant_id = $3', [amount, clientName, req.user.tenant_id]);
            await pool.query('COMMIT');
            return res.json({ success: true, sandbox: true });
        }

        // Create Vercel/Render host compatible absolute redirections
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Lexora Invoice Payment #INV-${invoiceId}`,
                    },
                    unit_amount: Math.round(parseFloat(amount) * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/client_portal.html?payment=success&invoiceId=${invoiceId}&amount=${amount}&clientName=${encodeURIComponent(clientName)}`,
            cancel_url: `${req.headers.origin}/client_portal.html?payment=cancel`,
        });
        
        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/invoices/:id/pay', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { clientName, amount } = req.body;
    try {
        await pool.query('BEGIN');
        await pool.query('UPDATE invoices SET status = $1 WHERE id = $2 AND tenant_id = $3', ['Paid', id, req.user.tenant_id]);
        await pool.query('UPDATE clients SET balance = GREATEST(0, balance - $1) WHERE name = $2 AND tenant_id = $3', [amount, clientName, req.user.tenant_id]);
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. Contracts Endpoints
// ==========================================
app.get('/api/contracts', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM contracts WHERE tenant_id = $1';
        let params = [req.user.tenant_id];

        if (req.user.role === 'client') {
            query += ' AND client = $2';
            params.push(req.user.client_name);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contracts', verifyToken, async (req, res) => {
    const { client, title, type, content } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            'INSERT INTO contracts (client, title, type, content, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [client, title, type, content, 'Draft', req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/contracts/:id/sign', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    try {
        const result = await pool.query(
            'UPDATE contracts SET status = $1, content = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
            ['Signed', content, id, req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// OpenAI AI Drafting Endpoint
app.post('/api/ai/draft', verifyToken, async (req, res) => {
    const { clientName, type } = req.body;
    
    // Fetch Firm Details for contextual templates compilation
    const detailsRes = await pool.query('SELECT * FROM firm_details WHERE tenant_id = $1', [req.user.tenant_id]);
    const firmName = detailsRes.rows[0]?.firm || "Lexora Attorney Chamber";
    const practice = detailsRes.rows[0]?.practice || "Corporate Law Practice";

    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock_openai_api_key_placeholder') {
            console.warn("OpenAI Key missing; executing local compiler builder...");
            let titleName = "";
            let templateContent = "";
            if (type === 'nda') {
                titleName = "MUTUAL NON-DISCLOSURE AGREEMENT";
                templateContent = `MUTUAL NON-DISCLOSURE AGREEMENT\n--------------------------------------------------\nThis Mutual NDA is made between ${firmName.toUpperCase()} and ${clientName.toUpperCase()}.\n\nRecipient agrees to hold confidential intellectual property in escrow for a period of 5 years.`;
            } else if (type === 'retainer') {
                titleName = "ATTORNEY RETAINER AGREEMENT";
                templateContent = `ATTORNEY RETAINER AGREEMENT & ENGAGEMENT\n--------------------------------------------------\nThis Retainer Agreement is executed by and between:\n\nLAW CHAMBER: ${firmName.toUpperCase()} (hereinafter "Attorney"),\nAND\nCLIENT: ${clientName.toUpperCase()} (hereinafter "Client").\n\n1. Scope of Representation: Client retains Attorney to perform legal services related to: ${practice}.\n\n2. Retainer: Client agrees to pay an initial retainer deposit of $5,000.`;
            } else {
                titleName = "CONSULTING SERVICES CONTRACT";
                templateContent = `PROFESSIONAL CONSULTING CONTRACT\n--------------------------------------------------\nThis Agreement is entered into by CLIENT: ${clientName.toUpperCase()} and CONSULTANT: ${firmName.toUpperCase()}.\n\n1. Services: Consultant agrees to provide professional corporate advisory and regulatory services.`;
            }
            return res.json({ title: titleName, content: templateContent, sandbox: true });
        }

        const prompt = `Write a comprehensive, professional legal ${type.toUpperCase()} agreement between the law firm "${firmName}" and their corporate client "${clientName}". The law firm specializes in "${practice}". Include standard legal clauses, headers, and signature fields. Output ONLY the raw text contract without markdown styling wrapper.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }]
        });

        const docContent = completion.choices[0].message.content;
        res.json({ title: type.toUpperCase() === 'NDA' ? 'MUTUAL NON-DISCLOSURE AGREEMENT' : 'LEGAL SERVICES AGREEMENT', content: docContent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. Appointments Endpoints
// ==========================================
app.get('/api/appointments', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM appointments WHERE tenant_id = $1';
        let params = [req.user.tenant_id];

        if (req.user.role === 'client') {
            query += ' AND client = $2';
            params.push(req.user.client_name);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', verifyToken, async (req, res) => {
    const { client, title, date, time, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO appointments (client, title, date, time, type, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [client, title, date, time, type || 'Consultation', req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. Settings Endpoints
// ==========================================
app.get('/api/settings', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM firm_details WHERE tenant_id = $1',
            [req.user.tenant_id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', verifyToken, async (req, res) => {
    const { firm, practice, address, phone, email } = req.body;
    if (req.user.role !== 'lawyer') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            'INSERT INTO firm_details (firm, practice, address, phone, email, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id) DO UPDATE SET firm = $1, practice = $2, address = $3, phone = $4, email = $5 RETURNING *',
            [firm, practice, address, phone, email, req.user.tenant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route to serve the marketing landing page on root requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Start Express Listener only when run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Lexora Server actively running on port ${PORT}`);
    });
}

module.exports = app;
