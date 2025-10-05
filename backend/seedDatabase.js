const mongoose = require('mongoose');
const User = require('./models/User');
const Video = require('./models/Video');
const connectDB = require('./config/database');

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Video.deleteMany({});
    
    console.log('🗑️ Existing data cleared');
    
    // Create demo users
    const demoUsers = [
      {
        username: 'CodeMaster',
        email: 'codemaster@example.com',
        password: 'password123'
      },
      {
        username: 'WebDev Pro',
        email: 'webdev@example.com', 
        password: 'password123'
      },
      {
        username: 'Backend Expert',
        email: 'backend@example.com',
        password: 'password123'
      }
    ];
    
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ ${createdUsers.length} demo users created`);
    
    // Create demo videos
    const demoVideos = [
      {
        title: "Learn React.js - Full Course for Beginners",
        description: "Master React.js fundamentals with this comprehensive tutorial.",
        url: "https://www.youtube.com/watch?v=SqcY0GlETPk",
        thumbnail: "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg",
        duration: "2:25:00",
        category: "Programming",
        views: 2540000,
        likes: 85000,
        uploadedBy: createdUsers[0]._id
      },
      {
        title: "JavaScript Masterclass - From Zero to Hero", 
        description: "Complete JavaScript tutorial covering modern ES6+ features.",
        url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
        thumbnail: "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg",
        duration: "1:38:00",
        category: "Programming",
        views: 1850000,
        likes: 62000,
        uploadedBy: createdUsers[1]._id
      }
    ];
    
    const createdVideos = await Video.insertMany(demoVideos);
    console.log(`✅ ${createdVideos.length} demo videos created`);
    
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();