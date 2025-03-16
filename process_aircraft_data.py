import json
import math
from pathlib import Path
import os
import subprocess
import sys
from typing import Dict, List, Union
from add_thumbnail_urls import get_thumbnail_url
import requests
from bs4 import BeautifulSoup
import re

def compute_isa_density(altitude_m: float) -> float:
    """
    Compute air density using the International Standard Atmosphere (ISA) model.
    
    Parameters:
    altitude_m (float): Altitude in meters
    
    Returns:
    float: Air density in kg/m³
    """
    # ISA model constants
    T0 = 288.15  # Sea level temperature in K
    P0 = 101325  # Sea level pressure in Pa
    rho0 = 1.225  # Sea level density in kg/m³
    g = 9.80665  # Gravitational acceleration in m/s²
    R = 287.05   # Gas constant for air in J/(kg·K)
    a = -0.0065  # Temperature lapse rate in K/m for troposphere
    
    if altitude_m <= 11000:  # Troposphere
        # Temperature at given altitude
        T = T0 + a * altitude_m
        # Pressure at given altitude
        P = P0 * (T / T0) ** (-g / (a * R))
        # Density at given altitude using ideal gas law
        rho = P / (R * T)
    else:  # Simplified model for stratosphere (constant temperature)
        T = T0 + a * 11000
        P11 = P0 * (T / T0) ** (-g / (a * R))
        P = P11 * math.exp(-g * (altitude_m - 11000) / (R * T))
        rho = P / (R * T)
    
    return rho

def determine_wtc(mtow_N: float) -> str:
    """
    Determine Wake Turbulence Category (WTC) based on MTOW.
    
    Parameters:
    mtow_N (float): Maximum Take-Off Weight in Newtons
    
    Returns:
    str: Wake Turbulence Category ('Light', 'Medium', or 'Heavy')
    """
    # Convert Newtons to kg (divide by standard gravity)
    mtow_kg = mtow_N / 9.80665
    
    if mtow_kg <= 7000:
        return "Light"
    elif mtow_kg < 136000:
        return "Medium"
    else:
        return "Heavy"

def determine_era(first_flight_year: int) -> str:
    """
    Determine the aviation era based on the first flight year.
    
    Parameters:
    first_flight_year (int): Year of first flight
    
    Returns:
    str: Aviation era
    """
    if first_flight_year is None:
        return "Unknown"
    
    if first_flight_year < 1914:
        return "Pioneer Era"
    elif first_flight_year < 1939:
        return "Golden Age"
    elif first_flight_year < 1945:
        return "World War II"
    elif first_flight_year < 1958:
        return "Post-War"
    elif first_flight_year < 1970:
        return "Jet Age"
    elif first_flight_year < 1990:
        return "Modern Commercial"
    elif first_flight_year < 2010:
        return "Digital Era"
    else:
        return "Contemporary"

def load_json_data(file_path: str) -> dict:
    """Load JSON data from a file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json_data(data: dict, file_path: str) -> None:
    """Save JSON data to a file with proper formatting."""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def rename_fields_with_units(aircraft: dict) -> dict:
    """Rename fields to include units explicitly."""
    field_mapping = {
        'mtow_N': 'mtow_N',  # Already has units
        'wing_area_m2': 'wing_area_m2',  # Already has units
        'wingspan_m': 'wingspan_m',  # Already has units
        'cruise_speed_ms': 'cruise_speed_ms',  # Already has units
        'takeoff_speed_ms': 'takeoff_speed_ms',  # Already has units
        'landing_speed_ms': 'landing_speed_ms',  # Already has units
        'service_ceiling_m': 'service_ceiling_m',  # Already has units
        'max_thrust_kN': 'max_thrust_kN',  # Adding kN unit
        'cruise_altitude_m': 'cruise_altitude_m',  # Already has units
        'max_speed_ms': 'max_speed_ms',  # Already has units
        'range_km': 'range_km',  # Already has units
        'max_roc_ms': 'max_roc_ms',  # Adding m/s unit for rate of climb
    }
    
    processed = {}
    for key, value in aircraft.items():
        new_key = field_mapping.get(key, key)
        # Convert max_thrust from kN to N if present
        if key == 'max_thrust' and value is not None:
            processed[new_key] = value
        else:
            processed[new_key] = value
    
    return processed

def compute_derived_values(aircraft):
    """
    Compute derived values for an aircraft based on its basic parameters.
    """
    try:
        # Copy all existing fields
        processed = aircraft.copy()
        
        # Basic validations and conversions
        required_fields = [
            'mtow_N',
            'wing_area_m2',
            'wingspan_m',
            'cruise_speed_ms',
            'cruise_altitude_m'
        ]
        
        # Optional fields with default values
        optional_fields = {
            'empty_weight_N': None,
            'max_payload_N': None,
            'length_m': None,
            'height_m': None,
            'max_power_kW': None,
            'fuel_capacity_kg': None,
            'notes': None
        }
        
        # Add missing optional fields with default values
        for field, default_value in optional_fields.items():
            if field not in processed:
                processed[field] = default_value

        # Validate required fields
        for field in required_fields:
            if field not in processed or processed[field] is None:
                print(f"Warning: Missing required field {field} for aircraft {processed.get('name', 'Unknown')}")
                return None
            try:
                processed[field] = float(processed[field])
            except (ValueError, TypeError):
                print(f"Warning: Invalid value for {field} in aircraft {processed.get('name', 'Unknown')}")
                return None

        # Add WTC (Wake Turbulence Category) field
        processed['WTC'] = determine_wtc(processed['mtow_N'])
        
        # Add era field based on first_flight_year
        if 'first_flight_year' in processed and processed['first_flight_year'] is not None:
            try:
                first_flight_year = int(processed['first_flight_year'])
                processed['era'] = determine_era(first_flight_year)
            except (ValueError, TypeError):
                processed['era'] = "Unknown"
        else:
            processed['era'] = "Unknown"

        # Compute air density at cruise altitude
        rho_cruise = compute_isa_density(processed['cruise_altitude_m'])
        rho_sl = compute_isa_density(0)  # Sea level density
        
        # Compute wing loading
        processed['wing_loading_Nm2'] = processed['mtow_N'] / processed['wing_area_m2']
        
        # Compute aspect ratio
        processed['aspect_ratio'] = (processed['wingspan_m'] ** 2) / processed['wing_area_m2']
        
        # Compute equivalent airspeed
        processed['VE_cruise_ms'] = processed['cruise_speed_ms'] * math.sqrt(rho_cruise / rho_sl)
        
        # Compute lift coefficients
        q_cruise = 0.5 * rho_cruise * (processed['cruise_speed_ms'] ** 2)
        processed['CL_cruise'] = processed['mtow_N'] / (q_cruise * processed['wing_area_m2'])
        
        if 'takeoff_speed_ms' in processed and processed['takeoff_speed_ms']:
            q_takeoff = 0.5 * rho_sl * (float(processed['takeoff_speed_ms']) ** 2)
            processed['CL_takeoff'] = processed['mtow_N'] / (q_takeoff * processed['wing_area_m2'])
        
        if 'landing_speed_ms' in processed and processed['landing_speed_ms']:
            q_landing = 0.5 * rho_sl * (float(processed['landing_speed_ms']) ** 2)
            processed['CL_landing'] = processed['mtow_N'] / (q_landing * processed['wing_area_m2'])
        
        # Additional derived values for weight-related parameters
        if processed['empty_weight_N'] is not None:
            processed['useful_load_N'] = processed['mtow_N'] - processed['empty_weight_N']
        
        if processed['max_payload_N'] is not None and processed['empty_weight_N'] is not None:
            processed['max_fuel_load_N'] = processed['mtow_N'] - processed['empty_weight_N'] - processed['max_payload_N']
        
        if processed['fuel_capacity_kg'] is not None:
            processed['max_fuel_weight_N'] = processed['fuel_capacity_kg'] * 9.81

        # Compute thrust-to-weight ratio (dimensionless)
        if 'max_thrust_kN' in processed and processed['max_thrust_kN'] is not None:
            # Convert max_thrust from kN to N by multiplying by 1000
            total_thrust_N = processed['max_thrust_kN'] * 1000 
            processed['thrust_to_weight_ratio'] = total_thrust_N / processed['mtow_N']
            print(f"Computing T/W ratio for {processed['name']}: {processed['thrust_to_weight_ratio']:.3f}")
        else:
            print(f"Warning: Cannot compute T/W ratio for {processed['name']}, missing thrust or engine count data")
        
        return processed
    except Exception as e:
        print(f"Error processing aircraft {aircraft.get('name', 'Unknown')}: {str(e)}")
        return None

def validate_aircraft(aircraft):
    """
    Validate aircraft data and ensure all required fields are present.
    """
    required_fields = [
        'name',
        'mtow_N',
        'wing_area_m2',
        'wingspan_m',
        'cruise_speed_ms',
        'cruise_altitude_m'
    ]
    
    optional_numeric_fields = [
        'empty_weight_N',
        'max_payload_N',
        'length_m',
        'height_m',
        'max_power_kW',
        'fuel_capacity_kg',
        'takeoff_speed_ms',
        'landing_speed_ms',
        'service_ceiling_m',
        'max_thrust',
        'max_speed_ms',
        'range_km',
        'max_roc',
        'first_flight_year'
    ]
    
    # Check required fields
    for field in required_fields:
        if field not in aircraft or aircraft[field] is None:
            print(f"Warning: Missing required field {field} for aircraft {aircraft.get('name', 'Unknown')}")
            return False
    
    # Validate numeric fields
    for field in required_fields + optional_numeric_fields:
        if field in aircraft and aircraft[field] is not None:
            try:
                float(aircraft[field])
            except (ValueError, TypeError):
                print(f"Warning: Invalid numeric value for {field} in aircraft {aircraft.get('name', 'Unknown')}")
                return False
    
    return True

def load_attribution_data(attribution_file):
    """
    Load attribution data from a JSON file.
    
    Parameters:
    attribution_file (str): Path to the attribution JSON file
    
    Returns:
    dict: Dictionary mapping item names to their attribution information
    """
    try:
        if not os.path.exists(attribution_file):
            print(f"Attribution file {attribution_file} not found.")
            return {}
        
        with open(attribution_file, 'r') as f:
            data = json.load(f)
        
        # Create a dictionary mapping item names to their attribution information
        attribution_map = {}
        if 'attributions' in data:
            for item in data['attributions']:
                if 'item_name' in item and 'formatted_attribution' in item:
                    # Store the attribution information with the item name as the key
                    attribution_map[item['item_name']] = item
                    
                    # For birds, also store without the "Bird - " prefix for flexibility
                    if item['item_name'].startswith("Bird - "):
                        bird_name = item['item_name'][7:]  # Remove "Bird - " prefix
                        attribution_map[bird_name] = item
        
        return attribution_map
    except Exception as e:
        print(f"Error loading attribution data: {str(e)}")
        return {}

def run_wiki_image_scraper(input_file, output_dir="attribution_results"):
    """
    Run the wiki_image_scraper.py script to update image attribution information.
    
    Parameters:
    input_file (str): Path to the input JSON file
    output_dir (str): Directory to save the attribution results
    
    Returns:
    bool: True if successful, False otherwise
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Construct the command
        cmd = [
            sys.executable,  # Use the current Python interpreter
            "wiki_image_scraper.py",
            "--file", input_file,
            "--output", output_dir
        ]
        
        # Run the command
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Successfully updated image attribution information.")
            print(result.stdout)
            return True
        else:
            print(f"Error running wiki_image_scraper.py: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error running wiki_image_scraper.py: {str(e)}")
        return False

def clean_wikimedia_url(url):
    """Clean Wikimedia URL to get base filename."""
    if not url:
        return None
        
    # First remove any query parameters (after ?)
    url = url.split('?')[0]
    
    # Get the filename
    filename = url.split('/')[-1]
    
    # If it's a thumb URL, get the original filename
    if '/thumb/' in url:
        # Remove resolution prefix (e.g., '1599px-')
        if 'px-' in filename:
            filename = filename.split('px-')[-1]
        # Remove the thumbnail resolution version completely
        parts = url.split('/thumb/')
        if len(parts) > 1:
            filename = parts[1].split('/')[-2]
    
    return filename

def process_database(input_file: str, output_file: str, start_id: int = 1, attribution_file: str = None, update_thumbnails: bool = False) -> int:
    """
    Process the aircraft database and save the results.
    Returns the next available ID after processing.
    
    Args:
        input_file (str): Path to input JSON file
        output_file (str): Path to output JSON file
        start_id (int): Starting ID for items
        attribution_file (str): Path to attribution JSON file
        update_thumbnails (bool): Whether to update thumbnail URLs from Wikimedia
    """
    print(f"\nProcessing {input_file}")
    print(f"Starting with ID: {start_id}")
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Warning: Input file {input_file} does not exist")
        return start_id
    
    # Load data
    data = load_json_data(input_file)
    current_id = start_id
    
    # Load attribution data if available
    attribution_map = {}
    if attribution_file and os.path.exists(attribution_file):
        attribution_map = load_attribution_data(attribution_file)
        print(f"Loaded attribution data for {len(attribution_map)} items")
    
    # Process each aircraft
    if 'aircraft' in data:
        processed_aircraft = []
        print(f"Found {len(data['aircraft'])} aircraft to process")
        for aircraft in data['aircraft']:
            # Assign new ID
            aircraft['id'] = current_id
            print(f"Processing aircraft {aircraft.get('name', 'Unknown')} with ID {current_id}")
            current_id += 1
            
            # Add attribution information if available
            if aircraft.get('name') in attribution_map:
                attribution = attribution_map[aircraft['name']]
                aircraft['image_attribution'] = attribution.get('formatted_attribution')
                aircraft['image_license'] = attribution.get('license')
                aircraft['image_author'] = attribution.get('author')
                print(f"  Added attribution information for {aircraft['name']}")
            
            # Rename fields with units
            aircraft = rename_fields_with_units(aircraft)
            # Compute derived values
            aircraft = compute_derived_values(aircraft)
            if aircraft:  # Only add if processing was successful
                processed_aircraft.append(aircraft)
            
            # Add thumbnail URL if requested and image_url exists
            if update_thumbnails and aircraft.get('image_url'):
                # Clean up the image URL to get proper filename
                filename = clean_wikimedia_url(aircraft['image_url'])
                if filename:
                    description_url = f"https://commons.wikimedia.org/wiki/File:{filename}"
                    
                    print(f"  Getting thumbnail URL for {aircraft['name']}")
                    print(f"  Description URL: {description_url}")
                    
                    try:
                        response = requests.get(description_url)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            
                            # Find the "Other resolutions" section
                            resolution_text = soup.find(string=re.compile("Other resolutions:"))
                            if resolution_text:
                                # Find the first link after "Other resolutions:" text
                                first_thumbnail = resolution_text.find_next('a', class_='mw-thumbnail-link')
                                if first_thumbnail:
                                    thumbnail_url = first_thumbnail['href']
                                    aircraft['thumbnail_url'] = thumbnail_url
                                    print(f"    Found thumbnail: {thumbnail_url}")
                                else:
                                    print(f"    No thumbnail link found")
                            else:
                                print(f"    No 'Other resolutions' section found")
                        else:
                            print(f"    Failed to get description page: {response.status_code}")
                    except Exception as e:
                        print(f"    Error getting thumbnail: {str(e)}")

        # Update the data with processed aircraft
        data['aircraft'] = processed_aircraft
        print(f"Successfully processed {len(processed_aircraft)} aircraft")
    
    if 'birds' in data:
        processed_birds = []
        print(f"Found {len(data['birds'])} birds to process")
        for bird in data['birds']:
            # Assign new ID
            bird['id'] = current_id
            print(f"Processing bird {bird.get('name', 'Unknown')} with ID {current_id}")
            current_id += 1
            
            # Add attribution information if available
            if bird.get('name') in attribution_map:
                attribution = attribution_map[bird['name']]
                bird['image_attribution'] = attribution.get('formatted_attribution')
                bird['image_license'] = attribution.get('license')
                bird['image_author'] = attribution.get('author')
                print(f"  Added attribution information for {bird['name']}")
            
            # Rename fields with units
            bird = rename_fields_with_units(bird)
            # Compute derived values
            bird = compute_derived_values(bird)
            if bird:  # Only add if processing was successful
                processed_birds.append(bird)
            
            # Add thumbnail URL if requested and image_url exists
            if update_thumbnails and bird.get('image_url'):
                # Clean up the image URL to get proper filename
                filename = clean_wikimedia_url(bird['image_url'])
                if filename:
                    description_url = f"https://commons.wikimedia.org/wiki/File:{filename}"
                    
                    print(f"  Getting thumbnail URL for {bird['name']}")
                    print(f"  Description URL: {description_url}")
                    
                    try:
                        response = requests.get(description_url)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            
                            # Find the "Other resolutions" section
                            resolution_text = soup.find(string=re.compile("Other resolutions:"))
                            if resolution_text:
                                # Find the first link after "Other resolutions:" text
                                first_thumbnail = resolution_text.find_next('a', class_='mw-thumbnail-link')
                                if first_thumbnail:
                                    thumbnail_url = first_thumbnail['href']
                                    bird['thumbnail_url'] = thumbnail_url
                                    print(f"    Found thumbnail: {thumbnail_url}")
                                else:
                                    print(f"    No thumbnail link found")
                            else:
                                print(f"    No 'Other resolutions' section found")
                        else:
                            print(f"    Failed to get description page: {response.status_code}")
                    except Exception as e:
                        print(f"    Error getting thumbnail: {str(e)}")

        # Update the data with processed birds
        data['birds'] = processed_birds
        print(f"Successfully processed {len(processed_birds)} birds")
    
    # Save processed data
    save_json_data(data, output_file)
    print(f"Saved processed data to {output_file}")
    print(f"Next available ID: {current_id}\n")
    
    return current_id

def main():
    # Define input and output paths
    data_dir = Path('data')
    processed_dir = data_dir / 'processed'
    attribution_dir = Path('attribution_results')
    
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    print("\nStarting data processing...")
    print(f"Input directory: {data_dir}")
    print(f"Output directory: {processed_dir}")
    
    # Ask if user wants to update image attribution information
    update_attribution = input("Do you want to update image attribution information? (y/n): ").lower().strip() == 'y'
    
    # Add new prompt for thumbnail URLs
    update_thumbnails = False
    if update_attribution:
        update_thumbnails = input("Do you want to also fetch thumbnail URLs? (y/n): ").lower().strip() == 'y'
    
    if update_attribution:
        print("\nUpdating image attribution information...")
        # Create attribution directory if it doesn't exist
        os.makedirs(attribution_dir, exist_ok=True)
        
        # Update aircraft attribution
        aircraft_input = str(data_dir / 'aircraft.json')
        run_wiki_image_scraper(aircraft_input, str(attribution_dir))
        
        # Update birds attribution
        birds_input = str(data_dir / 'birds.json')
        run_wiki_image_scraper(birds_input, str(attribution_dir))
    
    # Define attribution file paths
    aircraft_attribution = str(attribution_dir / 'aircraft_attribution.json')
    birds_attribution = str(attribution_dir / 'birds_attribution.json')
    
    # Process aircraft data first, starting with ID 1
    aircraft_input = str(data_dir / 'aircraft.json')
    aircraft_output = str(processed_dir / 'aircraft_processed.json')
    next_id = process_database(
        aircraft_input,
        aircraft_output,
        start_id=1,
        attribution_file=aircraft_attribution if os.path.exists(aircraft_attribution) else None,
        update_thumbnails=update_thumbnails
    )
    
    # Process birds data, starting with ID after the last aircraft
    birds_input = str(data_dir / 'birds.json')
    birds_output = str(processed_dir / 'birds_processed.json')
    process_database(
        birds_input,
        birds_output,
        start_id=next_id,
        attribution_file=birds_attribution if os.path.exists(birds_attribution) else None,
        update_thumbnails=update_thumbnails
    )
    
    print("Data processing completed!")

if __name__ == "__main__":
    main() 