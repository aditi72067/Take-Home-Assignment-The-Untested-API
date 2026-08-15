const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates a task with a title', () => {
    const task = taskService.create({
      title: 'Learn Jest',
    });

    expect(task.title).toBe('Learn Jest');
  });

  test('returns the first page of tasks correctly', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    taskService.create({ title: 'Task 3' });

    const result = taskService.getPaginated(1, 2);

    expect(result.map((task) => task.title)).toEqual([
      'Task 1',
      'Task 2',
    ]);
  });

  test('finds a task by id', () => {
    const task = taskService.create({
      title: 'Find me',
    });

    const result = taskService.findById(task.id);

    expect(result).toEqual(task);
  });

  test('returns undefined when task id does not exist', () => {
    const result = taskService.findById('does-not-exist');

    expect(result).toBeUndefined();
  });

  test('filters tasks by exact status', () => {
    taskService.create({
      title: 'Todo task',
      status: 'todo',
    });

    taskService.create({
      title: 'Progress task',
      status: 'in_progress',
    });

    taskService.create({
      title: 'Done task',
      status: 'done',
    });

    const result = taskService.getByStatus('done');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Done task');
  });

  test('updates an existing task', () => {
    const task = taskService.create({
      title: 'Original title',
      description: 'Original description',
    });

    const updated = taskService.update(task.id, {
      title: 'Updated title',
    });

    expect(updated.title).toBe('Updated title');
    expect(updated.description).toBe('Original description');
  });

  test('returns null when updating a task that does not exist', () => {
    const result = taskService.update('does-not-exist', {
      title: 'Updated title',
    });

    expect(result).toBeNull();
  });
});