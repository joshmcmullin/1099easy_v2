require('dotenv').config({ path: '.env.local' });
const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const pool = require('./databaseConfig');
const { sendResponse, sendError, authenticateToken, generateTokens } = require('./utility');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const PORT = 8080;

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
        const { name, street, city, state, zip, entity_tin, is_individual } = req.body;
        // Check for required fields
        if (!name || !street || !city || !state || !zip || !entity_tin) {
            console.log("name, street, city, state, zip, or entity_tin is missing");
            return sendError(res, 400, "All fields must be filled");
        }
        // Check if TIN or name is already in an entity
        const userId = req.user.userId;
        const result = await pool.query('SELECT entity_tin, name FROM entity WHERE user_id = $1 AND (entity_tin = $2 OR name = $3)', [userId, entity_tin, name]);
        if (result.rows.length > 0) {
            // Check which exists already
            const existsTin = result.rows.some(row => row.entity_tin === entity_tin);
            const existsName = result.rows.some(row => row.name === name);
            if (existsTin && existsName) {
                return sendError(res, 400, "An entity with this TIN and name already exists.");
            } else if (existsTin) {
                return sendError(res, 400, "An entity with this TIN already exists.");
            } else {
                return sendError(res, 400, "An entity with this name already exists.");
            }
        }
        // Check if TIN is proper length. Format forced through front-end
        if (is_individual) {
            if (entity_tin.length !== 11) {
                return sendError(res, 400, 'An SSN must be 9 digits and formatted xxx-xx-xxxx');
            }
        } else {
            if (entity_tin.length !== 10) {
                return sendError(res, 400, 'An EIN must be 9 digits and formatted xx-xxxxxxx');
            }
        }
        // Check if State is proper length & format
        if (!/^[A-Za-z]{2}$/.test(state)) {
            return sendError(res, 400, 'The State abbreviation should be a 2-letter code (Ex: ID, UT, AZ)');
        }
        // Check if ZIP is proper length & format
        if (!/^\d{5}$/.test(zip)) {
            return sendError(res, 400, 'The ZIP should be a 5-digit number');
        }
        
        // Insert entity
        const insertQuery = 'INSERT INTO entity (name, street, city, state, zip, entity_tin, is_individual, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
        await pool.query(insertQuery, [name, street, city, state, zip, entity_tin, is_individual, userId]);
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

if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => `Server running on port ${PORT}`);
    module.exports = server;
} else {
    module.exports = app;
}