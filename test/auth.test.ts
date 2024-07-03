import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 400 if username is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'password' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return a valid JWT token for correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    // Verify the JWT token
    const decodedToken = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as { username: string };
    expect(decodedToken.username).toBe('admin');
  });

  it('should return a token that expires in 1 hour', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });
    expect(res.status).toBe(200);

    const decodedToken = jwt.decode(res.body.token) as { exp: number, iat: number };
    const expirationTime = decodedToken.exp - decodedToken.iat;
    expect(expirationTime).toBe(3600); // 1 hour in seconds
  });
});