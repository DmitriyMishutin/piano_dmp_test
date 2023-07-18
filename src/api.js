/** @typedef {"waiting"| "in-progress"| "done"} TaskStatus */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} name
 * @property {TaskStatus} status
 * @property {number} order
 */

/**
 * @typedef {Object} TaskReadResponse
 */

/**
 * @typedef {Object} TaskReadResponse
 * @property {Task[]} tasks
 */

/**
 * @typedef {Object} Api
 * @property {()=> PromiseLike<TaskReadResponse>} read
 * @property {(task: Task)=> PromiseLike<Task>}  update
 * @property {(tasks: Task[])=> PromiseLike<Task[]>} batchUpdate
 */

/** @type {TaskStatus[]}*/
const taskStatuses = ["waiting", "in-progress", "done"];

/**
 * @param {number} index
 * @returns {Task}
 */
const createTask = (index) => ({
    id: `task-${index}`,
    name: `Task name ${index}`,
    status: taskStatuses[index % taskStatuses.length],
    order: index,
});

/**@type {Api} */
const api = (() => {
    let state = new Array(10).fill(null).map((_, i) => createTask(i));

    const read = () =>
        Promise.resolve({ tasks: state.map((task) => ({ ...task })) });

    /**
     * @param {Task} task
     * @returns {string | undefined}
     */
    const validate = (task) => {
        if (!state.some((t) => t.id === task.id)) {
            return `Task with id:${task.id} doesn't exist`;
        }

        if (
            !Object.keys(task).every((key) =>
                ["id", "name", "status", "order"].includes(key)
            )
        ) {
            return 'Task should contain only ["id", "name", "status", "order"] fields';
        }

        if (typeof task.name !== "string") {
            return "Name should be a string";
        }

        if (typeof task.order !== "number") {
            return "Order should be a number";
        }

        if (!taskStatuses.includes(task.status)) {
            return `status should be one of [${taskStatuses.join()}]`;
        }

        return undefined;
    };

    /**
     * @param {Task} task
     * @returns {PromiseLike<Task>}
     */
    const update = (task) => {
        const error = validate(task);

        if (error) {
            return Promise.reject({ error, id: task.id });
        }

        state = state.map((t) => (t.id === task.id ? task : t));
        return Promise.resolve(task);
    };

    /**
     * @param {Task[]} task
     * @returns {PromiseLike<Task[]>}
     */
    const batchUpdate = (tasks) => {
        if (!Array.isArray(tasks) || tasks.length === 0) {
            return Promise.reject({ error: "Expected non-empty task list" });
        }

        const invalid = tasks.find((t) => validate(t));

        if (invalid) {
            return Promise.reject({ error: validate(invalid), id: invalid.id });
        }

        /** @type {Record<string, Task>} */
        const taskMap = tasks.reduce((acc, task) => {
            acc[task.id] = task;

            return acc;
        }, {});

        state = state.map((t) => (taskMap[t.id] ? taskMap[t.id] : t));

        return Promise.resolve(tasks);
    };

    return { read, update, batchUpdate };
})();

export default api;
