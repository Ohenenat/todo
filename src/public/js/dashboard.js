document.addEventListener('DOMContentLoaded', () => {
    const tasksList = document.getElementById('tasksList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const closeModal = document.querySelector('.close-modal');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    let tasks = [];
    let currentFilter = 'all';
    let currentTask = null;

    // Check for notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Fetch user info from JWT
    function getUserInfo() {
        const token = document.cookie
            .split(';')
            .find(c => c.trim().startsWith('jwt='));
        if (token) {
            const tokenValue = token.split('=')[1];
            try {
                const payload = JSON.parse(atob(tokenValue.split('.')[1]));
                return payload;
            } catch (error) {
                console.error('Error parsing JWT:', error);
                return null;
            }
        }
        return null;
    }

    // Update greeting
    function updateGreeting() {
        const userInfo = getUserInfo();
        if (userInfo && userInfo.first_name) {
            const greetingElement = document.getElementById('userGreeting');
            if (greetingElement) {
                greetingElement.textContent = `Hi, ${userInfo.first_name}`;
                greetingElement.style.marginRight = '10px';
                greetingElement.style.fontSize = '16px';
            }
        }
    }

    // Fetch and display tasks
    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch tasks');
            }
            tasks = await response.json();
            renderTasks();
            setupReminders();
            updateGreeting();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    // Render tasks based on current filter and search
    function renderTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                                task.description.toLowerCase().includes(searchTerm);
            
            switch (currentFilter) {
                case 'completed':
                    return task.completed && matchesSearch;
                case 'pending':
                    return !task.completed && matchesSearch;
                case 'overdue':
                    return !task.completed && new Date(task.due_date) < new Date() && matchesSearch;
                default:
                    return matchesSearch;
            }
        });

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-card ${task.completed ? 'task-completed' : ''}">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description || ''}</div>
                    <div class="task-meta">
                        ${task.due_date ? `Due: ${new Date(task.due_date).toLocaleString()}` : ''}
                        ${task.reminder_time ? `<br>Reminder: ${new Date(task.reminder_time).toLocaleString()}` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-outline" onclick="toggleComplete(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
                    <button class="btn btn-primary" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-outline" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Setup reminders for tasks
    function setupReminders() {
        tasks.forEach(task => {
            if (task.reminder_time && !task.completed) {
                const reminderTime = new Date(task.reminder_time);
                if (reminderTime > new Date()) {
                    setTimeout(() => {
                        if (Notification.permission === 'granted') {
                            new Notification('Task Reminder', {
                                body: `Task "${task.title}" is due!`,
                                icon: '/favicon.ico'
                            });
                        } else {
                            alert(`Task Reminder: ${task.title} is due!`);
                        }
                    }, reminderTime - new Date());
                }
            }
        });
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', () => {
        currentTask = null;
        taskForm.reset();
        document.getElementById('modalTitle').textContent = 'Add New Task';
        taskModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        taskModal.classList.add('hidden');
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            due_date: document.getElementById('taskDueDate').value || null,
            reminder_time: document.getElementById('taskReminder').value || null
        };

        try {
            const url = currentTask ? `/api/tasks/${currentTask.id}` : '/api/tasks';
            const method = currentTask ? 'PUT' : 'POST';
            
            if (currentTask) {
                taskData.completed = currentTask.completed;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) throw new Error('Failed to save task');

            taskModal.classList.add('hidden');
            await fetchTasks();
        } catch (err) {
            console.error('Error:', err);
        }
    });

    searchInput.addEventListener('input', renderTasks);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (err) {
            console.error('Error:', err);
        }
    });

    // Global functions
    window.toggleComplete = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...task,
                    completed: !task.completed
                })
            });

            if (!response.ok) throw new Error('Failed to update task');
            await fetchTasks();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    window.editTask = (taskId) => {
        currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;

        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = currentTask.title;
        document.getElementById('taskDescription').value = currentTask.description || '';
        document.getElementById('taskDueDate').value = currentTask.due_date ? new Date(currentTask.due_date).toISOString().slice(0, 16) : '';
        document.getElementById('taskReminder').value = currentTask.reminder_time ? new Date(currentTask.reminder_time).toISOString().slice(0, 16) : '';
        
        taskModal.classList.remove('hidden');
    };

    window.deleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');
            await fetchTasks();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // Initial fetch
    fetchTasks();
});