require('dotenv').config({ path: '.env.local' });
const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { sendResponse, sendError, authenticateToken, generateTokens } = require('./utility');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
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
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());

// Queries postgres db to display all entities for the current user
app.get('/dashboard', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query('SELECT * FROM entity WHERE user_id = $1', [userId]);
        sendResponse(res, 200, result.rows);
    } catch (err) {
        console.error(err);
        sendError(res, 500, 'Server error');
    }
});

// TODO: Update password check to work with encryption
// TODO: Consult OWASP for security
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if the email is associated with an account, parameterized to protect from SQL injection
        const userResult = await pool.query('SELECT * FROM app_user WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            console.log("Account not found");
            return sendError(res, 404, 'Account not found');
        }
        const user = userResult.rows[0];
        // Check that password matches
        if (password !== user.password) {
            console.log("Incorrect password");
            return sendError(res, 401, 'Incorrect password');
        }
        // Generate authentication tokens
        const tokens = generateTokens(user);
        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Set secure to true in production
            sameSite: 'strict',
            path: '/'
        });
        sendResponse(res, 200, { message: "Login successful", accessToken });
    } catch (err) {
        console.error(err);
        sendError(res, 500, 'Server error occured');
    }
});

// Clears refresh token cookie on logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/'
    });
    sendResponse(res, 200, 'Logout successful');
});

// TODO: Consult OWASP for security
// TODO: Currently storing passwords in plain text, will need encryption
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;
        // Check for required fields
        if (!email || !password || !confirmPassword) {
            console.log("Email, password, or confirmPassword is missing");
            return sendError(res, 400, 'All fields must be filled');
        }
        // Validate email
        if (!validator.isEmail(email)) {
            return sendError(res, 400, 'Invalid email address');
        }
        // Check if passwords match
        if (password !== confirmPassword) {
            console.log("Passwords do not match");
            return sendError(res, 400, 'Passwords need to match');
        }
        // Check if the email is already in use
        const emailCheckResult = await pool.query('SELECT email FROM app_user WHERE email = $1', [email]);
        if (emailCheckResult.rows.length > 0) {
            console.log("Email already in use");
            return sendError(res, 400, 'Account already associated with this email');
        }
        // Insert new user into the database
        const insertResult = await pool.query('INSERT INTO app_user (email, password) VALUES ($1, $2) RETURNING *', [email, password]);
        const user = insertResult.rows[0];
        // Generate authentication tokens
        const tokens = generateTokens(user);
        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Set secure to true in production
            sameSite: 'strict',
            path: '/'
        })
        sendResponse(res, 201, { message: 'Signup successful', accessToken });
    } catch (err) {
        console.error(err);
        sendError(res, 500, 'Server error occured');
    }
});

app.post('/api/add_entity', authenticateToken, async (req, res) => {
    try {
        // Logic check here to make sure entity is good to be added
        const { name, street, city, state, zip, entity_tin } = req.body;
        // Check for required fields
        if (!name || !street || !city || !state || !zip || !entity_tin) {
            console.log("name, street, city, state, zip, or entity_tin is missing");
            return sendError(res, 400, "All fields must be filled");
        }
        // Check if EIN or SSN is already in an entity
        const userId = req.user.userId;
        const result = await pool.query('SELECT entity_tin FROM entity WHERE user_id = $1 AND entity_tin = $2', [userId, entity_tin]);
        if (result.rows.length > 0) {
            return sendError(res, 400, "An entity with this TIN already exists.");
        }
        // Insert entity
        const insertQuery = 'INSERT INTO entity (name, street, city, state, zip, entity_tin, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        await pool.query(insertQuery, [name, street, city, state, zip, entity_tin, userId]);
        res.status(201).json({ message: "Entity added successfully" });
    } catch (err) {
        console.log(err)
        sendError(res, 500, 'Server error occured');
    }
});

app.post('/api/refresh_token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return sendError(res, 401, "Refresh Token is required")
    }
    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign({ userId: payload.userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m'});
        const newRefreshToken = jwt.sign({ userId: payload.userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'});
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            path: '/'
        });
        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ message: "Invalid Refresh Token!"});
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

module.exports = app;