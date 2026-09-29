const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

//I imported our new assignee validator function here so the assign route can use it without triggering an undefined reference error
const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
} = require('../utils/validators');

router.get('/stats', (req, res) => {
  const stats = taskService.getStats();
  res.json(stats);
});

//Previously, filtering by status immediately sent back the response and ignored any page or limit queries in the same request
//I restructured this so it filters the tasks first and then applies pagination if requested

router.get('/', (req, res) => {
  const { status, page, limit } = req.query;

  let result = status ? taskService.getByStatus(status) : taskService.getAll();

  if (page !== undefined || limit !== undefined) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    result = taskService.getPaginated(pageNum, limitNum, result);
  }

  res.json(result);
});

router.post('/', (req, res) => {
  const error = validateCreateTask(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const task = taskService.create(req.body);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const error = validateUpdateTask(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const task = taskService.update(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

//This is the new route for assigning a task
//It runs the request body through our assignee validator first, updates the task through the service, and returns either a 404 if the task is missing or a 200 with the freshly updated task
router.patch('/:id/assign', (req, res) => {
  const error = validateAssignTask(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const task = taskService.assignTask(req.params.id, req.body.assignee);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.delete('/:id', (req, res) => {
  const deleted = taskService.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(204).send();
});

router.patch('/:id/complete', (req, res) => {
  const task = taskService.completeTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

module.exports = router;