console.log('Starting server...');

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db, User, Project, Task } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// ===== Authentication Middleware =====
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        req.user = req.session.user;
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

// ===== Database Initialization =====
async function initDatabase() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
        await db.sync();
        console.log('Database synced.');
    } catch (error) {
        console.error('Unable to connect or sync database:', error);
        process.exit(1);
    }
}
initDatabase();

// ===== Auth Routes =====

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error in /api/register:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid email or password' });

        req.session.user = { id: user.id, username: user.username, email: user.email };
        res.json({ message: 'Login successful' });
    } catch (err) {
        console.error('Error in /api/login:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// ===== Project Routes (Protected) =====

// Get all projects for logged-in user
app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
        const projects = await Project.findAll({ where: { userId: req.user.id } });
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a project by ID
app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
        const project = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new project
app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
        const { name, description, status, dueDate } = req.body;
        const project = await Project.create({ name, description, status, dueDate, userId: req.user.id });
        res.status(201).json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a project
app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, description, status, dueDate } = req.body;
        const [updated] = await Project.update(
            { name, description, status, dueDate },
            { where: { id: req.params.id, userId: req.user.id } }
        );
        if (!updated) return res.status(404).json({ message: 'Project not found' });
        const updatedProject = await Project.findByPk(req.params.id);
        res.json(updatedProject);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a project
app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
        const deleted = await Project.destroy({ where: { id: req.params.id, userId: req.user.id } });
        if (!deleted) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== Task Routes (Protected) =====

// Get all tasks
app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task by ID
app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create task
app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        const { title, description, completed, priority, dueDate, projectId } = req.body;
        const task = await Task.create({ title, description, completed, priority, dueDate, projectId });
        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task
app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
        const { title, description, completed, priority, dueDate, projectId } = req.body;
        const [updated] = await Task.update(
            { title, description, completed, priority, dueDate, projectId },
            { where: { id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: 'Task not found' });
        const updatedTask = await Task.findByPk(req.params.id);
        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task
app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
        const deleted = await Task.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});