#!/usr/bin/env python3
"""
Update Exercise Video URLs

This script updates exercise templates with video URLs after uploading videos.

Requirements:
    pip install requests python-dotenv

Usage:
    # Update from JSON file
    python update_video_urls.py --mapping video_urls.json

    # Update single exercise
    python update_video_urls.py --id <exercise_id> --url <video_url>
"""

import os
import sys
import argparse
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'https://coachsync-pro.onrender.com')
COACH_TOKEN = os.getenv('COACH_TOKEN', '')


def update_exercise_video(exercise_id, video_url):
    """
    Update a single exercise with video URL
    
    Args:
        exercise_id: Exercise template ID
        video_url: Public URL of the video
    
    Returns:
        bool: Success status
    """
    if not COACH_TOKEN:
        print("Error: COACH_TOKEN not set in .env file")
        print("Please set COACH_TOKEN in your .env file")
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
        print(f"✅ Updated exercise {exercise_id}")
        return True
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"   Response: {e.response.text}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def update_from_mapping(mapping_file):
    """
    Update multiple exercises from a JSON mapping file
    
    Expected JSON format:
    {
        "exercise_id_1": "https://cdn.com/video1.mp4",
        "exercise_id_2": "https://cdn.com/video2.mp4"
    }
    
    Or with exercise names:
    [
        {
            "id": "exercise_id_1",
            "name": "Barbell Bench Press",
            "video_url": "https://cdn.com/video1.mp4"
        }
    ]
    """
    if not os.path.exists(mapping_file):
        print(f"Error: Mapping file not found: {mapping_file}")
        return
    
    with open(mapping_file, 'r') as f:
        mapping = json.load(f)
    
    if isinstance(mapping, dict):
        # Simple dict format
        items = [(k, v) for k, v in mapping.items()]
    elif isinstance(mapping, list):
        # List of objects format
        items = [(item['id'], item['video_url']) for item in mapping]
    else:
        print("Error: Invalid mapping file format")
        return
    
    print(f"Updating {len(items)} exercises...\n")
    
    success_count = 0
    failed_count = 0
    
    for i, (exercise_id, video_url) in enumerate(items, 1):
        print(f"[{i}/{len(items)}] ", end='')
        if update_exercise_video(exercise_id, video_url):
            success_count += 1
        else:
            failed_count += 1
    
    print(f"\n{'='*50}")
    print(f"Results:")
    print(f"  ✅ Success: {success_count}")
    print(f"  ❌ Failed: {failed_count}")
    print(f"{'='*50}")


def get_all_exercises():
    """
    Fetch all exercises from API to help create mapping
    """
    if not COACH_TOKEN:
        print("Error: COACH_TOKEN not set in .env file")
        return []
    
    url = f"{API_BASE_URL}/api/exercise-templates"
    headers = {
        'Authorization': f'Bearer {COACH_TOKEN}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get('exercises', [])
    except Exception as e:
        print(f"Error fetching exercises: {e}")
        return []


def create_mapping_template(output_file='video_mapping_template.json'):
    """
    Create a template JSON file for mapping videos to exercises
    """
    print("Fetching exercises from API...")
    exercises = get_all_exercises()
    
    if not exercises:
        print("No exercises found or error fetching exercises")
        return
    
    # Create template
    template = []
    for exercise in exercises:
        template.append({
            'id': exercise['id'],
            'name': exercise['name'],
            'muscle_group': exercise['muscle_group'],
            'category': exercise['category'],
            'video_url': '',  # To be filled in
            'current_video': exercise.get('video_url', '')
        })
    
    # Save template
    with open(output_file, 'w') as f:
        json.dump(template, f, indent=2)
    
    print(f"✅ Created mapping template: {output_file}")
    print(f"   Found {len(exercises)} exercises")
    print(f"\nNext steps:")
    print(f"1. Edit {output_file}")
    print(f"2. Fill in video_url for each exercise")
    print(f"3. Run: python update_video_urls.py --mapping {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Update exercise video URLs')
    parser.add_argument('--mapping', '-m', help='JSON file mapping exercise IDs to video URLs')
    parser.add_argument('--id', help='Single exercise ID to update')
    parser.add_argument('--url', help='Video URL for single exercise update')
    parser.add_argument('--create-template', action='store_true', 
                       help='Create a mapping template from existing exercises')
    parser.add_argument('--template-output', default='video_mapping_template.json',
                       help='Output file for template (default: video_mapping_template.json)')
    
    args = parser.parse_args()
    
    if args.create_template:
        create_mapping_template(args.template_output)
    elif args.mapping:
        update_from_mapping(args.mapping)
    elif args.id and args.url:
        update_exercise_video(args.id, args.url)
    else:
        parser.print_help()
        print("\nExamples:")
        print("  # Create mapping template")
        print("  python update_video_urls.py --create-template")
        print()
        print("  # Update from mapping file")
        print("  python update_video_urls.py --mapping video_urls.json")
        print()
        print("  # Update single exercise")
        print("  python update_video_urls.py --id abc123 --url https://cdn.com/video.mp4")


if __name__ == '__main__':
    main()
