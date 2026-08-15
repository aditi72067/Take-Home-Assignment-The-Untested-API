# Bug Report

## Bug 1: Pagination returned the wrong page

### Location

`task-api/src/services/taskService.js`

### Endpoint

`GET /tasks?page=<page>&limit=<limit>`

### Expected behavior

The API should use 1-based page numbering for pagination.

For example, with the following request:

`GET /tasks?page=1&limit=2`

the API should return the first two tasks.

For:

`GET /tasks?page=2&limit=2`

the API should return the third and fourth tasks.

Therefore:

- Page 1 with limit 2 → tasks 1–2
- Page 2 with limit 2 → tasks 3–4
- Page 3 with limit 2 → tasks 5–6

### Actual behavior

The original implementation calculated the pagination offset as:

```js
const offset = page * limit;
```

This incorrectly treats the page number as zero-based.

For example, when requesting:

`GET /tasks?page=1&limit=2`

the calculated offset was:

```text
1 * 2 = 2
```

This caused the API to skip the first two tasks and return tasks starting from the third task.

### How I discovered it

I tested the `GET /tasks` endpoint with pagination parameters after reviewing the existing pagination implementation.

I created multiple tasks and tested requests using different page and limit values.

When testing:

`GET /tasks?page=1&limit=2`

the API did not return the first two tasks as expected.

I traced the request through `src/routes/tasks.js` to `src/services/taskService.js` and found that the pagination offset was calculated using:

```js
const offset = page * limit;
```

The problem was that the API's page numbering starts at 1, so the offset needs to be calculated from `page - 1`.

### Root cause

The root cause was an off-by-one error in the pagination calculation.

The implementation used:

```js
page * limit
```

instead of:

```js
(page - 1) * limit
```

Because page numbers are 1-based, page 1 must have an offset of 0.

### Fix

The pagination calculation was changed from:

```js
const offset = page * limit;
```

to:

```js
const offset = (page - 1) * limit;
```

The corrected implementation is:

```js
const getPaginated = (page, limit) => {
  const offset = (page - 1) * limit;
  return tasks.slice(offset, offset + limit);
};
```

### Why this fixes the bug

With the corrected calculation:

For page 1 and limit 2:

```text
(page - 1) * limit
= (1 - 1) * 2
= 0
```

The API therefore starts from the first task.

For page 2 and limit 2:

```text
(page - 1) * limit
= (2 - 1) * 2
= 2
```

The API starts from the third task.

For page 3 and limit 2:

```text
(page - 1) * limit
= (3 - 1) * 2
= 4
```

The API starts from the fifth task.

### Verification

Tests were added/updated to verify the pagination behavior.

The tests verify that:

- Page 1 returns the first set of tasks.
- Page 2 returns the next set of tasks.
- The requested limit is respected.
- The corrected offset calculation returns the expected tasks.

The existing test suite was run after the fix to ensure that the change did not break the existing functionality.

### Summary

The pagination bug was caused by an off-by-one error in the offset calculation.

The original implementation:

```js
const offset = page * limit;
```

was corrected to:

```js
const offset = (page - 1) * limit;
```

This makes the API correctly treat pagination pages as 1-based.