require('dotenv').config({ path: '.env.local' });
const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');

let server;

beforeAll((done) => {
    server = app.listen(4000, () => {
        done();
    });
});

function generateTestToken() {
    const userPayload = {
        user_id: 1,
        email: 'test@test.com',
        password: '123'
    }
    return jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

describe('Server functions', () => {

    describe('GET /dashboard', () => {
        it('should require authentication', async () => {
            const response = await request(server).get('/dashboard');
            expect(response.statusCode).toBe(401);
        });

        it('should return entities for the authenticated user', async () => {
            const testToken = generateTestToken();
            const response = await request(server)
                .get('/dashboard')
                .set('Authorization', `Bearer ${testToken}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    /*
    * Need more tests here:
    * correct email, correct pass
    * correct email, wrong pass
    * wrong email, wrong pass
    * wrong email, correct pass 
    */
    describe('POST /api/login', () => {
        it('should log in an existing user with correct credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@test.com', password: '123' });
            expect(response.statusCode).toBe(200);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should reject login with incorrect credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@test.com', password: 'wrongpassword' });
            expect(response.statusCode).toBe(401);
        });
    });

    describe('POST /api/signup', () => {
        it('should create a new user and return an access token', async () => {
            const user = {
                email: `test${Date.now()}@example.com`, // Dynamic email to ensure always a new user
                password: 'newpassword123',
                confirmPassword: 'newpassword123'
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should reject signup with an existing email', async () => {
            const user = {
                email: 'test@test.com',
                password: 'password123',
                confirmPassword: 'password123'
            };
            const response = await request(app)
                .post('/api/signup')
                .send(user);
            expect(response.statusCode).toBe(400);
        });
    });
});