const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'data', 'budget.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
const createTables = `
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        recurring BOOLEAN DEFAULT 0,
        next_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        month TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
`;

db.serialize(() => {
    db.exec(createTables, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
        } else {
            console.log('Database tables initialized successfully');
        }
    });
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Categories API
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, categories) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(categories || []);
        }
    });
});

app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    db.run('INSERT INTO categories (name) VALUES (?)', [name.trim()], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                res.status(409).json({ error: 'Category already exists' });
            } else {
                res.status(500).json({ error: err.message });
            }
        } else {
            res.status(201).json({ id: this.lastID, name: name.trim() });
        }
    });
});

app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Category not found' });
        } else {
            res.json({ message: 'Category deleted successfully' });
        }
    });
});

// Transactions API
app.get('/api/transactions', (req, res) => {
    const { month, category, type } = req.query;
    let sql = 'SELECT * FROM transactions';
    let params = [];
    
    if (month || category || type) {
        const conditions = [];
        if (month) {
            conditions.push('date LIKE ?');
            params.push(`${month}%`);
        }
        if (category) {
            conditions.push('category = ?');
            params.push(category);
        }
        if (type) {
            conditions.push('type = ?');
            params.push(type);
        }
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY date DESC';
    
    db.all(sql, params, (err, transactions) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(transactions || []);
        }
    });
});

app.post('/api/transactions', (req, res) => {
    const { date, type, category, amount, note, recurring, next_date } = req.body;
    
    if (!date || !type || !category || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = `
        INSERT INTO transactions (date, type, category, amount, note, recurring, next_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [date, type, category, parseFloat(amount), note || '', 
                 recurring ? 1 : 0, next_date || null], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ 
                id: this.lastID, 
                date, type, category, amount: parseFloat(amount), note, recurring, next_date 
            });
        }
    });
});

app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { date, type, category, amount, note, recurring, next_date } = req.body;
    
    const sql = `
        UPDATE transactions 
        SET date = ?, type = ?, category = ?, amount = ?, note = ?, recurring = ?, next_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(sql, [date, type, category, parseFloat(amount), note || '', 
                 recurring ? 1 : 0, next_date || null, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.json({ message: 'Transaction updated successfully' });
        }
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.json({ message: 'Transaction deleted successfully' });
        }
    });
});

// Budgets API
app.get('/api/budgets', (req, res) => {
    const { month } = req.query;
    let sql = 'SELECT * FROM budgets';
    let params = [];
    
    if (month) {
        sql += ' WHERE month = ?';
        params.push(month);
    }
    
    sql += ' ORDER BY category';
    
    db.all(sql, params, (err, budgets) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(budgets || []);
        }
    });
});

app.post('/api/budgets', (req, res) => {
    const { category, amount, month } = req.body;
    
    if (!category || !amount || !month) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = `
        INSERT OR REPLACE INTO budgets (category, amount, month)
        VALUES (?, ?, ?)
    `;
    
    db.run(sql, [category, parseFloat(amount), month], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ category, amount: parseFloat(amount), month });
        }
    });
});

// Settings API
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, settings) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const settingsObj = {};
            (settings || []).forEach(setting => {
                try {
                    settingsObj[setting.key] = JSON.parse(setting.value);
                } catch {
                    settingsObj[setting.key] = setting.value;
                }
            });
            res.json(settingsObj);
        }
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    
    if (!key) {
        return res.status(400).json({ error: 'Setting key is required' });
    }
    
    const sql = `
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    db.run(sql, [key, stringValue], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ key, value });
        }
    });
});

// Data export API
app.get('/api/export/json', (req, res) => {
    db.serialize(() => {
        let exportData = {
            categories: [],
            transactions: [],
            budgets: [],
            settings: [],
            exportDate: new Date().toISOString()
        };
        
        let completed = 0;
        const totalQueries = 4;
        
        const checkComplete = () => {
            completed++;
            if (completed === totalQueries) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="budget-export-${Date.now()}.json"`);
                res.json(exportData);
            }
        };
        
        db.all('SELECT * FROM categories', [], (err, categories) => {
            if (!err) exportData.categories = categories || [];
            checkComplete();
        });
        
        db.all('SELECT * FROM transactions', [], (err, transactions) => {
            if (!err) exportData.transactions = transactions || [];
            checkComplete();
        });
        
        db.all('SELECT * FROM budgets', [], (err, budgets) => {
            if (!err) exportData.budgets = budgets || [];
            checkComplete();
        });
        
        db.all('SELECT * FROM settings', [], (err, settings) => {
            if (!err) exportData.settings = settings || [];
            checkComplete();
        });
    });
});

app.get('/api/export/csv', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, transactions) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!transactions || transactions.length === 0) {
            res.status(404).json({ error: 'No transactions to export' });
        } else {
            const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Recurring', 'Next Date'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(tx => [
                    tx.date,
                    tx.type,
                    tx.category,
                    tx.amount,
                    `"${tx.note || ''}"`,
                    tx.recurring ? 'Yes' : 'No',
                    tx.next_date || ''
                ].join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
            res.send(csvContent);
        }
    });
});

// Serve the main application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Yen Budget Manager server running on port ${PORT}`);
    console.log(`📊 Database initialized at: ${dbPath}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close();
    process.exit(0);
});

module.exports = app;
