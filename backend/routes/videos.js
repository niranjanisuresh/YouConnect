const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Get all videos
router.get('/', async (req, res) => {
  try {
    const { search, category, sort = 'uploadDate' } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    let sortQuery = {};
    switch (sort) {
      case 'views':
        sortQuery = { views: -1 };
        break;
      case 'likes':
        sortQuery = { likes: -1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      default:
        sortQuery = { uploadDate: -1 };
    }
    
    const videos = await Video.find(query)
      .sort(sortQuery)
      .select('-__v');
    
    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching videos'
    });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Increment views
    video.views += 1;
    await video.save();
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching video'
    });
  }
});

// Create new video (for admin)
router.post('/', async (req, res) => {
  try {
    const video = new Video(req.body);
    await video.save();
    
    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating video'
    });
  }
});

// Update video
router.put('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating video'
    });
  }
});

// Like a video
router.post('/:id/like', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    video.likes += 1;
    await video.save();
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking video'
    });
  }
});

module.exports = router;