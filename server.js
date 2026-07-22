const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
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

// Test connection endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'OK', dbTime: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database unhealthy' });
    }
});

// ==========================================
// 1. Clients Endpoints
// ==========================================
app.get('/api/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const { name, email, practice, balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO clients (name, email, practice, balance, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO UPDATE SET email = $2, practice = $3 RETURNING *',
            [name, email, practice, balance || 0, 'Active']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. Cases Endpoints
// ==========================================
app.get('/api/cases', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cases ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cases', async (req, res) => {
    const { title, client, stage, priority, attorney } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO cases (title, client, stage, priority, attorney) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, client, stage || 'intake', priority || 'Mid', attorney || 'You']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/cases/:id/stage', async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;
    try {
        const result = await pool.query(
            'UPDATE cases SET stage = $1 WHERE id = $2 RETURNING *',
            [stage, id]
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
app.get('/api/invoices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', async (req, res) => {
    const { client, date, description, amount, hours } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO invoices (client, date, description, amount, hours, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [client, date, description, amount, hours, 'Unpaid']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/invoices/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { clientName, amount } = req.body;
    try {
        await pool.query('BEGIN');
        await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', ['Paid', id]);
        await pool.query('UPDATE clients SET balance = GREATEST(0, balance - $1) WHERE name = $2', [amount, clientName]);
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
app.get('/api/contracts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contracts ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contracts', async (req, res) => {
    const { client, title, type, content } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO contracts (client, title, type, content, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [client, title, type, content, 'Draft']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/contracts/:id/sign', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    try {
        const result = await pool.query(
            'UPDATE contracts SET status = $1, content = $2 WHERE id = $3 RETURNING *',
            ['Signed', content, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. Appointments Endpoints
// ==========================================
app.get('/api/appointments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    const { client, title, date, time, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO appointments (client, title, date, time, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [client, title, date, time, type || 'Consultation']
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
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM firm_details WHERE id = 1');
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const { firm, practice, address, phone, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO firm_details (id, firm, practice, address, phone, email) VALUES (1, $1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET firm = $1, practice = $2, address = $3, phone = $4, email = $5 RETURNING *',
            [firm, practice, address, phone, email]
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
