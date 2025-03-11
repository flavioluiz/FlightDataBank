#!/usr/bin/env python3
import json
import re
import argparse
import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote

def load_json_file(file_path):
    """Load a JSON file and return its contents."""
    with open(file_path, 'r') as f:
        return json.load(f)

def extract_image_urls(data, key_name="image_url"):
    """Extract all image URLs from a JSON structure."""
    urls = []
    
    # Handle aircraft.json structure
    if "aircraft" in data:
        for item in data["aircraft"]:
            if key_name in item:
                urls.append({"url": item[key_name], "name": item.get("name", "Unknown")})
    
    # Handle birds.json structure
    elif "birds" in data:
        for item in data["birds"]:
            if key_name in item:
                urls.append({"url": item[key_name], "name": item.get("name", "Unknown")})
    
    return urls

def convert_to_description_url(image_url):
    """Convert a Wikimedia image URL to its description page URL."""
    # Parse the URL
    parsed_url = urlparse(image_url)
    
    # Check if it's a Wikimedia URL
    if "wikimedia.org" not in parsed_url.netloc:
        return None
    
    # Extract the filename from the path
    path_parts = parsed_url.path.split('/')
    
    # Handle thumbnail URLs (they have 'thumb' in the path)
    if 'thumb' in path_parts:
        # Remove 'thumb' from the path
        thumb_index = path_parts.index('thumb')
        filename = '/'.join(path_parts[thumb_index+1:])
        # Remove the thumbnail size specification (e.g., /640px-...)
        filename = '/'.join(filename.split('/')[:-1])
    else:
        # For direct image URLs
        filename = path_parts[-1]
    
    # Handle URLs with hash codes in the path (e.g., /4/43/...)
    if re.match(r'^[0-9a-f]/[0-9a-f]{2}/', filename):
        # Extract just the filename without the hash path
        filename = filename.split('/', 2)[-1]
    
    # URL decode the filename
    filename = unquote(filename)
    
    # Create the description page URL
    return f"https://commons.wikimedia.org/wiki/File:{filename}"

def extract_author_info(description_url):
    """Extract author information from a Wikimedia Commons description page."""
    try:
        response = requests.get(description_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Initialize author info
        author_info = {
            "author": None,
            "license": None,
            "description": None,
            "date": None,
            "source": None,
            "url": description_url,
            "formatted_attribution": None  # New field for the ready-made attribution
        }
        
        # Look for the ready-made attribution text
        attribution_input = soup.find('input', id='stockphoto_attribution')
        if attribution_input and attribution_input.get('value'):
            author_info["formatted_attribution"] = attribution_input.get('value')
        
        # Method 1: Find the information section table
        info_section = soup.find('table', class_='fileinfotpl-type-information')
        if info_section:
            # Extract author - look for the specific td with id="fileinfotpl_aut"
            author_td = soup.find('td', id='fileinfotpl_aut')
            if author_td and author_td.find_next('td'):
                author_info["author"] = author_td.find_next('td').get_text(strip=True)
            else:
                # Try the old method
                author_header = info_section.find('th', string=re.compile(r'Author|Creator|Photographer', re.IGNORECASE))
                if author_header:
                    author_cell = author_header.find_next('td')
                    if author_cell:
                        author_info["author"] = author_cell.get_text(strip=True)
            
            # Extract license
            license_header = info_section.find('th', string=re.compile(r'License|Copyright', re.IGNORECASE))
            if license_header:
                license_cell = license_header.find_next('td')
                if license_cell:
                    author_info["license"] = license_cell.get_text(strip=True)
            
            # Extract description
            desc_header = info_section.find('th', string=re.compile(r'Description', re.IGNORECASE))
            if desc_header:
                desc_cell = desc_header.find_next('td')
                if desc_cell:
                    author_info["description"] = desc_cell.get_text(strip=True)
            
            # Extract date
            date_header = info_section.find('th', string=re.compile(r'Date', re.IGNORECASE))
            if date_header:
                date_cell = date_header.find_next('td')
                if date_cell:
                    author_info["date"] = date_cell.get_text(strip=True)
            
            # Extract source
            source_header = info_section.find('th', string=re.compile(r'Source', re.IGNORECASE))
            if source_header:
                source_cell = source_header.find_next('td')
                if source_cell:
                    author_info["source"] = source_cell.get_text(strip=True)
        
        # Method 2: Look for credit line
        if not author_info["author"]:
            credit_div = soup.find('div', class_='commons-file-information-credit')
            if credit_div:
                author_info["author"] = credit_div.get_text(strip=True)
        
        # Method 3: Look for structured data
        structured_data_section = soup.find('h2', string=lambda s: s and 'Structured data' in s)
        if structured_data_section:
            # Look for license information in structured data
            license_section = soup.find(string=lambda s: s and 'copyright license' in s.lower())
            if license_section:
                # Find the next element which might contain the license info
                license_elem = license_section.find_next(['a', 'div', 'span'])
                if license_elem:
                    license_text = license_elem.get_text(strip=True)
                    if license_text and not author_info["license"]:
                        author_info["license"] = license_text
            
            # Look for author information in structured data
            author_section = soup.find(string=lambda s: s and 'creator' in s.lower())
            if author_section:
                # Find the next element which might contain the author info
                author_elem = author_section.find_next(['a', 'div', 'span'])
                if author_elem:
                    author_text = author_elem.get_text(strip=True)
                    if author_text and not author_info["author"]:
                        author_info["author"] = author_text
        
        # Method 4: Look for license templates
        if not author_info["license"]:
            # Look for Public Domain markers
            pd_markers = [
                'This file is in the public domain',
                'This work is in the public domain',
                'Public domain',
                'PD-old',
                'Creative Commons Public Domain Mark',
                'CC0',
                'CC-Zero'
            ]
            
            for marker in pd_markers:
                pd_match = soup.find(string=lambda s: s and marker in s)
                if pd_match:
                    author_info["license"] = "Public Domain"
                    break
            
            # Look for GNU Free Documentation License
            if not author_info["license"]:
                gfdl_match = soup.find(string=lambda s: s and 'GNU Free Documentation License' in s)
                if gfdl_match:
                    # Try to find the version
                    version_match = re.search(r'Version (\d+\.\d+)', gfdl_match)
                    if version_match:
                        author_info["license"] = f"GNU Free Documentation License, version {version_match.group(1)}"
                    else:
                        author_info["license"] = "GNU Free Documentation License"
            
            # Look for other license templates
            if not author_info["license"]:
                license_templates = soup.find_all('div', class_='licensetpl')
                if license_templates:
                    for template in license_templates:
                        template_text = template.get_text(strip=True)
                        if template_text:
                            author_info["license"] = template_text
                            break
        
        # Method 5: Look for the file information section
        if not any(author_info.values()):
            file_info = soup.find('div', class_='mw-parser-output')
            if file_info:
                # Look for paragraphs that might contain author info
                paragraphs = file_info.find_all('p')
                for p in paragraphs:
                    p_text = p.get_text(strip=True)
                    if 'author' in p_text.lower() or 'creator' in p_text.lower() or 'photographer' in p_text.lower():
                        author_info["author"] = p_text
                        break
                
                # Look for public domain mentions in paragraphs
                if not author_info["license"]:
                    for p in paragraphs:
                        p_text = p.get_text(strip=True).lower()
                        if 'public domain' in p_text or 'pd-old' in p_text or 'cc0' in p_text:
                            author_info["license"] = "Public Domain"
                            break
        
        # Method 6: Look for the information section with different class names
        if not any(author_info.values()):
            all_tables = soup.find_all('table')
            for table in all_tables:
                if 'fileinfotpl' in str(table.get('class', '')):
                    rows = table.find_all('tr')
                    for row in rows:
                        header = row.find('th')
                        if header:
                            header_text = header.get_text(strip=True).lower()
                            value = row.find('td')
                            if value:
                                value_text = value.get_text(strip=True)
                                if 'author' in header_text or 'creator' in header_text or 'photographer' in header_text:
                                    author_info["author"] = value_text
                                elif 'license' in header_text or 'copyright' in header_text:
                                    author_info["license"] = value_text
                                elif 'description' in header_text:
                                    author_info["description"] = value_text
                                elif 'date' in header_text:
                                    author_info["date"] = value_text
                                elif 'source' in header_text:
                                    author_info["source"] = value_text
        
        # Method 7: Look for the metadata section
        metadata_section = soup.find('div', id='mw-imagepage-content')
        if metadata_section and not any(author_info.values()):
            # Look for spans with labels
            spans = metadata_section.find_all('span')
            for span in spans:
                span_text = span.get_text(strip=True).lower()
                if 'author' in span_text or 'creator' in span_text:
                    next_sibling = span.next_sibling
                    if next_sibling:
                        author_info["author"] = next_sibling.get_text(strip=True) if hasattr(next_sibling, 'get_text') else str(next_sibling).strip()
        
        # Method 8: Direct search for specific elements
        if not author_info["author"]:
            # Look for the specific td with id="fileinfotpl_aut"
            author_td = soup.find('td', id='fileinfotpl_aut')
            if author_td and author_td.find_next('td'):
                author_info["author"] = author_td.find_next('td').get_text(strip=True)
            
            # Look for photographer field in the summary table
            photographer_row = soup.find('th', string='Photographer')
            if photographer_row:
                photographer_cell = photographer_row.find_next('td')
                if photographer_cell:
                    author_info["author"] = photographer_cell.get_text(strip=True)
        
        # Clean up the extracted data
        for key, value in author_info.items():
            if value:
                # Remove excessive whitespace
                author_info[key] = re.sub(r'\s+', ' ', value).strip()
        
        # Generate a formatted attribution if not already found
        if not author_info["formatted_attribution"] and author_info["author"]:
            license_short = extract_license_short(author_info["license"]) if author_info["license"] else "Unknown License"
            author_info["formatted_attribution"] = f"{author_info['author']}, {license_short}, via Wikimedia Commons"
        
        return author_info
    
    except Exception as e:
        print(f"Error extracting author info from {description_url}: {e}")
        return {
            "author": None,
            "license": None,
            "description": None,
            "date": None,
            "source": None,
            "url": description_url,
            "formatted_attribution": None,
            "error": str(e)
        }

def extract_license_short(license_text):
    """Extract a short license description from the full license text."""
    if not license_text:
        return "Unknown License"
    
    # Check for Public Domain
    if license_text.lower() == "public domain" or "public domain" in license_text.lower():
        return "Public Domain"
    
    # Check for CC0 or CC-Zero
    if "cc0" in license_text.lower() or "cc-zero" in license_text.lower():
        return "CC0 (Public Domain)"
    
    # Look for CC BY or CC BY-SA pattern
    cc_match = re.search(r'CC BY(-SA)? \d\.\d', license_text)
    if cc_match:
        return cc_match.group(0)
    
    # Look for Creative Commons Attribution pattern
    cc_attr_match = re.search(r'Creative Commons Attribution(-Share Alike)? \d\.\d', license_text)
    if cc_attr_match:
        return cc_attr_match.group(0)
    
    # Look for GNU Free Documentation License pattern
    gfdl_match = re.search(r'GNU Free Documentation License(,\s*[Vv]ersion\s*(\d+\.\d+))?', license_text)
    if gfdl_match:
        if gfdl_match.group(2):
            return f"GFDL {gfdl_match.group(2)}"
        else:
            return "GFDL"
    
    # If no specific pattern is found, return a generic description
    if 'creative commons' in license_text.lower():
        if 'attribution' in license_text.lower() and 'share alike' in license_text.lower():
            return "Creative Commons Attribution-Share Alike"
        elif 'attribution' in license_text.lower():
            return "Creative Commons Attribution"
        else:
            return "Creative Commons License"
    elif 'gnu' in license_text.lower() and 'free documentation' in license_text.lower():
        return "GNU Free Documentation License"
    
    return "See License Information"

def process_single_url(image_url, name="Test Image"):
    """Process a single image URL for testing purposes."""
    print(f"Processing image: {name}")
    print(f"Original URL: {image_url}")
    
    description_url = convert_to_description_url(image_url)
    print(f"Description URL: {description_url}")
    
    if description_url:
        author_info = extract_author_info(description_url)
        print("\nAuthor Information:")
        for key, value in author_info.items():
            print(f"{key}: {value}")
        
        return author_info
    else:
        print("Could not convert to description URL")
        return None

def process_file(file_path, output_dir="output"):
    """Process all image URLs in a JSON file and save the results."""
    print(f"Processing file: {file_path}")
    
    # Load the JSON data
    data = load_json_file(file_path)
    
    # Extract image URLs
    image_items = extract_image_urls(data)
    print(f"Found {len(image_items)} image URLs")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each URL
    results = []
    for i, item in enumerate(image_items):
        print(f"\nProcessing image {i+1}/{len(image_items)}: {item['name']}")
        
        description_url = convert_to_description_url(item['url'])
        if description_url:
            print(f"Description URL: {description_url}")
            author_info = extract_author_info(description_url)
            
            # Add item name and original URL to the results
            author_info["item_name"] = item["name"]
            author_info["original_url"] = item["url"]
            
            results.append(author_info)
            
            # Be nice to the server
            time.sleep(1)
        else:
            print(f"Could not convert to description URL: {item['url']}")
    
    # Save the results
    base_filename = os.path.basename(file_path).split('.')[0]
    output_path = os.path.join(output_dir, f"{base_filename}_attribution.json")
    
    with open(output_path, 'w') as f:
        json.dump({"attributions": results}, f, indent=2)
    
    print(f"\nResults saved to {output_path}")
    return results

def process_file_sample(file_path, sample_size=5, output_dir="output"):
    """Process a sample of image URLs in a JSON file and save the results."""
    print(f"Processing sample from file: {file_path}")
    
    # Load the JSON data
    data = load_json_file(file_path)
    
    # Extract image URLs
    image_items = extract_image_urls(data)
    print(f"Found {len(image_items)} image URLs, processing {min(sample_size, len(image_items))} samples")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process a sample of URLs
    results = []
    for i, item in enumerate(image_items[:sample_size]):
        print(f"\nProcessing image {i+1}/{min(sample_size, len(image_items))}: {item['name']}")
        
        description_url = convert_to_description_url(item['url'])
        if description_url:
            print(f"Description URL: {description_url}")
            author_info = extract_author_info(description_url)
            
            # Add item name and original URL to the results
            author_info["item_name"] = item["name"]
            author_info["original_url"] = item["url"]
            
            results.append(author_info)
            
            # Be nice to the server
            time.sleep(1)
        else:
            print(f"Could not convert to description URL: {item['url']}")
    
    # Save the results
    base_filename = os.path.basename(file_path).split('.')[0]
    output_path = os.path.join(output_dir, f"{base_filename}_sample_attribution.json")
    
    with open(output_path, 'w') as f:
        json.dump({"attributions": results}, f, indent=2)
    
    print(f"\nResults saved to {output_path}")
    return results

def debug_page_structure(url):
    """Debug function to print the HTML structure of a page."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for attribution-related elements
        print("Looking for attribution elements...")
        
        # Check for the stockphoto_attribution input
        attribution_input = soup.find('input', id='stockphoto_attribution')
        if attribution_input:
            print(f"Found stockphoto_attribution input: {attribution_input}")
            print(f"Value: {attribution_input.get('value')}")
        else:
            print("No stockphoto_attribution input found")
        
        # Look for "Use this file on the web" section
        print("\nLooking for 'Use this file on the web' section...")
        use_file_headings = soup.find_all(['h2', 'h3', 'h4'], string=lambda s: s and 'Use this file' in s)
        
        if use_file_headings:
            print(f"Found {len(use_file_headings)} 'Use this file' headings")
            for i, heading in enumerate(use_file_headings):
                print(f"Heading {i+1}: {heading.get_text(strip=True)}")
                
                # Look for the next section that might contain attribution info
                next_section = heading.find_next(['div', 'section'])
                if next_section:
                    print(f"  Next section: {next_section.name}")
                    
                    # Look for input elements in this section
                    inputs = next_section.find_all('input')
                    print(f"  Found {len(inputs)} input elements in this section")
                    for j, input_elem in enumerate(inputs):
                        print(f"    Input {j+1}:")
                        print(f"      ID: {input_elem.get('id')}")
                        print(f"      Name: {input_elem.get('name')}")
                        print(f"      Value: {input_elem.get('value')[:100]}..." if input_elem.get('value') else "      Value: None")
        else:
            print("No 'Use this file' headings found")
        
        # Look for "Reuse this file" section
        print("\nLooking for 'Reuse this file' section...")
        reuse_file_headings = soup.find_all(['h2', 'h3', 'h4'], string=lambda s: s and 'Reuse this file' in s)
        
        if reuse_file_headings:
            print(f"Found {len(reuse_file_headings)} 'Reuse this file' headings")
            for i, heading in enumerate(reuse_file_headings):
                print(f"Heading {i+1}: {heading.get_text(strip=True)}")
                
                # Look for the next section that might contain attribution info
                next_section = heading.find_next(['div', 'section'])
                if next_section:
                    print(f"  Next section: {next_section.name}")
                    
                    # Look for input elements in this section
                    inputs = next_section.find_all('input')
                    print(f"  Found {len(inputs)} input elements in this section")
                    for j, input_elem in enumerate(inputs):
                        print(f"    Input {j+1}:")
                        print(f"      ID: {input_elem.get('id')}")
                        print(f"      Name: {input_elem.get('name')}")
                        print(f"      Value: {input_elem.get('value')[:100]}..." if input_elem.get('value') else "      Value: None")
        else:
            print("No 'Reuse this file' headings found")
        
        # Look for text patterns that might indicate attribution information
        print("\nLooking for text patterns that might indicate attribution information...")
        
        # Pattern 1: "Author, CC BY-SA X.X, via Wikimedia Commons"
        pattern1_elements = soup.find_all(string=lambda s: s and re.search(r'.*,\s*CC BY(-SA)? \d\.\d,\s*via Wikimedia Commons', s))
        print(f"Found {len(pattern1_elements)} elements matching pattern 'Author, CC BY-SA X.X, via Wikimedia Commons'")
        for i, elem in enumerate(pattern1_elements):
            print(f"Pattern 1 Element {i+1}:")
            print(f"  Parent Tag: {elem.parent.name}")
            print(f"  Text: {elem[:100]}...")
        
        # Pattern 2: "Attribution:"
        pattern2_elements = soup.find_all(string=lambda s: s and 'Attribution:' in s)
        print(f"Found {len(pattern2_elements)} elements containing 'Attribution:'")
        for i, elem in enumerate(pattern2_elements):
            print(f"Pattern 2 Element {i+1}:")
            print(f"  Parent Tag: {elem.parent.name}")
            print(f"  Text: {elem[:100]}...")
            
            # Look at the next element which might contain the actual attribution
            next_elem = elem.parent.next_sibling
            if next_elem:
                print(f"  Next Element: {next_elem.name if hasattr(next_elem, 'name') else type(next_elem)}")
                print(f"  Next Element Text: {next_elem.get_text(strip=True)[:100] if hasattr(next_elem, 'get_text') else str(next_elem)[:100]}...")
        
        # Pattern 3: Look for any elements containing both the author name and "CC BY"
        author_name = None
        if soup.find('td', id='fileinfotpl_aut'):
            author_td = soup.find('td', id='fileinfotpl_aut').find_next('td')
            if author_td:
                author_name = author_td.get_text(strip=True)
        
        if author_name:
            print(f"\nLooking for elements containing both '{author_name}' and 'CC BY'...")
            pattern3_elements = soup.find_all(string=lambda s: s and author_name in s and 'CC BY' in s)
            print(f"Found {len(pattern3_elements)} elements containing both '{author_name}' and 'CC BY'")
            for i, elem in enumerate(pattern3_elements):
                print(f"Pattern 3 Element {i+1}:")
                print(f"  Parent Tag: {elem.parent.name}")
                print(f"  Text: {elem[:100]}...")
        
        # Look for any elements with 'attribution' in their id or class
        attribution_elements = soup.find_all(lambda tag: tag.has_attr('id') and 'attribution' in tag['id'].lower() or 
                                            tag.has_attr('class') and any('attribution' in c.lower() for c in tag['class']))
        
        print(f"\nFound {len(attribution_elements)} elements with 'attribution' in id or class")
        for i, elem in enumerate(attribution_elements):
            print(f"Element {i+1}:")
            print(f"  Tag: {elem.name}")
            print(f"  ID: {elem.get('id')}")
            print(f"  Class: {elem.get('class')}")
            print(f"  Text: {elem.get_text(strip=True)[:100]}...")
        
        # Look for any elements with 'credit' in their id or class
        credit_elements = soup.find_all(lambda tag: tag.has_attr('id') and 'credit' in tag['id'].lower() or 
                                       tag.has_attr('class') and any('credit' in c.lower() for c in tag['class']))
        
        print(f"\nFound {len(credit_elements)} elements with 'credit' in id or class")
        for i, elem in enumerate(credit_elements):
            print(f"Credit Element {i+1}:")
            print(f"  Tag: {elem.name}")
            print(f"  ID: {elem.get('id')}")
            print(f"  Class: {elem.get('class')}")
            print(f"  Text: {elem.get_text(strip=True)[:100]}...")
        
        # Look for any elements with 'cite' in their id or class
        cite_elements = soup.find_all(lambda tag: tag.has_attr('id') and 'cite' in tag['id'].lower() or 
                                     tag.has_attr('class') and any('cite' in c.lower() for c in tag['class']))
        
        print(f"\nFound {len(cite_elements)} elements with 'cite' in id or class")
        for i, elem in enumerate(cite_elements):
            print(f"Cite Element {i+1}:")
            print(f"  Tag: {elem.name}")
            print(f"  ID: {elem.get('id')}")
            print(f"  Class: {elem.get('class')}")
            print(f"  Text: {elem.get_text(strip=True)[:100]}...")
        
        return soup
    
    except Exception as e:
        print(f"Error debugging page structure: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Scrape author information from Wikipedia images')
    parser.add_argument('--file', help='JSON file containing image URLs')
    parser.add_argument('--url', help='Single image URL to test')
    parser.add_argument('--output', default='output', help='Output directory')
    parser.add_argument('--sample', type=int, help='Process only a sample of URLs from the file')
    parser.add_argument('--debug', action='store_true', help='Print debug information about the page structure')
    
    args = parser.parse_args()
    
    if args.url and args.debug:
        # Debug the page structure
        description_url = convert_to_description_url(args.url)
        if description_url:
            debug_page_structure(description_url)
        else:
            print("Could not convert to description URL")
    elif args.url:
        # Test a single URL
        process_single_url(args.url)
    elif args.file and args.sample:
        # Process a sample from a file
        process_file_sample(args.file, args.sample, args.output)
    elif args.file:
        # Process a file
        process_file(args.file, args.output)
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 