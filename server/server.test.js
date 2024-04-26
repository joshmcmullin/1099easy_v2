require('dotenv').config({ path: '.env.local' });
const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');

// let server;

// beforeAll((done) => {
//     server = app.listen(4000, () => {
//         done();
//     });
// });

function generateTestToken() {
    const userPayload = {
        user_id: process.env.USER_ID,
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASS
    }
    return jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
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

    // describe('POST /api/add_entity', () => {

    // });
});