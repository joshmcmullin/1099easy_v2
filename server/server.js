require('dotenv').config({ path: '.env.local' });
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const PORT = 8080;

// Configure database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});


app.use(bodyParser.json());
app.use(cors());


// Queries postgres db. Returns and prints to /api/signup the query.
app.get('/api/signup', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM app_user');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/signup', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
    try {
        const result = await pool.query('INSERT INTO app_user (email, password) VALUES ($1, $2) RETURNING *', [email, password]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});