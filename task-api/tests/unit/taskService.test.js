//Unit Test Suite for Task Service Logic

/* 
In this file, I test the internal business logic and in-memory data store directly without going through HTTP.

These tests verify task creation defaults, calculate statistics and overdue deadlines, test deletion,
and prove our bug fixes—including correcting the 1-based pagination formula, switching to exact status matches,
preventing task priority from getting corrupted on completion, and keeping system IDs and timestamps immutable.
*/

const taskService = require('../../src/services/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create & findById', () => {
    it('creates a task with defaults and returns it', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.assignee).toBeNull();
      expect(taskService.findById(task.id)).toEqual(task);
    });
  });

  describe('getByStatus', () => {
    it('matches exact status and does not match substrings', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      expect(taskService.getByStatus('todo').length).toBe(1);
      expect(taskService.getByStatus('do').length).toBe(0);
    });
  });

  describe('getPaginated', () => {
    it('calculates 1-based page offsets correctly without skipping items', () => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page1 = taskService.getPaginated(1, 5);
      expect(page1.length).toBe(5);
      expect(page1[0].title).toBe('Task 1');

      const page2 = taskService.getPaginated(2, 5);
      expect(page2.length).toBe(5);
      expect(page2[0].title).toBe('Task 6');
    });
  });

  describe('completeTask', () => {
    it('preserves existing priority when marked complete', () => {
      const task = taskService.create({ title: 'Urgent', priority: 'high' });
      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('high');
      expect(completed.completedAt).not.toBeNull();
    });

    it('returns null if task not found', () => {
      expect(taskService.completeTask('non-existent')).toBeNull();
    });
  });

  describe('update', () => {
    it('protects id and createdAt from being overwritten', () => {
      const task = taskService.create({ title: 'Original' });
      const originalId = task.id;
      const originalCreatedAt = task.createdAt;

      const updated = taskService.update(originalId, {
        id: 'tampered-id',
        createdAt: '1970-01-01',
        title: 'Updated',
      });

      expect(updated.id).toBe(originalId);
      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.title).toBe('Updated');
    });

    it('returns null when updating non-existent id', () => {
      expect(taskService.update('bad-id', { title: 'New' })).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes an existing task and returns true', () => {
      const task = taskService.create({ title: 'To Delete' });
      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('returns false for unknown id', () => {
      expect(taskService.remove('fake-id')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('calculates counts and overdue tasks correctly', () => {
      const past = new Date(Date.now() - 10000000).toISOString();
      const future = new Date(Date.now() + 10000000).toISOString();

      taskService.create({ title: 'T1', status: 'todo', dueDate: past });
      taskService.create({ title: 'T2', status: 'done', dueDate: past });
      taskService.create({ title: 'T3', status: 'in_progress', dueDate: future });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('assignTask', () => {
    it('assigns assignee and trims whitespace', () => {
      const task = taskService.create({ title: 'Task to assign' });
      const assigned = taskService.assignTask(task.id, '  Parth Pandya  ');

      expect(assigned.assignee).toBe('Parth Pandya');
    });

    it('returns null for invalid task id', () => {
      expect(taskService.assignTask('invalid-id', 'Parth')).toBeNull();
    });
  });
});