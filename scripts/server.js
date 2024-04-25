const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const db_IP = '3.208.22.53'

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: db_IP,
    user: 'user_355',
    password: 'CS355!',
    database: 'stock_db'
});

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
    const query = 'SELECT id, password FROM stock_user WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }

        if (results.length && results[0].password === password) {
            const userId = results[0].id;
            return res.send({ status: 'success', message: 'Login successful', userId: userId });
        }
        return res.status(401).send({ status: 'error', message: 'Invalid username or password' });
    });
});


app.post('/register_user', (req, res) => {
    const { username, password } = req.body;
    const query = 'INSERT INTO stock_user (username, password) VALUES (?, ?)';

    db.query(query, [username, password], (err, result) => {
        if (err) {
            return res.status(500).send({ status: 'error', message: err.message });
        }
        return res.status(201).send({ status: 'success', message: 'Registration successful' });
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
