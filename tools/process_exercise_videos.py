#!/usr/bin/env python3
"""
Exercise Video Processing Tool

This script helps you:
1. Download videos from Envato Elements
2. Trim videos to 10-15 seconds
3. Compress and optimize for web
4. Upload to your server/CDN
5. Update database with video URLs

Requirements:
    pip install moviepy requests python-dotenv

Usage:
    python process_exercise_videos.py --input videos/ --output processed/
"""

import os
import sys
import argparse
import json
from pathlib import Path
from moviepy.editor import VideoFileClip
from moviepy.video.fx.all import resize
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'https://coachsync-pro.onrender.com')
COACH_TOKEN = os.getenv('COACH_TOKEN', '')  # Set in .env file

# Video processing settings
TARGET_DURATION = 15  # seconds
TARGET_WIDTH = 640  # pixels (mobile-friendly)
TARGET_BITRATE = '500k'  # Lower bitrate for smaller file size
TARGET_FPS = 30


def process_video(input_path, output_path, start_time=0, duration=TARGET_DURATION):
    """
    Process a video: trim, resize, and compress
    
    Args:
        input_path: Path to input video file
        output_path: Path to save processed video
        start_time: Start time in seconds (default: 0)
        duration: Duration in seconds (default: 15)
    """
    print(f"Processing: {input_path}")
    
    try:
        # Load video
        clip = VideoFileClip(str(input_path))
        
        # Get video info
        original_duration = clip.duration
        original_width = clip.w
        original_height = clip.h
        
        print(f"  Original: {original_width}x{original_height}, {original_duration:.1f}s")
        
        # Trim video
        if original_duration > duration:
            # If start_time is 0, try to find the best segment (middle of video)
            if start_time == 0 and original_duration > duration * 2:
                start_time = (original_duration - duration) / 2
            
            clip = clip.subclip(start_time, min(start_time + duration, original_duration))
            print(f"  Trimmed: {start_time:.1f}s to {start_time + duration:.1f}s")
        
        # Resize if needed (maintain aspect ratio)
        if clip.w > TARGET_WIDTH:
            clip = resize(clip, width=TARGET_WIDTH)
            print(f"  Resized: {clip.w}x{clip.h}")
        
        # Write output with compression
        clip.write_videofile(
            str(output_path),
            codec='libx264',
            audio_codec='aac',
            bitrate=TARGET_BITRATE,
            fps=TARGET_FPS,
            preset='medium',
            threads=4,
            logger=None  # Suppress moviepy logs
        )
        
        # Get file sizes
        input_size = os.path.getsize(input_path) / (1024 * 1024)  # MB
        output_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
        compression_ratio = (1 - output_size / input_size) * 100
        
        print(f"  Output: {output_size:.2f} MB (compressed {compression_ratio:.1f}%)")
        print(f"  Saved: {output_path}")
        
        clip.close()
        return True
        
    except Exception as e:
        print(f"  Error: {e}")
        return False


def upload_to_server(video_path, exercise_name):
    """
    Upload video to your server (placeholder - implement based on your setup)
    
    Returns:
        str: Public URL of uploaded video
    """
    # TODO: Implement actual upload logic based on your hosting
    # Options:
    # 1. AWS S3
    # 2. Cloudflare R2
    # 3. Your own server via FTP/SFTP
    # 4. CDN service
    
    print(f"  Uploading: {video_path}")
    print("  Note: Upload function not implemented. Please upload manually.")
    print("  After uploading, update the video URL in the database.")
    
    # Example return URL (replace with actual uploaded URL)
    filename = os.path.basename(video_path)
    return f"https://your-cdn.com/exercise-videos/{filename}"


def update_exercise_video_url(exercise_id, video_url):
    """
    Update exercise template with video URL via API
    
    Args:
        exercise_id: Exercise template ID
        video_url: Public URL of the video
    """
    if not COACH_TOKEN:
        print("  Error: COACH_TOKEN not set in .env file")
        return False
    
    url = f"{API_BASE_URL}/api/exercise-templates/{exercise_id}"
    headers = {
        'Authorization': f'Bearer {COACH_TOKEN}',
        'Content-Type': 'application/json'
    }
    data = {
        'video_url': video_url
    }
    
    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"  Updated exercise {exercise_id} with video URL")
        return True
    except Exception as e:
        print(f"  Error updating exercise: {e}")
        return False


def batch_process(input_dir, output_dir, mapping_file=None):
    """
    Process multiple videos in batch
    
    Args:
        input_dir: Directory containing input videos
        output_dir: Directory to save processed videos
        mapping_file: JSON file mapping video files to exercise names/IDs
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load mapping if provided
    mapping = {}
    if mapping_file and os.path.exists(mapping_file):
        with open(mapping_file, 'r') as f:
            mapping = json.load(f)
    
    # Process all video files
    video_extensions = ['.mp4', '.mov', '.avi', '.mkv']
    video_files = [f for f in input_path.iterdir() 
                   if f.suffix.lower() in video_extensions]
    
    if not video_files:
        print(f"No video files found in {input_dir}")
        return
    
    print(f"Found {len(video_files)} videos to process\n")
    
    results = []
    for i, video_file in enumerate(video_files, 1):
        print(f"[{i}/{len(video_files)}] {video_file.name}")
        
        # Output filename
        output_file = output_path / f"{video_file.stem}_processed.mp4"
        
        # Process video
        success = process_video(video_file, output_file)
        
        if success:
            # Get exercise info from mapping
            exercise_info = mapping.get(video_file.name, {})
            exercise_name = exercise_info.get('name', video_file.stem)
            exercise_id = exercise_info.get('id', None)
            
            results.append({
                'input': str(video_file),
                'output': str(output_file),
                'exercise_name': exercise_name,
                'exercise_id': exercise_id,
                'status': 'success'
            })
        else:
            results.append({
                'input': str(video_file),
                'status': 'failed'
            })
        
        print()
    
    # Save results
    results_file = output_path / 'processing_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nProcessing complete!")
    print(f"Results saved to: {results_file}")
    print(f"\nNext steps:")
    print(f"1. Upload processed videos to your CDN/server")
    print(f"2. Update video URLs in database using update_video_urls.py")


def main():
    parser = argparse.ArgumentParser(description='Process exercise videos for web')
    parser.add_argument('--input', '-i', required=True, help='Input directory or video file')
    parser.add_argument('--output', '-o', required=True, help='Output directory')
    parser.add_argument('--mapping', '-m', help='JSON file mapping videos to exercises')
    parser.add_argument('--start', type=float, default=0, help='Start time in seconds')
    parser.add_argument('--duration', type=float, default=TARGET_DURATION, help='Duration in seconds')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    
    if input_path.is_file():
        # Process single file
        output_path = Path(args.output)
        output_path.mkdir(parents=True, exist_ok=True)
        output_file = output_path / f"{input_path.stem}_processed.mp4"
        process_video(input_path, output_file, args.start, args.duration)
    elif input_path.is_dir():
        # Process directory
        batch_process(args.input, args.output, args.mapping)
    else:
        print(f"Error: {args.input} is not a valid file or directory")
        sys.exit(1)


if __name__ == '__main__':
    main()
