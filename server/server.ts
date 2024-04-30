import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Request, Response } from 'express';
const app = express();

import cors from 'cors';
import bodyParser from 'body-parser';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import pool from './databaseConfig';
import { sendResponse, sendError, authenticateToken, generateTokens } from './utility';
import { logWithUser } from './logger';

const PORT = 8080;

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());

/**
 * Queries the database to retrieve all entities for the current user.
 * @route GET /api/dashboard
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 */
app.get('/api/dashboard', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    logWithUser(req, 'info', 'Dashboard visited')
    if (!req.user) {
        return sendError(res, 404, 'No user found');
    }
    try {
        const userId = req.user.userId;
        const query = `
            SELECT *
            FROM entity
            WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        sendResponse(res, 200, result.rows);
    } catch (err) {
        console.error(err);
        sendError(res, 500, 'Server error');
    }
});

/**
 * Handles login info, queries the database to make sure account exists, and generates tokens.
 * @route POST /api/login
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 * @todo update password check to work with encryption.
 * @todo consult OWASP for security principles.
 */
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        // Check if the email is associated with an account
        const query = `
            SELECT *
            FROM app_user
            WHERE email = $1`;
        const userResult = await pool.query(query, [email]);
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

/**
 * Clears the refresh token cookie on logout.
 * @route POST /api/logut
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 */
app.post('/api/logout', async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/'
    });
    sendResponse(res, 200, 'Logout successful');
});

/**
 * Handles signup logic, validating email & password, inserting account information
 * into the database, and generating tokens.
 * @route POST /api/signup
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 * @todo Utilize encryption to store passwords safely.
 * @todo Consult OWASP for security.
 */
app.post('/api/signup', async (req: Request, res: Response): Promise<void> => {
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
        const query = `
            SELECT email
            FROM app_user
            WHERE email = $1`;
        const emailCheckResult = await pool.query(query, [email]);
        if (emailCheckResult.rows.length > 0) {
            console.log("Email already in use");
            return sendError(res, 400, 'Account already associated with this email');
        }
        // Insert new user into the database
        const insertQuery = `
            INSERT INTO app_user (email, password)
            VALUES ($1, $2)
            RETURNING *`;
        const insertResult = await pool.query(insertQuery, [email, password]);
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

/**
 * Handles logic for adding a new entity. Validates information and checks if
 * an entity exists with this name or TIN already. Inserts information into
 * database if not.
 * @route POST /api/add_entity
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolved when the operation is complete.
 */
app.post('/api/add_entity', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        return sendError(res, 404, 'No user found');
    }
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
        const query = `
            SELECT entity_tin, name
            FROM entity
            WHERE user_id = $1
                AND (entity_tin = $2 OR name = $3)`;
        const result = await pool.query(query, [userId, entity_tin, name]);
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
        const insertQuery = `
            INSERT INTO entity (name, street, city, state, zip, entity_tin, is_individual, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
        await pool.query(insertQuery, [name, street, city, state, zip, entity_tin, is_individual, userId]);
        sendResponse(res, 201, 'Entity added successfully');
    } catch (err) {
        console.log(err)
        sendError(res, 500, 'Server error occured');
    }
});

/**
 * Represents the payload structure of JWT used for authentication.
 * @interface
 * @property userId - The unique identifier of the user.
 */
interface JWTPayload {
    userId: number;
}

/**
 * Handles the refreshing of access tokens using a refresh token.
 * @route POST /api/refresh_token
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 */
app.post('/api/refresh_token', async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return sendError(res, 401, "Refresh Token is required")
    }
    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as JWTPayload;
        const newAccessToken = jwt.sign({ userId: payload.userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m'});
        const newRefreshToken = jwt.sign({ userId: payload.userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d'});
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            path: '/'
        });
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        return sendError(res, 403, "Invalid Refresh Token!");
    }
});

/**
 * Retrieves all entities that relate to a specific entity id and 
 * user id.
 * @route GET /api/entities/:entityId
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the operation is complete.
 */
app.get('/api/entities/:entityId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        return sendError(res, 404, "No user found");
    }
    const { entityId } = req.params;
    const userId = req.user.userId;
    try {
        const query = `
            SELECT *
            FROM entity
            WHERE entity_id = $1
                AND user_id = $2`;
        const result = await pool.query(query, [entityId, userId]);
        if (result.rows.length > 0) {
            sendResponse(res, 200, result.rows[0]);
        } else { // This should NEVER trigger else an entity that doesn't exist is on the dashboard!
            return sendError(res, 404, 'Entity not found.'); 
        }
    } catch (err) {
        console.error('Error fetching entity:', err);
        return sendError(res, 500, 'Server error occurred.');
    }
});

/**
 * Retrieves all forms that relate to a specific entity id
 * and user id.
 * @route GET /api/forms/:entityId
 * @param req Express request object.
 * @param res Express response object.
 * @return A promise that resolves when the operation is complete.
 */
app.get('/api/forms/:entityId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        return sendError(res, 404, "No user found");
    }
    const { entityId } = req.params;
    const userId = req.user.userId;
    try {
        const query = `
            SELECT *
            FROM form
            WHERE payer_id = $1
                AND user_id = $2`;
        const result = await pool.query(query, [entityId, userId]);
        if (result.rows.length > 0) {
            sendResponse(res, 200, result.rows);
        } else {
            sendResponse(res, 200, []);
        }
    } catch (err) {
        console.error('Error fetching forms:', err);
        return sendError(res, 500, 'Server error occured.');
    }
});

// majority here taken from add_entity, need to double check everything, update DB to alter, not insert
/**
 * Handles updating an entity's information.
 * @route POST /api/update_entity
 * @param req Express request object.
 * @param res Express response object.
 * @return A promise that resolves when the operation is complete.
 */
app.post('/api/update_entity', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        return sendError(res, 404, "No user found");
    }
    try {
        // Logic check here to make sure entity is good to be added
        const { entity_id, name, street, city, state, zip, entity_tin, is_individual } = req.body;
        // Check for required fields
        if (!name || !street || !city || !state || !zip || !entity_tin) {
            console.log("name, street, city, state, zip, or entity_tin is missing");
            return sendError(res, 400, "All fields must be filled");
        }
        // Check if TIN or name is already in an entity
        const userId = req.user.userId;
        const query = `
            SELECT entity_tin, name
            FROM entity
            WHERE user_id = $1
                AND (entity_tin = $2 OR name = $3)
                AND entity_id != $4`;
        const result = await pool.query(query, [userId, entity_tin, name, entity_id]);
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
        // Update entity
        const updateQuery = `
            UPDATE entity
            SET NAME = $1, street = $2, city = $3, state = $4, zip = $5, entity_tin = $6, is_individual = $7
            WHERE entity_id = $8 AND user_id = $9`;;
        await pool.query(updateQuery, [name, street, city, state, zip, entity_tin, is_individual, entity_id, userId]);
        sendResponse(res, 201, 'Entity updated successfully');
    } catch (err) {
        console.log(err)
        sendError(res, 500, 'Server error occured');
    }
});

if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => `Server running on port ${PORT}`);
    module.exports = server;
} else {
    module.exports = app;
}