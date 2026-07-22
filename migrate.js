const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL variable not configured in environment or .env file.");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Neon secure server connection
    }
});

const schemaSQL = `
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    practice VARCHAR(255) NOT NULL,
    balance INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client VARCHAR(255) REFERENCES clients(name) ON UPDATE CASCADE ON DELETE CASCADE,
    stage VARCHAR(50) DEFAULT 'intake',
    priority VARCHAR(50) DEFAULT 'Mid',
    attorney VARCHAR(255) DEFAULT 'You'
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) REFERENCES clients(name) ON UPDATE CASCADE ON DELETE CASCADE,
    date VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid'
);

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) REFERENCES clients(name) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    client VARCHAR(255) REFERENCES clients(name) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'Consultation'
);

CREATE TABLE IF NOT EXISTS firm_details (
    id SERIAL PRIMARY KEY,
    firm VARCHAR(255) NOT NULL,
    practice VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL
);
`;

const seedSQL = `
-- Seed Clients
INSERT INTO clients (name, email, practice, balance, status)
VALUES 
('Apex Biotech Corp', 'legal@apexbiotech.com', 'Corporate Law', 15000, 'Active'),
('Nexus Venture Fund', 'intake@nexusfund.io', 'Corporate Law', 25000, 'Active'),
('Silverline Properties', 'ops@silverline.com', 'Real Estate', 5000, 'Active')
ON CONFLICT (name) DO NOTHING;

-- Seed Cases
INSERT INTO cases (title, client, stage, priority, attorney)
SELECT 'Series A Financing Audit', 'Apex Biotech Corp', 'research', 'High', 'You'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE title = 'Series A Financing Audit');

INSERT INTO cases (title, client, stage, priority, attorney)
SELECT 'Bylaws Drafting & Review', 'Nexus Venture Fund', 'drafting', 'Low', 'You'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE title = 'Bylaws Drafting & Review');

INSERT INTO cases (title, client, stage, priority, attorney)
SELECT 'Commercial Lease Negotiation', 'Silverline Properties', 'intake', 'Mid', 'You'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE title = 'Commercial Lease Negotiation');

INSERT INTO cases (title, client, stage, priority, attorney)
SELECT 'IP License Agreement', 'Apex Biotech Corp', 'drafting', 'High', 'You'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE title = 'IP License Agreement');

-- Seed Invoices
INSERT INTO invoices (id, client, date, description, amount, hours, status)
VALUES 
(9001, 'Apex Biotech Corp', 'July 21, 2026', 'Bylaw review & retainer setup', 4200, 12, 'Unpaid'),
(9002, 'Nexus Venture Fund', 'July 20, 2026', 'Series A term sheet consulting', 8500, 24, 'Paid'),
(9003, 'Silverline Properties', 'July 18, 2026', 'Lease draft consultation', 1500, 4, 'Unpaid')
ON CONFLICT (id) DO NOTHING;

-- Seed Contracts
INSERT INTO contracts (id, client, title, type, status, content)
VALUES 
(8001, 'Apex Biotech Corp', 'Mutual NDA Agreement', 'nda', 'Draft', 'MUTUAL NON-DISCLOSURE AGREEMENT\\n-------------------------------\\nThis Mutual NDA is made between OMATSULI LEGAL ASSOCIATES and APEX BIOTECH CORP.\\n\\nRecipient agrees to hold confidential intellectual property in escrow for a period of 5 years.'),
(8002, 'Nexus Venture Fund', 'Attorney Retainer Engagement', 'retainer', 'Signed', 'ATTORNEY RETAINER AGREEMENT\\n---------------------------\\nThis Engagement Contract assigns corporate services to Nexus Venture Fund at a rate of $350/hour.')
ON CONFLICT (id) DO NOTHING;

-- Seed Appointments
INSERT INTO appointments (id, client, title, date, time, type)
VALUES 
(7001, 'Apex Biotech Corp', 'Series A Legal Audit', '2026-07-23', '10:00', 'Consultation'),
(7002, 'Nexus Venture Fund', 'Bylaws Review Advisory', '2026-07-24', '14:00', 'Hearing')
ON CONFLICT (id) DO NOTHING;

-- Seed Firm Details
INSERT INTO firm_details (id, firm, practice, address, phone, email)
SELECT 1, 'Omatsuli Legal Associates', 'Corporate Law Practice', '120 Silicon Valley Blvd, Suite 400', '+1 (555) 898-0320', 'billing@lexora.app'
WHERE NOT EXISTS (SELECT 1 FROM firm_details WHERE id = 1);
`;

async function runMigration() {
    try {
        console.log("Connecting to Neon Postgres database...");
        await client.connect();
        console.log("Connected successfully.");

        console.log("Initializing database tables schema...");
        await client.query(schemaSQL);
        console.log("Database schema successfully generated.");

        console.log("Injecting default seed records...");
        await client.query(seedSQL);
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
