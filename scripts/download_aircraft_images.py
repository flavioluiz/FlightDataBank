#!/usr/bin/env python3
"""
Script to download all aircraft images to a local directory.

This script will:
1. Use aircraft data from aircraft_db_import.py
2. Download each image to a local directory
3. Verify the downloaded image is valid
4. Find alternative images for broken links
5. Save all images to a local directory for use in the web application
"""

import os
import sys
import time
import json
import requests
import hashlib
import logging
import shutil
from urllib.parse import urlparse, unquote
from PIL import Image
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor

# Add the parent directory to the path so we can import from scripts
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import aircraft data from aircraft_db_import.py
try:
    from scripts.aircraft_db_import import AIRCRAFT_DATA, categorize_aircraft
    print(f"Successfully imported {len(AIRCRAFT_DATA)} aircraft from aircraft_db_import.py")
except ImportError:
    print("Error: Could not import AIRCRAFT_DATA from aircraft_db_import.py")
    print("Make sure the file exists and contains the AIRCRAFT_DATA variable.")
    sys.exit(1)

# Try to import historical data if available
try:
    from scripts.historical_aircraft_data import get_all_historical_aircraft
    HISTORICAL_DATA_AVAILABLE = True
    HISTORICAL_DATA = get_all_historical_aircraft()
    print(f"Successfully imported {len(HISTORICAL_DATA)} historical aircraft")
except ImportError:
    print("Note: Historical aircraft data not available. Using only modern aircraft.")
    HISTORICAL_DATA_AVAILABLE = False
    HISTORICAL_DATA = []

# Fixed configuration
IMAGE_DIR = os.path.join(os.getcwd(), 'web/images/aircraft')
FALLBACK_DIR = os.path.join(os.getcwd(), 'web/images/fallback')
LOG_FILE = 'image_download.log'
MAX_WORKERS = 4  # Number of parallel workers for downloading images
TIMEOUT = 10  # Timeout for HTTP requests in seconds
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

# Fallback image URLs - using direct links to Wikimedia images that are known to work
FALLBACK_IMAGES = {
    'comercial': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Boeing_787_first_flight.jpg',
    'executiva': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Gulfstream_G650ER_N650GD_EDDB_2019_1.jpg',
    'carga': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/FedEx_Express_Boeing_777F_N886FD_approaching_NRT.jpg',
    'militar': 'https://upload.wikimedia.org/wikipedia/commons/c/cb/F-22_Raptor_edit1_%28cropped%29.jpg',
    'geral': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Cessna_172S_Skyhawk_SP%2C_Private_JP6817606.jpg',
    'historica': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Wright_Flyer_in_flight_1908_Kitty_Hawk.jpg',
    'experimental': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Solar_Impulse_2_in_flight_over_Hawaii.jpg',
    'ave': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Bald_Eagle_in_flight%2C_Alaska.jpg'
}

# Backup fallback images - these are embedded in the script as base64 if all else fails
DEFAULT_IMAGES = {
    'comercial': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000',
    'executiva': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1000',
    'carga': 'https://images.unsplash.com/photo-1520437358207-323b43b50729?q=80&w=1000',
    'militar': 'https://images.unsplash.com/photo-1584121495634-202222a5d2e5?q=80&w=1000',
    'geral': 'https://images.unsplash.com/photo-1559686043-aef1b70a4d46?q=80&w=1000',
    'historica': 'https://images.unsplash.com/photo-1572355286138-8a5fde84685a?q=80&w=1000',
    'experimental': 'https://images.unsplash.com/photo-1518732751612-2c0787ff5684?q=80&w=1000',
    'ave': 'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1000'
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

def get_all_aircraft():
    """Get all aircraft data from aircraft_db_import.py and historical data if available."""
    # Combine modern and historical aircraft data
    all_aircraft = AIRCRAFT_DATA.copy()
    
    # Add historical data if available
    if HISTORICAL_DATA_AVAILABLE:
        all_aircraft.extend(HISTORICAL_DATA)
    
    # Add IDs to aircraft that don't have them
    for i, aircraft in enumerate(all_aircraft):
        if 'id' not in aircraft:
            aircraft['id'] = i + 1
    
    # Add categories to aircraft that don't have them
    for aircraft in all_aircraft:
        if not aircraft.get('category_type'):
            categories = categorize_aircraft(aircraft)
            aircraft.update(categories)
    
    logger.info(f"Processed {len(all_aircraft)} aircraft from all sources")
    return all_aircraft

def create_directories():
    """Create necessary directories if they don't exist."""
    os.makedirs(IMAGE_DIR, exist_ok=True)
    os.makedirs(FALLBACK_DIR, exist_ok=True)
    logger.info(f"Created directories: {IMAGE_DIR} and {FALLBACK_DIR}")

def download_fallback_images():
    """Download fallback images for each aircraft category."""
    logger.info("Downloading fallback images...")
    
    for category, url in FALLBACK_IMAGES.items():
        try:
            filename = f"{category}.jpg"
            filepath = os.path.join(FALLBACK_DIR, filename)
            
            # Skip if file already exists
            if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                logger.info(f"Fallback image for {category} already exists.")
                continue
                
            headers = {'User-Agent': USER_AGENT}
            response = requests.get(url, timeout=TIMEOUT, headers=headers)
            
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                logger.info(f"Downloaded fallback image for {category}")
            else:
                logger.warning(f"Failed to download fallback image for {category}: HTTP {response.status_code}")
                # Try the backup URL
                backup_url = DEFAULT_IMAGES.get(category)
                if backup_url:
                    logger.info(f"Trying backup URL for {category}: {backup_url}")
                    backup_response = requests.get(backup_url, timeout=TIMEOUT, headers=headers)
                    if backup_response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            f.write(backup_response.content)
                        logger.info(f"Downloaded backup fallback image for {category}")
                    else:
                        logger.error(f"Failed to download backup fallback image for {category}: HTTP {backup_response.status_code}")
                        # Create a simple colored image as last resort
                        create_default_image(filepath, category)
                else:
                    # Create a simple colored image as last resort
                    create_default_image(filepath, category)
        except Exception as e:
            logger.error(f"Error downloading fallback image for {category}: {e}")
            # Create a simple colored image as last resort
            create_default_image(filepath, category)

def create_default_image(filepath, category):
    """Create a simple colored image with text as a last resort fallback."""
    try:
        # Create a simple colored image with text
        width, height = 400, 300
        color = {
            'comercial': (54, 162, 235),  # Blue
            'executiva': (255, 159, 64),  # Orange
            'carga': (255, 205, 86),      # Yellow
            'militar': (75, 192, 192),    # Green
            'geral': (153, 102, 255),     # Purple
            'historica': (201, 203, 207), # Gray
            'experimental': (255, 99, 132), # Red
            'ave': (162, 235, 54)         # Light green
        }.get(category, (200, 200, 200))  # Default gray
        
        # Create a new image with a solid color
        img = Image.new('RGB', (width, height), color)
        
        # Save the image
        img.save(filepath)
        logger.info(f"Created default image for {category}")
    except Exception as e:
        logger.error(f"Error creating default image for {category}: {e}")

def get_filename_from_url(url, aircraft_id, aircraft_name):
    """Generate a filename from the URL or aircraft details."""
    if not url:
        return f"{aircraft_id}_{sanitize_filename(aircraft_name)}.jpg"
        
    try:
        # Try to extract filename from URL
        parsed_url = urlparse(url)
        path = unquote(parsed_url.path)
        filename = os.path.basename(path)
        
        # If filename has no extension or is too long, generate a new one
        name, ext = os.path.splitext(filename)
        if not ext or len(filename) > 100:
            return f"{aircraft_id}_{sanitize_filename(aircraft_name)}.jpg"
            
        # Ensure the filename is unique by adding aircraft ID
        return f"{aircraft_id}_{sanitize_filename(filename)}"
    except:
        # Fallback to a hash-based filename
        hash_object = hashlib.md5(url.encode())
        return f"{aircraft_id}_{hash_object.hexdigest()[:10]}.jpg"

def sanitize_filename(filename):
    """Remove invalid characters from filename."""
    if not filename:
        return "unknown"
        
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

def is_valid_image(file_path):
    """Check if the downloaded file is a valid image."""
    try:
        with Image.open(file_path) as img:
            # Verify the image by loading it
            img.verify()
            
            # Check image dimensions (at least 100x100 pixels)
            width, height = img.size
            if width < 100 or height < 100:
                logger.warning(f"Image too small: {file_path} ({width}x{height})")
                return False
                
        return True
    except Exception as e:
        logger.warning(f"Invalid image file: {file_path} - {e}")
        return False

def download_image(aircraft):
    """Download an image for an aircraft and return the local path."""
    aircraft_id = aircraft.get('id')
    name = aircraft.get('name', 'Unknown')
    url = aircraft.get('image_url', '')
    
    if not url:
        logger.warning(f"No image URL for aircraft {name} (ID: {aircraft_id})")
        return use_fallback_image(aircraft)
    
    # If the URL is already a local path, check if the file exists
    if url.startswith('/images/'):
        local_file = os.path.join(os.getcwd(), 'web', url[1:])  # Remove leading slash
        if os.path.exists(local_file) and is_valid_image(local_file):
            logger.info(f"Using existing local image for {name}: {url}")
            return url
        else:
            logger.warning(f"Local image not found or invalid for {name}: {url}")
            return use_fallback_image(aircraft)
    
    try:
        # Generate filename and path
        filename = get_filename_from_url(url, aircraft_id, name)
        filepath = os.path.join(IMAGE_DIR, filename)
        
        # Skip if file already exists and is valid
        if os.path.exists(filepath) and is_valid_image(filepath):
            logger.info(f"Image for {name} already exists at {filepath}")
            return f"/images/aircraft/{filename}"
        
        # Download the image
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(url, timeout=TIMEOUT, headers=headers)
        
        if response.status_code != 200:
            logger.warning(f"Failed to download image for {name}: HTTP {response.status_code}")
            return use_fallback_image(aircraft)
        
        # Save the image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        # Verify the image
        if not is_valid_image(filepath):
            logger.warning(f"Downloaded invalid image for {name}")
            os.remove(filepath)  # Remove invalid image
            return use_fallback_image(aircraft)
            
        logger.info(f"Successfully downloaded image for {name} to {filepath}")
        return f"/images/aircraft/{filename}"
        
    except Exception as e:
        logger.error(f"Error downloading image for {name}: {e}")
        return use_fallback_image(aircraft)

def use_fallback_image(aircraft):
    """Use a fallback image based on aircraft category."""
    category = aircraft.get('category_type', 'geral')
    filename = f"{category}.jpg"
    filepath = os.path.join(FALLBACK_DIR, filename)
    
    # If the fallback image doesn't exist, create it
    if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
        logger.warning(f"Fallback image for {category} not found, creating it")
        create_default_image(filepath, category)
    
    # Check if category-specific fallback exists
    if category in FALLBACK_IMAGES:
        return f"/images/fallback/{filename}"
    
    # Use general aviation fallback
    return "/images/fallback/geral.jpg"

def search_alternative_image(aircraft):
    """Search for an alternative image for an aircraft."""
    aircraft_id = aircraft.get('id')
    name = aircraft.get('name', 'Unknown')
    manufacturer = aircraft.get('manufacturer', '')
    
    search_terms = [
        f"{manufacturer} {name} aircraft",
        f"{name} airplane",
        f"{name} aircraft"
    ]
    
    for term in search_terms:
        try:
            # Use Unsplash API for a simple search
            search_url = f"https://source.unsplash.com/featured/?{term.replace(' ', ',')}"
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            }
            
            logger.info(f"Searching for alternative image for {name} with term: {term}")
            
            response = requests.get(search_url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
            if response.status_code == 200:
                # Save the image
                filename = f"{aircraft_id}_{sanitize_filename(name)}_alt.jpg"
                filepath = os.path.join(IMAGE_DIR, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                # Verify the image
                if is_valid_image(filepath):
                    logger.info(f"Found alternative image for {name}")
                    return f"/images/aircraft/{filename}"
                else:
                    logger.warning(f"Downloaded invalid alternative image for {name}")
                    os.remove(filepath)
            
        except Exception as e:
            logger.error(f"Error searching for alternative image for {name}: {e}")
    
    return use_fallback_image(aircraft)

def save_image_mapping(aircraft_list):
    """Save a mapping of aircraft to their local image paths."""
    mapping = {}
    for aircraft in aircraft_list:
        if 'local_image_path' in aircraft:
            mapping[aircraft['id']] = {
                'name': aircraft['name'],
                'image_path': aircraft['local_image_path']
            }
    
    # Save the mapping to a JSON file
    mapping_file = os.path.join(os.getcwd(), 'web/images/aircraft_images.json')
    with open(mapping_file, 'w') as f:
        json.dump(mapping, f, indent=2)
    
    logger.info(f"Saved image mapping to {mapping_file}")

def process_aircraft(aircraft):
    """Process an aircraft: download image and update local path."""
    aircraft_id = aircraft.get('id')
    name = aircraft.get('name', 'Unknown')
    
    if not aircraft_id:
        logger.warning(f"Skipping aircraft with no ID: {name}")
        return False
        
    logger.info(f"Processing aircraft: {name} (ID: {aircraft_id})")
    
    # Download the image
    local_path = download_image(aircraft)
    
    # If download failed, try to find an alternative
    if local_path.startswith('/images/fallback/') and aircraft.get('image_url'):
        logger.info(f"Trying to find alternative image for {name}")
        alternative_path = search_alternative_image(aircraft)
        if not alternative_path.startswith('/images/fallback/'):
            local_path = alternative_path
    
    # Store the local path in the aircraft object
    aircraft['local_image_path'] = local_path
    
    # Create a JSON file with the aircraft's image information
    info_file = os.path.join(IMAGE_DIR, f"{aircraft_id}_info.json")
    with open(info_file, 'w') as f:
        json.dump({
            'id': aircraft_id,
            'name': name,
            'manufacturer': aircraft.get('manufacturer', ''),
            'model': aircraft.get('model', ''),
            'category': aircraft.get('category_type', ''),
            'original_url': aircraft.get('image_url', ''),
            'local_path': local_path
        }, f, indent=2)
    
    logger.info(f"Saved image info for {name} to {info_file}")
    return True

def main():
    """Main function to download all aircraft images."""
    logger.info("Starting aircraft image download process...")
    
    # Create necessary directories
    create_directories()
    
    # Download fallback images
    download_fallback_images()
    
    # Get all aircraft
    aircraft_list = get_all_aircraft()
    if not aircraft_list:
        logger.error("No aircraft found in the imported data.")
        return
    
    # Process aircraft in parallel
    success_count = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = list(executor.map(process_aircraft, aircraft_list))
        success_count = sum(1 for result in results if result)
    
    # Save a mapping of aircraft to their local image paths
    save_image_mapping(aircraft_list)
    
    logger.info(f"\nSummary:")
    logger.info(f"- Total aircraft processed: {len(aircraft_list)}")
    logger.info(f"- Successfully processed: {success_count}")
    logger.info(f"- Failed: {len(aircraft_list) - success_count}")
    
    print(f"\nSummary:")
    print(f"- Total aircraft processed: {len(aircraft_list)}")
    print(f"- Successfully processed: {success_count}")
    print(f"- Failed: {len(aircraft_list) - success_count}")
    print(f"- Log file: {LOG_FILE}")
    print(f"- Images saved to: {IMAGE_DIR}")
    print(f"- Fallback images saved to: {FALLBACK_DIR}")
    print(f"- Image mapping saved to: web/images/aircraft_images.json")

if __name__ == "__main__":
    main() 