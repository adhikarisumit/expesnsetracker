const request = require('supertest');
const app = require('../server');

describe('Yen Budget Manager API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/categories', () => {
    it('should return empty categories array initially', async () => {
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = { name: 'Test Category' };
      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Category');
    });

    it('should reject empty category name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/transactions', () => {
    it('should return empty transactions array initially', async () => {
      const response = await request(app).get('/api/transactions');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        date: '2024-01-15',
        type: 'expense',
        category: 'Food',
        amount: 25.50,
        note: 'Lunch'
      };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(newTransaction);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('amount', 25.50);
    });

    it('should reject transaction with missing required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({ date: '2024-01-15' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/settings', () => {
    it('should return settings object', async () => {
      const response = await request(app).get('/api/settings');
      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });
  });

  describe('POST /api/settings', () => {
    it('should create/update a setting', async () => {
      const setting = { key: 'theme', value: 'dark' };
      const response = await request(app)
        .post('/api/settings')
        .send(setting);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('key', 'theme');
      expect(response.body).toHaveProperty('value', 'dark');
    });
  });
});
