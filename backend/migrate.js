const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL variable not configured in environment or .env file.");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

const schemaSQL = `
-- Drop old tables to rebuild with proper multi-tenant relations
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS firm_details CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. Tenants Table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users Table (For authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'lawyer' or 'client'
    client_name VARCHAR(255) DEFAULT NULL, -- Reference to client table if role is 'client'
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. Clients Table (Isolated by Tenant)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    practice VARCHAR(255) NOT NULL,
    balance INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (name, tenant_id)
);

-- 4. Cases Table (Isolated by Tenant)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    stage VARCHAR(50) DEFAULT 'intake',
    priority VARCHAR(50) DEFAULT 'Mid',
    attorney VARCHAR(255) DEFAULT 'You',
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
);

-- 5. Invoices Table (Isolated by Tenant)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) NOT NULL,
    date VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid',
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
);

-- 6. Contracts Table (Isolated by Tenant)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    content TEXT NOT NULL,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
);

-- 7. Appointments Table (Isolated by Tenant)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'Consultation',
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
);

-- 8. Firm Details Table (Isolated by Tenant)
CREATE TABLE firm_details (
    id SERIAL PRIMARY KEY,
    firm VARCHAR(255) NOT NULL,
    practice VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE UNIQUE
);
`;

async function runMigration() {
    try {
        console.log("Connecting to Neon Postgres database...");
        await client.connect();
        console.log("Connected successfully.");

        console.log("Rebuilding database tables with multi-tenant schemas...");
        await client.query(schemaSQL);
        console.log("Database schema successfully generated.");

        // Encrypt default passwords
        const hash = bcrypt.hashSync('password123', 10);
        console.log("Hashed default passwords.");

        console.log("Injecting default seed records...");
        
        // Seed Tenant 1
        const tenantRes = await client.query(`
            INSERT INTO tenants (name) VALUES ('Omatsuli Legal Associates') RETURNING id
        `);
        const tenantId = tenantRes.rows[0].id;
        console.log(`Seeded Default Tenant with ID: ${tenantId}`);

        // Seed Users
        await client.query(`
            INSERT INTO users (email, password_hash, role, tenant_id)
            VALUES 
            ('lawyer@lexora.app', $1, 'lawyer', $2),
            ('apex@lexora.app', $1, 'client', $2)
        `, [hash, tenantId]);

        // Link client user to its client profile name
        await client.query(`
            UPDATE users SET client_name = 'Apex Biotech Corp' WHERE email = 'apex@lexora.app'
        `);

        // Seed Clients
        await client.query(`
            INSERT INTO clients (name, email, practice, balance, status, tenant_id)
            VALUES 
            ('Apex Biotech Corp', 'legal@apexbiotech.com', 'Corporate Law', 15000, 'Active', $1),
            ('Nexus Venture Fund', 'intake@nexusfund.io', 'Corporate Law', 25000, 'Active', $1),
            ('Silverline Properties', 'ops@silverline.com', 'Real Estate', 5000, 'Active', $1)
        `, [tenantId]);

        // Seed Cases
        await client.query(`
            INSERT INTO cases (title, client, stage, priority, attorney, tenant_id)
            VALUES
            ('Series A Financing Audit', 'Apex Biotech Corp', 'research', 'High', 'You', $1),
            ('Bylaws Drafting & Review', 'Nexus Venture Fund', 'drafting', 'Low', 'You', $1),
            ('Commercial Lease Negotiation', 'Silverline Properties', 'intake', 'Mid', 'You', $1),
            ('IP License Agreement', 'Apex Biotech Corp', 'drafting', 'High', 'You', $1)
        `, [tenantId]);

        // Seed Invoices
        await client.query(`
            INSERT INTO invoices (id, client, date, description, amount, hours, status, tenant_id)
            VALUES 
            (9001, 'Apex Biotech Corp', 'July 21, 2026', 'Bylaw review & retainer setup', 4200, 12, 'Unpaid', $1),
            (9002, 'Nexus Venture Fund', 'July 20, 2026', 'Series A term sheet consulting', 8500, 24, 'Paid', $1),
            (9003, 'Silverline Properties', 'July 18, 2026', 'Lease draft consultation', 1500, 4, 'Unpaid', $1)
        `, [tenantId]);

        // Seed Contracts
        await client.query(`
            INSERT INTO contracts (id, client, title, type, status, content, tenant_id)
            VALUES 
            (8001, 'Apex Biotech Corp', 'Mutual NDA Agreement', 'nda', 'Draft', 'MUTUAL NON-DISCLOSURE AGREEMENT\\n-------------------------------\\nThis Mutual NDA is made between OMATSULI LEGAL ASSOCIATES and APEX BIOTECH CORP.\\n\\nRecipient agrees to hold confidential intellectual property in escrow for a period of 5 years.', $1),
            (8002, 'Nexus Venture Fund', 'Attorney Retainer Engagement', 'retainer', 'Signed', 'ATTORNEY RETAINER AGREEMENT\\n---------------------------\\nThis Engagement Contract assigns corporate services to Nexus Venture Fund at a rate of $350/hour.', $1)
        `, [tenantId]);

        // Seed Appointments
        await client.query(`
            INSERT INTO appointments (id, client, title, date, time, type, tenant_id)
            VALUES 
            (7001, 'Apex Biotech Corp', 'Series A Legal Audit', '2026-07-23', '10:00', 'Consultation', $1),
            (7002, 'Nexus Venture Fund', 'Bylaws Review Advisory', '2026-07-24', '14:00', 'Hearing', $1)
        `, [tenantId]);

        // Seed Firm Details
        await client.query(`
            INSERT INTO firm_details (firm, practice, address, phone, email, tenant_id)
            VALUES ('Omatsuli Legal Associates', 'Corporate Law Practice', '120 Silicon Valley Blvd, Suite 400', '+1 (555) 898-0320', 'billing@lexora.app', $1)
        `, [tenantId]);

        console.log("Seeding process completed successfully.");
        
        await client.end();
        console.log("Database connection closed cleanly. Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed due to database connection error:", err);
        process.exit(1);
    }
}

runMigration();
