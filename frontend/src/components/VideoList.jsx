import React from 'react';

function VideoList({ videos, currentVideo, onVideoSelect, user }) {
  if (videos.length === 0) {
    return (
      <div className="video-list-empty">
        <div className="empty-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No Videos Found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Try adjusting your search terms or upload a new video
        </p>
      </div>
    );
  }

  const formatUploadDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const isVideoUploadedByUser = (video) => {
    return user && video.uploadedById === user.id;
  };

  return (
    <div className="video-list">
      <div className="video-list-header">
        <svg className="video-list-icon" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        Recommended Videos
        <span className="video-count">{videos.length}</span>
      </div>
      
      <div className="video-items">
        {videos.map((video) => (
          <div
            key={video.id}
            className={`video-item ${currentVideo?.id === video.id ? 'active' : ''} ${
              isVideoUploadedByUser(video) ? 'user-uploaded' : ''
            }`}
            onClick={() => onVideoSelect(video)}
          >
            <div className="video-thumbnail">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="thumbnail-image"
                onError={(e) => {
                  e.target.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'; // Fallback thumbnail
                }}
              />
              <div className="duration-badge">
                {video.duration}
              </div>
              {isVideoUploadedByUser(video) && (
                <div className="user-upload-badge" title="Uploaded by you">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V7H21V9H19V21C19 22.1 18.1 23 17 23H7C5.9 23 5 22.1 5 21V9H7V21H17V9H19H21Z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="video-info-compact">
              <h4 className="video-title-compact">{video.title}</h4>
              
              {/* Uploader info */}
              <div className="video-uploader-info">
                <span className="uploader-name">
                  {video.uploadedBy || 'Unknown User'}
                </span>
                {video.uploadDate && (
                  <span className="upload-date">
                    • {formatUploadDate(video.uploadDate)}
                  </span>
                )}
              </div>
              
              <p className="video-description-compact">{video.description}</p>
              
              <div className="video-stats-compact">
                <span>{video.views?.toLocaleString()} views</span>
                <span>•</span>
                <span>{video.likes?.toLocaleString()} likes</span>
                <span>•</span>
                <span className="video-category">{video.category}</span>
              </div>
            </div>
            
            {/* Active video indicator */}
            {currentVideo?.id === video.id && (
              <div className="active-video-indicator">
                <div className="playing-pulse"></div>
                <span>Now Playing</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoList;