const request = require('supertest');
const app = require('./server');

describe('Server functions', () => {
    describe('GET /dashboard', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/dashboard');
            expect(response.statusCode).toBe(401);
        });

        it('should return entities for the authenticated user', async () => {
            const response = await request(app)
                .get('/dashboard')
                .set('Authorization', `Bearer ${yourTestToken}`); // TODO: Replace token
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/login', () => {
        it('should log in an existing user with correct credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com', password: 'password123' }); // TODO: Swap for real user & pass
            expect(response.statusCode).toBe(200);
            expect(response.body.accessToken).toBeDefined();
        });

        it('should reject login with incorrect credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });
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
            expect(response.body.accessToken).toBeDefined();
        });

        it('should reject signup with an existing email', async () => {
            const user = {
                email: 'existing@example.com', // TODO: Replace for real user
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