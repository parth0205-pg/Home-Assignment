# Task Manager API — The Untested API (Completed Assignment)

A hardened, fully tested RESTful Task Management API built with Node.js and Express.js This project was completed as part of a 2-day technical assessment to audit an untested codebase, construct an automated test suite achieving >80% coverage, resolve multiple silent data/logic bugs, and ship a task assignment feature.

---

## Submission Links

- **Live API URL:** `https://home-assignment-sf8w.onrender.com/tasks`
- **GitHub Repository:** `https://github.com/parth0205-pg/Home-Assignment`

---

## Overview & Architecture

The API manages tasks using an in-memory data store. The codebase is organized into a modular layered architecture:

- **Routing (`src/routes/tasks.js`):** Parses HTTP requests, validates parameters, and maps responses to appropriate status codes.
- **Service Layer (`src/services/taskService.js`):** Encapsulates core business logic, filtering, pagination formulas, and in-memory state manipulation.
- **Validation Layer (`src/utils/validators.js`):** Performs defensive boundary checks on payloads before passing data to services.
- **Server Entrypoint (`src/app.js`):** Configures Express middleware, mounts routes, and manages global error interception.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation & Local Run
```bash
# Navigate to the API directory
cd task-api

# Install dependencies
npm install

# Start the server (runs on http://localhost:3000)
npm start
```

### Running Tests & Coverage Reports
```bash
# Execute Jest test suites
npm test

# Run tests and generate coverage summary
npm run coverage
```

---

## API Reference

| Method | Path | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | List tasks; supports `?status=`, `?page=`, `?limit=` (combinable) | `200` |
| `POST` | `/tasks` | Create a new task | `201`, `400` |
| `PUT` | `/tasks/:id` | Full update of an existing task (preserves system fields) | `200`, `400`, `404` |
| `DELETE` | `/tasks/:id` | Delete a task | `204`, `404` |
| `PATCH` | `/tasks/:id/complete` | Mark task as completed (retains existing priority) | `200`, `404` |
| `GET` | `/tasks/stats` | Status metric breakdown + overdue count | `200` |
| `PATCH` | `/tasks/:id/assign` | **Assign/reassign a task to a user** *(Newly Implemented)* | `200`, `400`, `404` |

### Task Data Contract
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 string | null",
  "completedAt": "ISO 8601 string | null",
  "createdAt": "ISO 8601 string",
  "assignee": "string | null"
}

---

## What Was Done

### 1. Test Suite Construction (>90% Coverage)
Engineered automated unit and integration suites using **Jest** and **Supertest** covering happy paths, negative paths, and edge cases across every endpoint:
- **Unit Tests (`tests/unit/taskService.test.js`):** Tests isolated service methods, boundary offsets, exact filtering, priority preservation, and state mutation boundariest/response cycles, parameter sanitization, malformed JSON bodies, and status codes.

### 2. Bugs Identified & Resolved

| Bug | File Location | Root Cause | Fix Applied |
| :--- | :--- | :--- | :--- |
| **Off-by-One Pagination** | `src/services/taskService.js` | Calculated `offset = page * limit`, causing `page=1` with `limit=10` to slice `10–20`, skipping the first 10 tasks. | Implemented standard 1-based indexing: `offset = (page - 1) * limit` with boundary protection. |
| **Priority Corruption on Complete** | `src/services/taskService.js` | Hardcoded `priority: 'medium'` in the updated task object, silently downgrading `high` priority tasks. | Removed hardcoded priority to retain the task's existing priority. |
| **Substring Status Matching** | `src/services/taskService.js` | Used `status.includes()`, so searching for `?status=do` matched both `todo` and `done`. | Replaced with strict equality comparison `t.status === status`. |
| **Tampering with System Fields** | `src/services/taskService.js` | Directly spread `req.body` over the stored task, allowing clients to overwrite `id` and `createdAt`. | Explicitly stripped `id` and `createdAt` from updates to keep system fields immutable. |
| **Mutually Exclusive Filters** | `src/routes/tasks.js` | Early `return res.json(...)` inside `if (status)` exited before pagination logic could run. | Composed query processing so status filters apply first, then pagination slices the filtered set. |
| **Unhandled JSON Parse / Body Crash** | `src/app.js` & `validators.js` | Direct property access on non-object bodies and unhandled body-parser syntax errors resulted in `500 Internal Server Error`. | Added defensive type validation and a global Express error handler to return clean `400 Bad Request` responses. |

### 3. Feature Implementation: `PATCH /tasks/:id/assign`
Added the ability to assign tasks with the following implementation details:
- **Validation:** Added `validateAssignTask` in `src/utils/validators.js` to ensure `assignee` is provided, is a string, and is not blank or whitespace-only.
- **Service Logic:** Added `assignTask` in `src/services/taskService.js` to trim whitespace and update the task in memory.
- **Route Handler:** Wired `PATCH /tasks/:id/assign` returning `200` on success, `400` on validation failure, and `404` if the task does not exist.
- **Test Coverage:** Added unit and integration tests verifying assignment, reassignment, empty string rejections, and missing task lookups.

---

## Reviewer Notes

### Feature Design Decisions (`PATCH /tasks/:id/assign`)
- **Input Sanitization:** Automatically trims leading and trailing whitespace from the assignee name before storing.
- **Reassignment Handling:** Calling the endpoint on an already assigned task overwrites the assignee with the new name. This avoids artificial friction and mirrors workflows in tools like GitHub Issues and Linear.
- **Strict Error Boundaries:** Payloads missing the `assignee` field or containing only whitespace return `400 Bad Request` with an explicit error message instead of corrupting state.

### Surprises in the Codebase
- **Documentation vs. Code Contract Mismatch:** The initial `README.md` documented statuses as `pending | in-progress | completed`, while `validators.js` and `taskService.js` strictly enforced `todo | in_progress | done`. This served as a strong reminder to treat executable code and test assertions as the source of truth over markdown docs.
- **Silent Mutation:** Finding `priority: 'medium'` inside `completeTask` was a classic silent bug that manual happy-path testing often misses without automated assertion checks.

### Tradeoffs Made
- **In-Memory Store vs. Refactoring to Map:** Kept the existing in-memory array (`tasks = []`) rather than refactoring to an ES6 `Map`. While a `Map` provides $O(1)$ lookups instead of $O(N)$, preserving the array kept changes minimal and reviewable without modifying the project's original architectural structure.

### What I'd Test Next with More Time
- **Concurrency & Race Conditions:** Test simultaneous asynchronous updates and deletes to verify behavior under concurrent write operations.
- **Query Parameter Boundary Fuzzing:** Test edge cases on pagination queries (e.g., negative offsets, non-numeric strings like `?page=abc`, or large integers exceeding safe limits).
- **Security Hardening:** Add automated checks for HTTP Parameter Pollution (HPP), payload body size limits, and security headers via `helmet`.

### Questions Before Shipping to Production
- What persistent database (PostgreSQL, MongoDB) will replace the temporary in-memory store?
- Should `assignee` continue to accept arbitrary strings, or should it validate against a foreign key / UUID in an authenticated users service?
- What authentication and authorization scheme (e.g., JWT, OAuth2) will govern task visibility and tenant isolation across routes?