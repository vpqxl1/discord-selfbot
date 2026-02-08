const CommandBase = require('../CommandBase');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const todoFile = path.join(logsDir, 'todos.json');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function loadTodos() {
    try {
        if (fs.existsSync(todoFile)) {
            return JSON.parse(fs.readFileSync(todoFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading todos:', error);
    }
    return [];
}

function saveTodos(todos) {
    try {
        fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving todos:', error);
    }
}

module.exports = {
    name: 'todo',
    description: 'Manage your todo list',
    aliases: ['task', 'tasks'],
    usage: 'todo <add|list|done|undone|delete|clear>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        const subcommand = args[0].toLowerCase();
        const todos = loadTodos();

        switch (subcommand) {
            case 'add':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a task description.');
                }
                const task = args.slice(1).join(' ');
                const newTodo = {
                    id: Date.now().toString(),
                    task: task,
                    completed: false,
                    created: new Date().toISOString()
                };
                todos.push(newTodo);
                saveTodos(todos);
                await base.sendSuccess(channel, `Task added (ID: ${newTodo.id})`);
                break;

            case 'list':
                if (todos.length === 0) {
                    return base.sendWarning(channel, 'No tasks in your todo list.');
                }
                const pending = todos.filter(t => !t.completed);
                const completed = todos.filter(t => t.completed);
                
                let todoList = '📋 **Todo List**\n\n';
                if (pending.length > 0) {
                    todoList += '**Pending:**\n';
                    pending.forEach(t => {
                        todoList += `☐ \`${t.id}\` ${t.task}\n`;
                    });
                }
                if (completed.length > 0) {
                    todoList += '\n**Completed:**\n';
                    completed.forEach(t => {
                        todoList += `☑ \`${t.id}\` ~~${t.task}~~\n`;
                    });
                }
                todoList += `\n**Total:** ${pending.length} pending, ${completed.length} completed`;
                await base.safeSend(channel, todoList);
                break;

            case 'done':
            case 'complete':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a task ID.');
                }
                const doneId = args[1];
                const doneTask = todos.find(t => t.id === doneId);
                if (!doneTask) {
                    return base.sendError(channel, 'Task not found.');
                }
                doneTask.completed = true;
                doneTask.completedAt = new Date().toISOString();
                saveTodos(todos);
                await base.sendSuccess(channel, `Task marked as complete: ${doneTask.task}`);
                break;

            case 'undone':
            case 'uncomplete':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a task ID.');
                }
                const undoneId = args[1];
                const undoneTask = todos.find(t => t.id === undoneId);
                if (!undoneTask) {
                    return base.sendError(channel, 'Task not found.');
                }
                undoneTask.completed = false;
                delete undoneTask.completedAt;
                saveTodos(todos);
                await base.sendSuccess(channel, `Task marked as incomplete: ${undoneTask.task}`);
                break;

            case 'delete':
            case 'remove':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a task ID.');
                }
                const deleteId = args[1];
                const initialLength = todos.length;
                const filteredTodos = todos.filter(t => t.id !== deleteId);
                if (filteredTodos.length === initialLength) {
                    return base.sendError(channel, 'Task not found.');
                }
                saveTodos(filteredTodos);
                await base.sendSuccess(channel, 'Task deleted.');
                break;

            case 'clear':
                const completedTodos = todos.filter(t => t.completed);
                if (completedTodos.length === 0) {
                    return base.sendWarning(channel, 'No completed tasks to clear.');
                }
                const remainingTodos = todos.filter(t => !t.completed);
                saveTodos(remainingTodos);
                await base.sendSuccess(channel, `Cleared ${completedTodos.length} completed tasks.`);
                break;

            default:
                await this.showHelp(channel, base);
        }
    },

    async showHelp(channel, base) {
        const help = `📋 **Todo List Help**
• \`todo add <task>\` - Add a new task
• \`todo list\` - Show all tasks
• \`todo done <id>\` - Mark task as complete
• \`todo undone <id>\` - Mark task as incomplete
• \`todo delete <id>\` - Delete a task
• \`todo clear\` - Clear completed tasks`;
        await base.safeSend(channel, help);
    }
};
