# Take-Home Assignment — The Untested API

A 2-day take-home assignment involving reading an unfamiliar Node.js API, writing tests, identifying and fixing a bug, and implementing a new feature.

## Overview

This repository contains a small Task Manager API built with:

- Node.js
- Express
- Jest
- Supertest
- UUID

The API uses an in-memory data store, so task data is reset whenever the application restarts.

The completed work includes:

- Unit tests for the task service
- Integration tests for the API routes using Supertest
- Happy-path tests for the API endpoints
- Edge-case tests
- Identification and correction of a pagination bug
- Regression tests for the pagination behavior
- Implementation of `PATCH /tasks/:id/assign`
- Validation and edge-case handling for task assignment
- Documentation of design decisions and testing considerations

See [ASSIGNMENT.md](./ASSIGNMENT.md) for the original assignment brief.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

From the repository root:

```bash
cd task-api
npm install
```

### Start the API

```bash
npm start
```

The API runs on:

```text
http://localhost:3000
```

### Run the tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run coverage
```

---

## Project Structure

```text
Take-Home-Assignment-The-Untested-API/
├── ASSIGNMENT.md
├── BUG_REPORT.md
├── README.md
└── task-api/
    ├── src/
    │   ├── app.js
    │   ├── routes/
    │   │   └── tasks.js
    │   ├── services/
    │   │   └── taskService.js
    │   └── utils/
    │       └── validators.js
    ├── tests/
    │   ├── app.test.js
    │   └── taskService.test.js
    ├── jest.config.js
    ├── package.json
    └── package-lock.json
```

### Important files

| File | Purpose |
|---|---|
| `src/app.js` | Express application setup |
| `src/routes/tasks.js` | API route handlers |
| `src/services/taskService.js` | Task business logic and in-memory storage |
| `src/utils/validators.js` | Input validation helpers |
| `tests/app.test.js` | API integration tests using Supertest |
| `tests/taskService.test.js` | Unit tests for the task service |
| `BUG_REPORT.md` | Documentation of the identified bug and its fix |
| `ASSIGNMENT.md` | Original assignment requirements |

---

# API Reference

The API is available under:

```text
http://localhost:3000/tasks
```

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks?status=todo` | Filter tasks by status |
| `GET` | `/tasks?page=1&limit=10` | Return a paginated list |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/:id` | Update an existing task |
| `DELETE` | `/tasks/:id` | Delete a task |
| `PATCH` | `/tasks/:id/complete` | Mark a task as complete |
| `GET` | `/tasks/stats` | Return task statistics |
| `PATCH` | `/tasks/:id/assign` | Assign a task to a user |

---

# Task Shape

A task has the following structure:

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO string | null",
  "completedAt": "ISO string | null",
  "createdAt": "ISO string"
}
```

When a task is assigned, it additionally contains:

```json
{
  "assignee": "string"
}
```

## Valid statuses

```text
todo
in_progress
done
```

## Valid priorities

```text
low
medium
high
```

---

# Sample Requests

## Create a task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write tests","priority":"high"}'
```

A successful request returns:

```text
201 Created
```

---

## List all tasks

```bash
curl http://localhost:3000/tasks
```

---

## Filter tasks by status

```bash
curl "http://localhost:3000/tasks?status=todo"
```

Supported statuses are:

```text
todo
in_progress
done
```

---

## Paginate tasks

```bash
curl "http://localhost:3000/tasks?page=1&limit=2"
```

Pagination uses 1-based page numbering.

For example:

```text
page=1, limit=2 → first two tasks
page=2, limit=2 → next two tasks
page=3, limit=2 → next two tasks
```

---

## Update a task

```bash
curl -X PUT http://localhost:3000/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated task","priority":"high"}'
```

A successful update returns:

```text
200 OK
```

If the task does not exist:

```text
404 Not Found
```

---

## Delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/<id>
```

A successful deletion returns:

```text
204 No Content
```

If the task does not exist:

```text
404 Not Found
```

---

## Complete a task

```bash
curl -X PATCH http://localhost:3000/tasks/<id>/complete
```

A successful request:

- Changes the task status to `done`
- Sets `completedAt`
- Returns the updated task

If the task does not exist:

```text
404 Not Found
```

---

## Get task statistics

```bash
curl http://localhost:3000/tasks/stats
```

The response contains counts for:

```text
todo
in_progress
done
overdue
```

Example:

```json
{
  "todo": 2,
  "in_progress": 1,
  "done": 3,
  "overdue": 1
}
```

---

# Task Assignment

## `PATCH /tasks/:id/assign`

The new feature assigns a task to a user.

### Request

```bash
curl -X PATCH http://localhost:3000/tasks/<id>/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee":"Aarti"}'
```

### Successful response

A successful assignment returns:

```text
200 OK
```

and the updated task contains:

```json
{
  "assignee": "Aarti"
}
```

---

## Assignment validation

The `assignee` must be a non-empty string.

Invalid examples include:

```json
{}
```

```json
{
  "assignee": ""
}
```

```json
{
  "assignee": "   "
}
```

```json
{
  "assignee": 123
}
```

Invalid assignment requests return:

```text
400 Bad Request
```

with an error message indicating that the assignee must be a non-empty string.

---

## Nonexistent task

If the supplied task ID does not exist:

```text
PATCH /tasks/nonexistent-id/assign
```

the API returns:

```text
404 Not Found
```

with:

```json
{
  "error": "Task not found"
}
```

---

## Already-assigned task

If a task already has an assignee, another assignment is rejected.

The API returns:

```text
409 Conflict
```

with:

```json
{
  "error": "Task is already assigned"
}
```

This prevents an existing assignment from being silently overwritten.

---

## Assignment design decisions

The assignment endpoint validates the assignee before attempting to update the task.

The task is then checked for existence.

If the task does not exist, the API returns `404 Not Found`.

If the task already has an assignee, the API returns `409 Conflict` rather than overwriting the existing assignment.

The assignee value is trimmed before it is stored so that accidental leading or trailing whitespace is not persisted.

---

# Testing

Testing was performed at both the service and API levels.

## Unit tests

`tests/taskService.test.js` tests the task service functions directly.

The unit tests cover:

- Creating tasks
- Finding tasks by ID
- Handling nonexistent task IDs
- Filtering tasks by exact status
- Pagination
- Updating tasks
- Handling updates for nonexistent tasks

## Integration tests

`tests/app.test.js` uses Supertest to test the Express application through the API routes.

The integration tests cover:

- `GET /tasks`
- `POST /tasks`
- `GET /tasks?status=...`
- `GET /tasks?page=...&limit=...`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/complete`
- `GET /tasks/stats`
- `PATCH /tasks/:id/assign`
- Request validation

---

# Edge Cases Tested

The test suite includes edge cases such as:

- Missing task title
- Empty task title
- Whitespace-only task title
- Non-string task title
- Invalid task status
- Invalid task priority
- Invalid due date
- Nonexistent task IDs
- Empty assignee
- Invalid assignee
- Nonexistent task during assignment
- Attempting to assign an already-assigned task
- Pagination with page and limit parameters
- Pagination when only page is provided
- Pagination when only limit is provided

---

# Test Coverage

The final test suite contains:

```text
30/30 tests passing
```

The recorded coverage is above the required 80% target:

| Metric | Coverage |
|---|---:|
| Statements | 95% |
| Branches | 91.3% |
| Functions | 93.33% |
| Lines | 95.86% |

The coverage report can be reproduced with:

```bash
npm run coverage
```

---

# Day 1 — Read & Test

The Day 1 work focused on understanding the existing source code and adding automated tests.

Completed Day 1 work:

- Read and reviewed the source code
- Added unit tests for `taskService.js`
- Added API integration tests using Supertest
- Covered happy paths for the API endpoints
- Added edge-case tests
- Added validation tests
- Added pagination tests
- Added completion and statistics tests
- Ran the test suite and coverage report

The resulting test suite exceeds the required 80% coverage target.

---

# Day 2 — Bug Report

## Pagination bug

A pagination bug was identified in:

```text
task-api/src/services/taskService.js
```

The original implementation calculated the pagination offset as:

```js
const offset = page * limit;
```

Because the API uses 1-based page numbering, this caused page 1 to skip the first `limit` tasks.

For example:

```text
page=1
limit=2
offset=1 * 2 = 2
```

This starts from the third task rather than the first task.

The implementation was corrected to:

```js
const offset = (page - 1) * limit;
```

This correctly makes:

```text
page=1, limit=2 → offset=0
page=2, limit=2 → offset=2
page=3, limit=2 → offset=4
```

The detailed bug report is documented in [`BUG_REPORT.md`](./BUG_REPORT.md).

A regression test verifies that the first page returns the first two tasks.

---

# Day 2 — Bug Fix

The pagination bug was fixed by changing the offset calculation from:

```js
const offset = page * limit;
```

to:

```js
const offset = (page - 1) * limit;
```

This makes the pagination behavior consistent with the API's 1-based page numbering.

The updated test suite verifies the corrected behavior.

---

# Day 2 — New Feature

The required endpoint was implemented:

```text
PATCH /tasks/:id/assign
```

The endpoint:

- Accepts an assignee name
- Stores the assignee on the task
- Returns the updated task
- Rejects invalid or empty assignee values
- Returns `404` when the task does not exist
- Returns `409` when the task is already assigned
- Trims the assignee before storing it

Tests were added for the successful assignment flow and the relevant edge cases.

---

# What I Would Test Next

If I had more time, I would add tests for:

- Negative pagination values
- Zero pagination limits
- Non-numeric pagination parameters
- Combining status filtering with pagination
- Repeated completion of an already-completed task
- Due-date boundary cases
- Malformed request bodies
- Additional assignment edge cases
- Concurrent updates to the same task

---

# What Surprised Me

One thing that stood out was that the API uses an in-memory array as its data store, meaning all task data is lost whenever the application restarts.

I also found that some validation and error-handling behavior was not explicitly covered by the original tests. Adding edge-case tests helped make these behaviors clearer and provided confidence that the API responds consistently.

---

# Questions Before Shipping to Production

Before shipping this API to production, I would clarify:

- What persistent database should be used?
- What authentication and authorization model is required?
- Which users are allowed to update, delete, complete, or assign tasks?
- What are the exact input-validation requirements?
- Should API errors follow a standardized response format?
- What logging and monitoring requirements are expected?
- Is rate limiting required?
- How should concurrent updates to the same task be handled?
- What are the backup and recovery requirements?
- Should task reassignment be supported?
- If reassignment is supported, who is authorized to perform it?

---

# Submission Checklist

The repository contains the requested Day 1 and Day 2 deliverables:

- [x] Unit tests for `taskService.js`
- [x] Integration tests using Supertest
- [x] Happy-path tests
- [x] Edge-case tests
- [x] 80%+ test coverage
- [x] Bug identified
- [x] Bug documented in `BUG_REPORT.md`
- [x] Pagination bug fixed
- [x] Regression test for the pagination fix
- [x] `PATCH /tasks/:id/assign` implemented
- [x] Assignment validation
- [x] `404` handling for nonexistent tasks
- [x] `409` handling for already-assigned tasks
- [x] Tests for the assignment endpoint
- [x] Assignment design decisions documented
- [x] Additional testing considerations documented
- [x] Codebase observations documented
- [x] Production questions documented

---

## Final Notes

The implementation focuses on the requirements of the take-home assignment rather than introducing unnecessary architectural changes.

The API intentionally continues to use in-memory storage, as provided by the original codebase.

The completed tests cover the existing behavior, the identified pagination bug and its fix, and the newly implemented task-assignment feature.