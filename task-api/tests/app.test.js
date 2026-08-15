const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('GET /tasks returns an empty array initially', async () => {
    const response = await request(app)
      .get('/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /tasks creates a new task', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Learn Supertest'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Learn Supertest');
    expect(response.body.status).toBe('todo');
  });

  test('POST /tasks returns 400 when title is missing', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({});

    expect(response.statusCode).toBe(400);
  });

  test('GET /tasks returns created tasks', async () => {
    await request(app)
      .post('/tasks')
      .send({
        title: 'Task 1'
      });

    await request(app)
      .post('/tasks')
      .send({
        title: 'Task 2'
      });

    const response = await request(app)
      .get('/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe('Task 1');
    expect(response.body[1].title).toBe('Task 2');
  });

  test('GET /tasks?status=todo filters tasks by status', async () => {
    await request(app)
      .post('/tasks')
      .send({
        title: 'Todo Task',
        status: 'todo'
      });

    await request(app)
      .post('/tasks')
      .send({
        title: 'Progress Task',
        status: 'in_progress'
      });

    const response = await request(app)
      .get('/tasks?status=todo');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Todo Task');
    expect(response.body[0].status).toBe('todo');
  });

  test('GET /tasks?page=1&limit=2 returns paginated tasks', async () => {
    await request(app)
      .post('/tasks')
      .send({ title: 'Task 1' });

    await request(app)
      .post('/tasks')
      .send({ title: 'Task 2' });

    await request(app)
      .post('/tasks')
      .send({ title: 'Task 3' });

    const response = await request(app)
      .get('/tasks?page=1&limit=2');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe('Task 1');
    expect(response.body[1].title).toBe('Task 2');
  });

  test('PUT /tasks/:id updates an existing task', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Original Task'
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .put(`/tasks/${taskId}`)
      .send({
        title: 'Updated Task'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.title).toBe('Updated Task');
  });

  test('PUT /tasks/:id returns 404 for a nonexistent task', async () => {
    const response = await request(app)
      .put('/tasks/nonexistent-id')
      .send({
        title: 'Updated Task'
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('DELETE /tasks/:id deletes an existing task', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to Delete'
      });

    const taskId = createResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/tasks/${taskId}`);

    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app)
      .get('/tasks');

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toEqual([]);
  });

  test('DELETE /tasks/:id returns 404 for a nonexistent task', async () => {
    const response = await request(app)
      .delete('/tasks/nonexistent-id');

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('PATCH /tasks/:id/complete marks a task as completed', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Complete Me'
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/complete`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.status).toBe('done');
    expect(response.body).toHaveProperty('completedAt');
  });

  test('PATCH /tasks/:id/complete returns 404 for a nonexistent task', async () => {
    const response = await request(app)
      .patch('/tasks/nonexistent-id/complete');

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('GET /tasks/stats returns task statistics', async () => {
    await request(app)
      .post('/tasks')
      .send({
        title: 'Todo Task',
        status: 'todo'
      });

    await request(app)
      .post('/tasks')
      .send({
        title: 'Progress Task',
        status: 'in_progress'
      });

    const response = await request(app)
      .get('/tasks/stats');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('todo');
    expect(response.body).toHaveProperty('in_progress');
    expect(response.body).toHaveProperty('done');
    expect(response.body).toHaveProperty('overdue');

    expect(response.body.todo).toBe(1);
    expect(response.body.in_progress).toBe(1);
    expect(response.body.done).toBe(0);
  });

  test('GET /tasks returns all tasks', async () => {
    const response = await request(app)
      .get('/tasks');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /tasks filters tasks by status', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Status Test Task',
        status: 'todo'
      });

    expect(createResponse.statusCode).toBe(201);

    const response = await request(app)
      .get('/tasks?status=todo');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    response.body.forEach((task) => {
      expect(task.status).toBe('todo');
    });
  });

  test('GET /tasks supports pagination', async () => {
    const response = await request(app)
      .get('/tasks?page=1&limit=2');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(2);
  });

  test('GET /tasks supports pagination when only page is provided', async () => {
    const response = await request(app)
      .get('/tasks?page=1');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /tasks supports pagination when only limit is provided', async () => {
    const response = await request(app)
      .get('/tasks?limit=2');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('PATCH /tasks/:id/assign assigns a task to a user', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Assignment Test Task'
      });

    expect(createResponse.statusCode).toBe(201);

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'Aarti'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.assignee).toBe('Aarti');
  });

  test('PATCH /tasks/:id/assign rejects an empty assignee', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Invalid Assignment Task'
      });

    expect(createResponse.statusCode).toBe(201);

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: ''
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      'assignee must be a non-empty string'
    );
  });

  test('PATCH /tasks/:id/assign returns 404 for a non-existent task', async () => {
    const response = await request(app)
      .patch('/tasks/non-existent-id/assign')
      .send({
        assignee: 'Aarti'
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('PATCH /tasks/:id/assign rejects a second assignment', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Already Assigned Task'
      });

    expect(createResponse.statusCode).toBe(201);

    const taskId = createResponse.body.id;

    const firstResponse = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'Aarti'
      });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body.assignee).toBe('Aarti');

    const secondResponse = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'Jane'
      });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.body.error).toBe(
      'Task is already assigned'
    );
  });

  test('validators reject invalid create task inputs', () => {
    const {
      validateCreateTask,
      validateUpdateTask,
      validateAssignTask
    } = require('../src/utils/validators');

    expect(validateCreateTask({})).toBe(
      'title is required and must be a non-empty string'
    );

    expect(validateCreateTask({ title: '' })).toBe(
      'title is required and must be a non-empty string'
    );

    expect(validateCreateTask({ title: '   ' })).toBe(
      'title is required and must be a non-empty string'
    );

    expect(validateCreateTask({ title: 123 })).toBe(
      'title is required and must be a non-empty string'
    );

    expect(validateCreateTask({
      title: 'Test',
      status: 'invalid'
    })).toContain('status must be one of');

    expect(validateCreateTask({
      title: 'Test',
      priority: 'invalid'
    })).toContain('priority must be one of');

    expect(validateCreateTask({
      title: 'Test',
      dueDate: 'invalid-date'
    })).toBe(
      'dueDate must be a valid ISO date string'
    );

    expect(validateCreateTask({
      title: 'Valid Task',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-12-31'
    })).toBeNull();

    expect(validateUpdateTask({
      title: ''
    })).toBe(
      'title must be a non-empty string'
    );

    expect(validateUpdateTask({
      title: 'Valid',
      status: 'invalid'
    })).toContain('status must be one of');

    expect(validateUpdateTask({
      title: 'Valid',
      priority: 'invalid'
    })).toContain('priority must be one of');

    expect(validateUpdateTask({
      title: 'Valid',
      dueDate: 'invalid-date'
    })).toBe(
      'dueDate must be a valid ISO date string'
    );

    expect(validateUpdateTask({
      title: 'Valid',
      status: 'done',
      priority: 'high',
      dueDate: '2026-12-31'
    })).toBeNull();

    expect(validateAssignTask({})).toBe(
      'assignee is required and must be a non-empty string'
    );

    expect(validateAssignTask({
      assignee: ''
    })).toBe(
      'assignee is required and must be a non-empty string'
    );

    expect(validateAssignTask({
      assignee: 'Aarti'
    })).toBeNull();
  });
});