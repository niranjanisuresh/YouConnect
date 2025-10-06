import React, { useState, useEffect } from 'react';

function VideoPlayer({ video }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (video) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [video]);

  if (!video) {
    return (
      <div className="video-placeholder fade-in">
        <div className="placeholder-content">
          <div className="placeholder-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Select a Video</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Choose a video from the list below to start watching</p>
        </div>
      </div>
    );
  }

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /youtube\.com\/embed\/([^"&?\/\s]{11})/,
      /youtube\.com\/watch\?v=([^"&?\/\s]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const videoId = getYouTubeId(video.url);

  if (!videoId) {
    return (
      <div className="video-placeholder fade-in">
        <div className="placeholder-content">
          <div className="placeholder-icon" style={{ backgroundColor: 'var(--error)' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Invalid Video URL</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            The video URL format is not supported
          </p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=1&playsinline=1`;

  return (
    <div className="video-player-container fade-in">
      <div className="video-wrapper">
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--darker-bg)',
            borderRadius: '16px 16px 0 0',
            zIndex: 2
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTop: '3px solid var(--primary-red)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
        
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={`YouTube video: ${video.title}`}
          onLoad={() => {
            console.log('✅ YouTube iframe loaded successfully');
            setIsLoading(false);
            setHasError(false);
          }}
          onError={(e) => {
            console.error('❌ YouTube iframe error:', e);
            setIsLoading(false);
            setHasError(true);
          }}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      </div>
      
      {hasError && (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, var(--error) 0%, #CC0000 100%)',
          color: 'white',
          textAlign: 'center',
          borderRadius: '0 0 16px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span style={{ fontWeight: '600' }}>Video Playback Error</span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            This video cannot be played. It may be restricted or unavailable.
          </p>
        </div>
      )}
      
      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <p className="video-description">{video.description}</p>
        
        <div className="video-stats">
          <div className="stats-info">
            <span>{video.views?.toLocaleString()} views</span>
            <span>•</span>
            <span>{video.likes?.toLocaleString()} likes</span>
            <span>•</span>
            <span>{video.duration}</span>
          </div>
          
          <div className="category-tag">
            {video.category}
          </div>
        </div>
        
        <div className="video-actions">
          <button className="action-button">
            <div className="action-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <span>Like ({video.likes?.toLocaleString()})</span>
          </button>
          
          <button className="action-button">
            <div className="action-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span>Share</span>
          </button>
          
          <button className="action-button">
            <div className="action-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;