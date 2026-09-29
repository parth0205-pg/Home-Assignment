const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

//I noticed the app crashed with a 500 error whenever a request body was empty or not an object
//I added a quick check here to make sure we actually received a valid JSON object before trying to read properties from it
const validateCreateTask = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'request body must be a valid JSON object';
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return 'title is required and must be a non-empty string';
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    return `priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }
  if (body.dueDate && isNaN(Date.parse(body.dueDate))) {
    return 'dueDate must be a valid ISO date string';
  }
  return null;
};

const validateUpdateTask = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'request body must be a valid JSON object';
  }
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
    return 'title must be a non-empty string';
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    return `priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }
  if (body.dueDate && isNaN(Date.parse(body.dueDate))) {
    return 'dueDate must be a valid ISO date string';
  }
  return null;
};

//This is the validation helper for our new assign feature
//It ensures that the assignee field is present, is actually text, and isn't just a blank string or empty spaces, returning a 400 error if any check fails
const validateAssignTask = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'request body must be a valid JSON object';
  }
  if (body.assignee === undefined || typeof body.assignee !== 'string') {
    return 'assignee is required and must be a string';
  }
  if (body.assignee.trim() === '') {
    return 'assignee must not be empty or whitespace';
  }
  return null;
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  VALID_STATUSES,
  VALID_PRIORITIES,
};