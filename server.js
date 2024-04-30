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
    const query = 'SELECT * FROM stock_user WHERE username = ?';
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
            const availableBalance = results[0].available_balance;
            return res.send({ status: 'success', message: 'Login successful', userId: userId, accountBalance: accountBalance, availableBalance: availableBalance });
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

// Modify user available balance and stock holdings
app.post('/buy_stock', (req, res) => {
    const userId = req.body.userId;
    const ticker = req.body.ticker;
    const sharesToBuy = parseInt(req.body.shares);
    const purchasePrice = parseFloat(req.body.purchasePrice);
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        // Check if the user has enough balance
        db.query('SELECT account_balance FROM stock_user WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching user balance:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Error fetching user balance' });
                });
            }

            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ error: 'User not found' });
                });
            }

            const currentBalance = results[0].account_balance;
            const totalCost = sharesToBuy * purchasePrice;

            if (currentBalance < totalCost) {
                return db.rollback(() => {
                    res.status(400).json({ error: 'Insufficient balance' });
                });
            }

            // Take the cost from the user's balance
            db.query('UPDATE stock_user SET available_balance = available_balance - ? WHERE id = ?', [totalCost, userId], (err, updateResults) => {
                if (err) {
                    console.error('Error updating user balance:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error updating user balance' });
                    });
                }

                // Update quantity of stock for that user
                // Query to update stocks for the user
                const insertOrUpdateQuery = `
                    INSERT INTO stocks (ticker, name, price_purchased, user_id, quantity, current_price)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    quantity = quantity + VALUES(quantity), 
                    price_purchased = VALUES(price_purchased)
                `;

                db.query(insertOrUpdateQuery, [ ticker, ticker, purchasePrice, userId, sharesToBuy, purchasePrice], (err, insertResults) => {
                    if (err) {
                        console.error('Error updating stocks:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error updating stocks' });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error during transaction commit' });
                            });
                        }
                        res.json({ status: 'success', message: 'Stock purchased successfully' });
                    });
                });
            });
        });
    });
});

app.post('/sell_stock', (req, res) => {
    const userId = req.body.userId;
    const ticker = req.body.ticker;
    const sharesToSell = parseInt(req.body.shares_sell);
    const currentPrice = parseFloat(req.body.sellPrice);


    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        // Query to update stock quantity and price
        const updateStockQuery = `
            UPDATE stocks
            SET quantity = quantity - ?, current_price = ?
            WHERE user_id = ? AND ticker = ? AND quantity >= ?
        `;

        db.query(updateStockQuery, [sharesToSell, currentPrice, userId, ticker, sharesToSell], (err, results) => {
            if (err) {
                console.error('Error updating stocks:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Error updating stocks' });
                });
            }

            if (results.affectedRows === 0) {
                return db.rollback(() => {
                    res.status(400).json({ error: 'Not enough stocks to sell or stock not found' });
                });
            }

            db.commit(err => {
                if (err) {
                    console.error('Error committing transaction:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error during transaction commit' });
                    });
                }
                res.json({ status: 'success', message: 'Stock sold successfully' });

                const updateUserAvailableBalanceQuery = `
                    UPDATE stock_user
                    SET available_balance = available_balance + ?
                    WHERE id = ?
                `;
                db.query(updateUserAvailableBalanceQuery, [sharesToSell * currentPrice, userId], (err,updateBalance) => {
                    if (err) {
                        console.error('Error updating user balance:', err);
                        console.log('Error updating user balance');
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error updating user balance' });
                        });
                    }
                })
            });
        });
    });
});
// Update user's available balance
// TODO use this function to update users' available account balance
function updateUserAvailableBalance(userId, amount, db) {
    const query = 'UPDATE stock_user SET available_balance = available_balance + ? WHERE id = ?';
    db.query(query, [amount, userId], (err, results) => {
        if (err) {
            console.error('Error updating user balance:', err);
            return false;
        }
        return true;
    });
}

// Get user's info
app.get('/get_user', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send({ status: 'error', message: 'UserID is required' });
    }
    const query = 'SELECT id, * FROM stock_user WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send({ status: 'error', message: 'User not found' });
        }
    });
});


// Get user's stock portfolio
app.get('/get_portfolio', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send({ status: 'error', message: 'User ID is required' });
    }

    const query = 'SELECT * FROM stocks WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching portfolio:', err);
            return res.status(500).send({ status: 'error', message: 'Error fetching portfolio' });
        }
        res.json(results);
    });
});

// Handle deposit
app.post('/deposit', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) {
        return res.status(400).json({ error: 'Deposit amount must be positive.' });
    }
    const query = 'UPDATE stock_user SET account_balance = account_balance + ? WHERE id = ?';
    const query2 = 'UPDATE stock_user SET available_balance = available_balance + ? WHERE id = ?';
    db.query(query, [amount, userId], (err, results) => {
        if (err) {
            console.error('Error updating account balance:', err);
            return res.status(500).json({ error: 'Error processing deposit' });
        }
        db.query(query2, [amount, userId], (err, results) => {
            if (err) {
                console.error('Error updating account balance:', err);
                return res.status(500).json({ error: 'Error processing deposit' });
            }
            // res.json({ status: 'success', message: 'Deposit successful' });
        });
        res.json({ status: 'success', message: 'Deposit successful' });
    });

});

// Handle withdrawal
app.post('/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) {
        return res.status(400).json({ error: 'Withdrawal amount must be positive.' });
    }
    const query = 'UPDATE stock_user SET account_balance = account_balance - ? WHERE id = ? AND account_balance >= ?';
    const query2 = 'UPDATE stock_user SET available_balance = available_balance - ? WHERE id = ? AND available_balance >= ?';

    db.query(query, [amount, userId, amount], (err, results) => {
        if (err) {
            console.error('Error updating account balance:', err);
            return res.status(500).json({ error: 'Error processing withdrawal' });
        }
        if (results.affectedRows === 0) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        db.query(query2, [amount, userId, amount], (err, results) => {
            if (err) {
                console.error('Error updating account balance:', err);
                return res.status(500).json({ error: 'Error processing withdrawal' });
            }
            if (results.affectedRows === 0) {
                return res.status(400).json({ error: 'Insufficient funds' });
            }
            // res.json({ status: 'success', message: 'Withdrawal successful' });
        });
        res.json({ status: 'success', message: 'Withdrawal successful' });
    });

});



// Query API for stock price
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
// End of query api for stock price

// Start of query API for financial info
app.get('/api/financial', async (req, res) => {
    try {
        const symbol = req.query.symbol;
        if (!symbol) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        const toDate = new Date().toISOString().split('T')[0]; // gets today's date in YYYY-MM-DD
        const fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]; // gets date one year ago

        const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&token=${FINNHUB_API_KEY}&freq=quarterly&from=${fromDate}&to=${toDate}`;
        const response = await axios.get(url);

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching financial info:', error);
        res.status(500).json({ error: 'Error fetching financial info' });
    }
});

app.get('/api/insider', async (req, res) => {
    try {
        const symbol = req.query.symbol;
        if (!symbol) {
            return res.status(400).json({error: 'Stock symbol is required'});
        }

        const toDate = new Date().toISOString().split('T')[0]; // today's date in YYYY-MM-DD
        const fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]; // date one year ago

        const url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}&from=${fromDate}&to=${toDate}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching insider transactions:', error);
        res.status(500).json({error: 'Error fetching insider transactions'});
    }
});
// End insider transactions

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

