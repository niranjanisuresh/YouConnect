const { Sequelize } = require('sequelize');
const path = require('path');

// Create SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'), // Database file location
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries in development
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    match: [
      /SQLITE_BUSY/,
    ],
    name: 'query',
    max: 3
  },
  transactionType: 'IMMEDIATE'
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
    
    // Sync all models
    await sequelize.sync({ force: false }); // Set force: true to reset database (development only)
    console.log('✅ Database synchronized');
    
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
  }
};

module.exports = { sequelize, testConnection };