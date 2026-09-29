//Integration Test Suite for Task API Endpoints

/* In this file, I test the complete HTTP request and response cycle of the Express API using Supertest.

These tests verify that all routes return proper status codes (like 200, 201, 204, 400, and 404),
handle client payloads and bad data gracefully, correctly combine status filters with pagination,
and thoroughly test all success and failure edge cases for our new task assignment endpoint.
*/

const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('Task API Integration Endpoints', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    it('creates a task with valid body (201)', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Integration Test', priority: 'high' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Integration Test');
      expect(res.body.priority).toBe('high');
      expect(res.body.id).toBeDefined();
    });

    it('rejects missing or empty title (400)', async () => {
      const res = await request(app).post('/tasks').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects invalid status (400)', async () => {
      const res = await request(app).post('/tasks').send({ title: 'T', status: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('rejects non-object or null body gracefully (400)', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('null');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /tasks', () => {
    it('returns all tasks (200)', async () => {
      await request(app).post('/tasks').send({ title: 'T1' });
      await request(app).post('/tasks').send({ title: 'T2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('filters by status and supports combined pagination', async () => {
      await request(app).post('/tasks').send({ title: 'T1', status: 'todo' });
      await request(app).post('/tasks').send({ title: 'T2', status: 'todo' });
      await request(app).post('/tasks').send({ title: 'T3', status: 'done' });

      const res = await request(app).get('/tasks?status=todo&page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('T1');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('updates a task successfully (200)', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Original' });
      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });

    it('returns 404 for unknown task ID', async () => {
      const res = await request(app).put('/tasks/missing-id').send({ title: 'New' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes an existing task (204)', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Delete me' });
      const res = await request(app).delete(`/tasks/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app).delete('/tasks/missing-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('marks a task complete (200)', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Task to complete' });
      const res = await request(app).patch(`/tasks/${created.body.id}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('returns 404 if not found', async () => {
      const res = await request(app).patch('/tasks/missing-id/complete');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /tasks/stats', () => {
    it('returns stats payload', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('todo');
      expect(res.body).toHaveProperty('in_progress');
      expect(res.body).toHaveProperty('done');
      expect(res.body).toHaveProperty('overdue');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('assigns user successfully (200)', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Feature test' });
      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: 'Parth' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Parth');
    });

    it('returns 400 for empty or whitespace-only assignee', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Feature test' });
      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when assignee property is missing', async () => {
      const created = await request(app).post('/tasks').send({ title: 'Feature test' });
      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 404 if task does not exist', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-uuid/assign')
        .send({ assignee: 'Parth' });

      expect(res.status).toBe(404);
    });
  });
});