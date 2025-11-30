import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

const ExerciseVideoPlayer = ({ videoUrl, exerciseName, autoPlay = false, showControls = true, className = '' }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(!autoPlay);

  useEffect(() => {
    if (videoRef.current) {
      if (autoPlay) {
        videoRef.current.play().catch(err => {
          console.log('Autoplay prevented:', err);
          setIsPlaying(false);
          setShowPlayButton(true);
        });
      }
    }
  }, [autoPlay, videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowPlayButton(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.mozRequestFullScreen) {
          videoRef.current.mozRequestFullScreen();
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowPlayButton(true);
    // Loop the video for continuous demonstration
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setShowPlayButton(false);
    }
  };

  if (!videoUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden group ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onEnded={handleVideoEnd}
        onClick={togglePlay}
      >
        Your browser does not support the video tag.
      </video>

      {/* Play Button Overlay */}
      {showPlayButton && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-white bg-opacity-90 rounded-full p-4 transform transition-transform hover:scale-110">
            <Play className="w-12 h-12 text-blue-600" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Exercise Name Overlay */}
      {exerciseName && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{exerciseName}</p>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" fill="currentColor" />
                )}
              </button>

              {/* Mute/Unmute Button */}
              <button
                onClick={toggleMute}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};

export default ExerciseVideoPlayer;
