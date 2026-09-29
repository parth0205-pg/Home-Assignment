const { v4: uuidv4 } = require('uuid');

let tasks = [];

const getAll = () => [...tasks];

const findById = (id) => tasks.find((t) => t.id === id);

//The original code used includes which checked if the status contained the letters as a substring
//This caused a search for do to return both todo and done tasks
//I changed this to check for an exact match
const getByStatus = (status) => tasks.filter((t) => t.status === status);

//Because page numbers start at 1 for users, multiplying page by limit was skipping the entire first page of results
//I fixed the math by subtracting 1 from the page number first, and added safeguards so negative numbers or zero won't break the array slice
const getPaginated = (page, limit, taskList = tasks) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const offset = (safePage - 1) * safeLimit;
  return taskList.slice(offset, offset + safeLimit);
};

const getStats = () => {
  const now = new Date();
  const counts = { todo: 0, in_progress: 0, done: 0 };
  let overdue = 0;

  tasks.forEach((t) => {
    if (counts[t.status] !== undefined) counts[t.status]++;
    if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
      overdue++;
    }
  });

  return { ...counts, overdue };
};

//I added assignee with a default empty value to the new task structure so every task has a consistent shape from the moment it is created
const create = ({ title, description = '', status = 'todo', priority = 'medium', dueDate = null }) => {
  const task = {
    id: uuidv4(),
    title: title ? title.trim() : '',
    description,
    status,
    priority,
    dueDate,
    completedAt: null,
    createdAt: new Date().toISOString(),
    assignee: null,
  };
  tasks.push(task);
  return task;
};

//To prevent users from tampering with primary keys or audit timestamps, I explicitly pull out the original id and creation date and ignore any replacement values sent in the request.
const update = (id, fields) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = tasks[index];
  const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...allowedFields } = fields;

  const updated = {
    ...current,
    ...allowedFields,
    id: current.id,
    createdAt: current.createdAt,
  };

  tasks[index] = updated;
  return updated;
};

const remove = (id) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
};

//When completing a task, the original code had hardcoded the priority to medium
//I removed that line so whatever priority the task already had remains untouched
const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};

//This function handles the assignment logic. It finds the task by its ID, trims any unnecessary spaces from the assignee name, saves the updated name, and returns the modified task
// If the task does not exist, it returns nothing so the route can send a 404
const assignTask = (id, assignee) => {
  const task = findById(id);
  if (!task) return null;

  task.assignee = assignee.trim();
  return task;
};

const _reset = () => {
  tasks = [];
};

//I made sure to export our new assignTask function here so our routes and automated unit tests can call it without throwing a missing function error
module.exports = {
  getAll,
  findById,
  getByStatus,
  getPaginated,
  getStats,
  create,
  update,
  remove,
  completeTask,
  assignTask,
  _reset,
};