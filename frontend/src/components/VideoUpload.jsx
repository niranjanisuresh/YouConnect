import React, { useState } from 'react';
import './VideoUpload.css';

function VideoUpload({ onUpload, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: 'Programming',
    duration: '',
    thumbnail: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate upload process
    setTimeout(() => {
      const newVideo = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        url: formData.url,
        thumbnail: formData.thumbnail || `https://i.ytimg.com/vi/${extractVideoId(formData.url)}/hqdefault.jpg`,
        duration: formData.duration || '10:00',
        category: formData.category,
        views: 0,
        likes: 0,
        uploadedBy: JSON.parse(localStorage.getItem('user'))?.username || 'User',
        uploadDate: new Date().toISOString()
      };

      onUpload(newVideo);
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : 'default';
  };

  const generateThumbnail = () => {
    const videoId = extractVideoId(formData.url);
    if (videoId !== 'default') {
      setFormData({
        ...formData,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      });
    }
  };

  return (
    <div className="upload-overlay">
      <div className="upload-modal">
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="upload-header">
          <h2>Upload New Video</h2>
          <p>Share your video with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Video Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter video title"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="Programming">Programming</option>
                <option value="Technology">Technology</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>YouTube URL *</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <button 
              type="button" 
              onClick={generateThumbnail}
              className="generate-thumbnail"
              disabled={!formData.url}
            >
              Generate Thumbnail
            </button>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your video..."
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 10:30"
              />
            </div>

            <div className="form-group">
              <label>Custom Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </div>

          {formData.thumbnail && (
            <div className="thumbnail-preview">
              <label>Thumbnail Preview</label>
              <img src={formData.thumbnail} alt="Thumbnail preview" />
            </div>
          )}

          <div className="upload-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="upload-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Uploading...
                </>
              ) : (
                'Upload Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VideoUpload;