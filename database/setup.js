const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const db = new Sequelize({
    dialect: process.env.DB_TYPE || 'sqlite',
    storage: process.env.DB_NAME || 'task_management.db',
    logging: false // optional, removes SQL logs
});

// ====== User Model ======
const User = db.define('User', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    username: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
});

// ====== Project Model ======
const Project = db.define('Project', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: { 
        type: DataTypes.STRING 
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    dueDate: {
        type: DataTypes.DATE
    }
});

// ====== Task Model ======
const Task = db.define('Task', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    title: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: { 
        type: DataTypes.STRING 
    },
    completed: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    priority: { 
        type: DataTypes.STRING 
    },
    dueDate: { 
        type: DataTypes.DATE 
    }
});

// ====== Relationships ======
// User → Project
User.hasMany(Project, { foreignKey: 'userId', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'userId' });

// Project → Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

// ====== Export all models and db ======
module.exports = {
    db,
    User,
    Project,
    Task
};