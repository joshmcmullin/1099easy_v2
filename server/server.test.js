require('dotenv').config({ path: '.env.local' });
const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');
const pool = require('./databaseConfig');

beforeEach(async () => {
    await pool.query('BEGIN');
});

afterEach(async () => {
    await pool.query('ROLLBACK');
});

function generateTestToken() {
    const userPayload = {
        userId: process.env.USER_ID,
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASS
    }
    return jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

function generateFalseTestToken() {
    const userPayload = {
        userId: process.env.USER_ID,
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASS
    }
    return jwt.sign(userPayload, 'wrongkey', { expiresIn: '1h' });
};

describe('Server functions', () => {

    describe('GET /dashboard', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/dashboard');
            expect(response.statusCode).toBe(401);
        });

        it('should return entities for the authenticated user', async () => {
            const testToken = generateTestToken();
            const response = await request(app)
                .get('/dashboard')
                .set('Authorization', `Bearer ${testToken}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/login', () => {
        it('should log in an existing user with correct email, correct pass', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: process.env.USER_EMAIL, password: process.env.USER_PASS });
            expect(response.statusCode).toBe(200);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should log in an existing user with correct email, other user correct pass', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: process.env.USER_EMAIL, password: process.env.DIFF_USER_PASS });
            expect(response.statusCode).toBe(401);
        });

        it('should reject login with correct email, incorrect pass', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: process.env.USER_EMAIL, password: process.env.F_USER_PASS });
            expect(response.statusCode).toBe(401);
        });

        it('should reject login with incorrect email, known correct pass', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: process.env.F_USER_EMAIL, password: process.env.USER_PASS });
            expect(response.statusCode).toBe(404);
        });

        it('should reject login with incorrect email, incorrect pass', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: process.env.F_USER_EMAIL, password: process.env.F_USER_PASS });
            expect(response.statusCode).toBe(404);
        });
    });

    describe('POST /api/logout', () => {
        it('should clear the refreshToken cookie', async () => {
            const secureFlag = process.env.NODE_ENV !== 'development' ? ' Secure;' : '';
            const expectedSetCookie = `refreshToken=; Path=/; Expires=.*GMT; HttpOnly;${secureFlag} SameSite=Strict`;
            const response = await request(app)
                .post('/api/logout')
                .expect(200)
                .expect('Set-Cookie', new RegExp(expectedSetCookie))
                .expect('Content-Type', /json/);
            expect(response.body.data).toEqual('Logout successful');
        });
    });
    
    describe('POST /api/signup', () => {
        it('should allow singup & return token with new email, new pass', async () => {
            const user = {
                email: `test${Date.now()}@example.com`,     // Dynamic to always be new
                password: `pass${Date.now()}`,              // Dynamic to always be new
                confirmPassword: `pass${Date.now()}`        // Dynamic to always be new
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should allow singup & return token with new email, known other user correct pass', async () => {
            const user = {
                email: `test${Date.now()}@example.com`,     // Dynamic to always be new
                password: process.env.USER_PASS,
                confirmPassword: process.env.USER_PASS
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should reject signup with an existing email, existing pass', async () => {
            const user = {
                email: process.env.USER_EMAIL,
                password: process.env.USER_PASS,
                confirmPassword: process.env.USER_PASS
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(400);
        });

        it('should reject signup with an existing email, new pass', async () => {
            const user = {
                email: process.env.USER_EMAIL,
                password: `pass${Date.now()}`,          // Dynamic to always be new
                confirmPassword: `pass${Date.now()}`    // Dynamic to always be new
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(400);
        });
    });

    
    describe('POST /api/add_entity', () => {
        // Constants to help standardize and prevent typos
        const name = 'Test name'
        const street = 'Test street'
        const city = 'Test city'
        const state = 'TS'
        const stateShort = 'T'
        const stateLong = 'TSL'
        const stateNum = 'T1'
        const zip = 11111
        const zipShort = 1111
        const zipLong = 111111
        const ssn = '111-11-1111'
        const ssnShort = '111-11-111'
        const ein = '11-1111111'
        const einShort = '11-111111'

        it('should reject new entity with missing name', async () => {
            const data = {
                name: '',
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with missing street', async () => {
            const data = {
                name: name,
                street: '',
                city: city,
                state: state,
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with missing city', async () => {
            const data = {
                name: name,
                street: street,
                city: '',
                state: state,
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with missing state', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: '',
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with missing zip', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: '',
                entity_tin: ssn,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with missing entity_tin', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: '',
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('All fields must be filled');
        });

        it('should reject new entity with no authentication', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const response = await request(app)
                .post('/api/add_entity')
                .send(data);
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('No token provided');
        });

        it('should reject new entity with incorrect authentication', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: ssn,
                is_individual: true
            };
            const falseTestToken = generateFalseTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${falseTestToken}`)
                .send(data);
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should reject new entity when trying to use a duplicate SSN', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: process.env.ENTITY_SSN,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('An entity with this TIN already exists.');
        });

        it('should reject new entity when trying to use a duplicate EIN', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: process.env.ENTITY_EIN,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('An entity with this TIN already exists.');
        });

        it('should reject new entity when EIN is less than 10 characters', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: einShort,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('An EIN must be 9 digits and formatted (xx-xxxxxxx).');
        });

        it('should reject new entity when SSN is less than 11 characters', async () => {
            const data = {
                name: name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                entity_tin: ssnShort,
                is_individual: true
            };
            const testToken = generateTestToken();
            const response = await request(app)
                .post('/api/add_entity')
                .set('Authorization', `Bearer ${testToken}`)
                .send(data);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('An SSN must be 9 digits and formatted (xxx-xx-xxxx).');
        });

    });
});