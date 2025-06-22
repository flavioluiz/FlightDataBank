#!/usr/bin/env python3

"""
Script to extract the lowest resolution thumbnail URLs from Wikimedia Commons pages
and add them to the aircraft images CSV file.

Usage:
    python add_thumbnail_urls.py             # Process all entries in the CSV
    python add_thumbnail_urls.py --test A10  # Test with a specific aircraft code
"""

import csv
import sys
import argparse
import logging
import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import unquote, urlparse, parse_qs
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Input and output files
INPUT_CSV = "aircraft_images.csv"
OUTPUT_CSV = "aircraft_images_with_thumbnails.csv"

def get_thumbnail_url(commons_url):
    """
    Extract the lowest resolution thumbnail URL from a Wikimedia Commons page.
    
    Args:
        commons_url (str): The URL of the Wikimedia Commons page
        
    Returns:
        str: The URL of the lowest resolution thumbnail, or None if not found
    """
    if not commons_url or not commons_url.startswith("https://commons.wikimedia.org/wiki/File:"):
        return None
    
    try:
        response = requests.get(commons_url)
        if response.status_code != 200:
            logging.warning(f"Failed to get page: {commons_url}, status code: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Method 1: Find the first thumbnail link directly
        thumbnail_links = soup.find_all('a', class_='mw-thumbnail-link')
        if thumbnail_links:
            # Get the first (smallest) thumbnail link
            return thumbnail_links[0]['href']
            
        # Method 2: Construct URL from original filename
        if not thumbnail_links:
            # Extract the original filename from the commons URL
            filename = commons_url.split('File:')[-1]
            # Remove URL encoding
            filename = unquote(filename)
            
            # Get the first two characters of the filename's MD5 hash
            md5_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()
            hash_path = f"{md5_hash[0]}/{md5_hash[0:2]}"
            
            # Construct the thumbnail URL
            thumbnail_url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{hash_path}/{filename}/320px-{filename}"
            
            # Verify if the thumbnail exists
            thumb_response = requests.head(thumbnail_url)
            if thumb_response.status_code == 200:
                return thumbnail_url
        
        # Method 3: Parse the file history section
        file_history = soup.find('table', class_='filehistory')
        if file_history:
            # Find all rows in the file history
            rows = file_history.find_all('tr')
            if rows:
                # Get the current version's link
                current_row = rows[1]  # First row after header
                link = current_row.find('a')
                if link and link.get('href'):
                    original_url = link['href']
                    # Convert to thumbnail URL
                    return original_url.replace('/commons/', '/commons/thumb/') + '/320px-' + filename
        
        logging.warning(f"No thumbnail found for {commons_url} using any method")
        return None
        
    except Exception as e:
        logging.error(f"Error extracting thumbnail URL from {commons_url}: {e}")
        return None

def add_thumbnail_urls():
    """
    Process the aircraft images CSV and add thumbnail URLs.
    """
    parser = argparse.ArgumentParser(description='Add thumbnail URLs to aircraft images CSV')
    parser.add_argument('--test', type=str, help='Test with a specific aircraft code')
    args = parser.parse_args()
    
    # Read the input CSV
    try:
        with open(INPUT_CSV, 'r', newline='', encoding='utf-8') as file:
            reader = csv.reader(file)
            rows = list(reader)
            header = rows[0]
    except Exception as e:
        logging.error(f"Error reading input CSV: {e}")
        sys.exit(1)
    
    # Find column indices
    icao_col = 0  # First column is ICAO code
    commons_url_col = 3  # Fourth column is commons URL
    
    # Add thumbnail_url column to header if it doesn't exist
    if "thumbnail_url" not in header:
        header.append("thumbnail_url")
    thumbnail_url_col = header.index("thumbnail_url")
    
    # Process rows
    processed_count = 0
    success_count = 0
    
    # If testing, only process the specified aircraft
    if args.test:
        test_icao = args.test
        # Find the row with the specified ICAO code
        test_row_index = None
        for i, row in enumerate(rows[1:], 1):
            if row[icao_col] == test_icao:
                test_row_index = i
                break
        
        if test_row_index is None:
            logging.error(f"Aircraft code not found: {test_icao}")
            sys.exit(1)
        
        # Test row exists, process just this one
        row = rows[test_row_index]
        icao_code = row[icao_col]
        commons_url = row[commons_url_col] if commons_url_col < len(row) else None
        
        if commons_url:
            logging.info(f"Processing {icao_code}: {commons_url}")
            thumbnail_url = get_thumbnail_url(commons_url)
            
            if thumbnail_url:
                # Make sure the row is long enough
                while len(row) <= thumbnail_url_col:
                    row.append("")
                
                # Update the row
                row[thumbnail_url_col] = thumbnail_url
                rows[test_row_index] = row
                
                logging.info(f"Found thumbnail URL for {icao_code}: {thumbnail_url}")
                print(f"\nThumbnail URL for {icao_code}: {thumbnail_url}\n")
            else:
                logging.warning(f"No thumbnail URL found for {icao_code}")
        else:
            logging.warning(f"No commons URL found for {icao_code}")
            
        # Don't write to file in test mode
        return
    
    # Process all rows
    for i, row in enumerate(rows[1:], 1):  # Skip header row
        icao_code = row[icao_col]
        commons_url = row[commons_url_col] if commons_url_col < len(row) else None
        
        processed_count += 1
        
        if commons_url:
            logging.info(f"Processing {icao_code}: {commons_url}")
            thumbnail_url = get_thumbnail_url(commons_url)
            
            if thumbnail_url:
                # Make sure the row is long enough
                while len(row) <= thumbnail_url_col:
                    row.append("")
                
                # Update the row
                row[thumbnail_url_col] = thumbnail_url
                rows[i] = row
                
                success_count += 1
                logging.info(f"Found thumbnail URL for {icao_code}: {thumbnail_url}")
            else:
                logging.warning(f"No thumbnail URL found for {icao_code}")
        else:
            logging.warning(f"No commons URL found for {icao_code}")
        
        # Add a small delay to avoid hammering the server
        time.sleep(0.2)
        
        # Log progress every 10 entries
        if processed_count % 10 == 0:
            logging.info(f"Progress: {processed_count} entries processed, {success_count} thumbnail URLs found")
    
    # Write the output file
    try:
        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(rows)
        logging.info(f"Added {success_count} thumbnail URLs. Saved to {OUTPUT_CSV}")
    except Exception as e:
        logging.error(f"Error writing output CSV: {e}")
        sys.exit(1)
    
    logging.info(f"Complete! Added thumbnail URLs for {success_count}/{processed_count} entries.")

if __name__ == "__main__":
    add_thumbnail_urls() 