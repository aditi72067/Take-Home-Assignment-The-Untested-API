# Bug Report

## Bug 1: Pagination returned the wrong page

### Location

`task-api/src/services/taskService.js`

### Expected behavior

For a request such as:

`GET /tasks?page=1&limit=2`

the API should return the first two tasks.

For page 2, it should return the next two tasks.

### Actual behavior

The original implementation calculated the pagination offset as:

```js
const offset = page * limit;