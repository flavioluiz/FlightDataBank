#!/usr/bin/env python3
"""
Script to update all image URLs in the database to use local paths.

This script will:
1. Fetch all aircraft from the database
2. For each aircraft with a remote image URL, update it to use a local path
3. The local path will be based on the aircraft ID and name
"""

import os
import sys
import sqlite3
import hashlib
import logging
from urllib.parse import urlparse, unquote

# Configuration
DB_PATH = 'aircraft.db'
IMAGE_DIR = 'web/images/aircraft'
FALLBACK_DIR = 'web/images/fallback'
LOG_FILE = 'image_path_update.log'

# Fallback image paths by aircraft type
FALLBACK_IMAGES = {
    'comercial': '/images/fallback/comercial.jpg',
    'executiva': '/images/fallback/executiva.jpg',
    'carga': '/images/fallback/carga.jpg',
    'militar': '/images/fallback/militar.jpg',
    'geral': '/images/fallback/geral.jpg',
    'historica': '/images/fallback/historica.jpg',
    'experimental': '/images/fallback/experimental.jpg',
    'ave': '/images/fallback/ave.jpg'
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def connect_to_db():
    """Connect to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Error connecting to database: {e}")
        sys.exit(1)

def get_all_aircraft():
    """Fetch all aircraft from the database."""
    conn = connect_to_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM aircraft")
        aircraft = [dict(row) for row in cursor.fetchall()]
        logger.info(f"Found {len(aircraft)} aircraft in the database.")
        return aircraft
    except sqlite3.Error as e:
        logger.error(f"Error fetching aircraft: {e}")
        return []
    finally:
        conn.close()

def sanitize_filename(filename):
    """Remove invalid characters from filename."""
    # Replace invalid characters with underscores
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Remove any leading/trailing spaces or dots
    filename = filename.strip('. ')
    
    # Limit length
    if len(filename) > 50:
        name, ext = os.path.splitext(filename)
        filename = name[:46] + ext
        
    return filename

def get_local_path(aircraft):
    """Generate a local path for an aircraft image."""
    aircraft_id = aircraft['id']
    name = aircraft['name']
    url = aircraft.get('image_url', '')
    
    # If URL is already a local path, return it
    if url and url.startswith('/images/'):
        return url
    
    # If no URL, use fallback
    if not url:
        category = aircraft.get('category_type', 'geral')
        return FALLBACK_IMAGES.get(category, FALLBACK_IMAGES['geral'])
    
    try:
        # Try to extract filename from URL
        parsed_url = urlparse(url)
        path = unquote(parsed_url.path)
        filename = os.path.basename(path)
        
        # If filename has no extension or is too long, generate a new one
        name, ext = os.path.splitext(filename)
        if not ext or len(filename) > 100:
            filename = f"{aircraft_id}_{sanitize_filename(aircraft['name'])}.jpg"
            
        # Ensure the filename is unique by adding aircraft ID
        filename = f"{aircraft_id}_{sanitize_filename(filename)}"
        
        return f"/images/aircraft/{filename}"
    except:
        # Fallback to a hash-based filename
        hash_object = hashlib.md5(url.encode())
        return f"/images/aircraft/{aircraft_id}_{hash_object.hexdigest()[:10]}.jpg"

def update_image_url(aircraft_id, local_path):
    """Update the image URL in the database to use the local path."""
    conn = connect_to_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE aircraft SET image_url = ? WHERE id = ?",
            (local_path, aircraft_id)
        )
        conn.commit()
        return True
    except sqlite3.Error as e:
        logger.error(f"Error updating image URL for aircraft {aircraft_id}: {e}")
        return False
    finally:
        conn.close()

def main():
    """Main function to update all image URLs."""
    logger.info("Starting image path update process...")
    
    # Get all aircraft
    aircraft_list = get_all_aircraft()
    if not aircraft_list:
        logger.error("No aircraft found in the database.")
        return
    
    # Update each aircraft
    success_count = 0
    for aircraft in aircraft_list:
        aircraft_id = aircraft['id']
        name = aircraft['name']
        current_url = aircraft.get('image_url', '')
        
        # Skip if URL is already a local path
        if current_url and current_url.startswith('/images/'):
            logger.info(f"Aircraft {name} already has a local path: {current_url}")
            success_count += 1
            continue
        
        # Generate local path
        local_path = get_local_path(aircraft)
        
        # Update the database
        if update_image_url(aircraft_id, local_path):
            logger.info(f"Updated image URL for {name} from {current_url} to {local_path}")
            success_count += 1
        else:
            logger.error(f"Failed to update image URL for {name}")
    
    logger.info(f"\nSummary:")
    logger.info(f"- Total aircraft processed: {len(aircraft_list)}")
    logger.info(f"- Successfully updated: {success_count}")
    logger.info(f"- Failed: {len(aircraft_list) - success_count}")
    
    print(f"\nSummary:")
    print(f"- Total aircraft processed: {len(aircraft_list)}")
    print(f"- Successfully updated: {success_count}")
    print(f"- Failed: {len(aircraft_list) - success_count}")
    print(f"- Log file: {LOG_FILE}")

if __name__ == "__main__":
    main() 