const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Paths to all the static files
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// Start of registering pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});
app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'account.html'));
});
app.get('/stock', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'stock.html'));
});
// End of registering pages

const db_IP = '3.208.22.53';
const db = mysql.createConnection({
    host: db_IP,
    user: 'user_355',
    password: 'CS355!',
    database: 'stock_db'
});


// Connect to database that stores users and stocks
db.connect(err => {
    if (err) {
        console.error('An error occurred while connecting to the DB');
        throw err;
    }
    console.log(`Connected to database ${db_IP}`);
});

app.post('/login_user', (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    const query = 'SELECT id, password, account_balance FROM stock_user WHERE username = ?';
    // Query database for user and if exists pass to request to home.html
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }

        if (results.length && results[0].password === password) {
            // Continue passing in the user id and account balance
            const userId = results[0].id;
            const accountBalance = results[0].account_balance;
            return res.send({ status: 'success', message: 'Login successful', userId: userId, accountBalance: accountBalance });
        }
        return res.status(401).send({ status: 'error', message: 'Invalid username or password' });
    });
});


// Add entry into stock_user table, creating a new user
app.post('/register_user', (req, res) => {
    const { username, password } = req.body;
    // TODO should also hash password
    const query = 'INSERT INTO stock_user (username, password) VALUES (?, ?)';

    db.query(query, [username, password], (err, result) => {
        if (err) {
            return res.status(500).send({ status: 'error', message: err.message });
        }
        return res.status(201).send({ status: 'success', message: 'Registration successful' });
    });
});

// Get user info
app.get('/get_user', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send({ status: 'error', message: 'UserID is required' });
    }
    const query = 'SELECT * FROM stock_user WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }

        res.json(results);
    });
})

// Get stocks for a user, given the user id and ticker
app.get('/get_ticker_by_user', (req, res) => {
  const userId = req.query.userId;
  const ticker = req.query.ticker;
    if (!userId) {
        return res.status(400).send({ status: 'error', message: 'UserID is required' });
    }
    const query = 'SELECT * FROM stocks WHERE user_id = ? AND ticker = ?';
    db.query(query, [userId, ticker], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }

        res.json(results);
    });
})

// Query API
// Shouldn't use this in production, but it's fine for testing, should use env variables
const FINNHUB_API_KEY = 'cojslk9r01qotadtbuogcojslk9r01qotadtbup0';

app.get('/api/quote', async (req, res) => {
    try {
        const symbol = req.query.symbol;
        if (!symbol) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const response = await axios.get(url);

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ error: 'Error fetching stock quote' });
    }
});
// End of query api

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
