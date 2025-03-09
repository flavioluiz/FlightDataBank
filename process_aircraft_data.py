import json
import math
from pathlib import Path
from typing import Dict, List, Union
import os

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
        'max_roc'
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

def process_database(input_file: str, output_file: str, start_id: int = 1) -> int:
    """
    Process the aircraft database and save the results.
    Returns the next available ID after processing.
    """
    # Load data
    data = load_json_data(input_file)
    current_id = start_id
    
    # Process each aircraft
    if 'aircraft' in data:
        processed_aircraft = []
        for aircraft in data['aircraft']:
            # Assign new ID
            aircraft['id'] = current_id
            current_id += 1
            
            # Rename fields with units
            aircraft = rename_fields_with_units(aircraft)
            # Compute derived values
            aircraft = compute_derived_values(aircraft)
            if aircraft:  # Only add if processing was successful
                processed_aircraft.append(aircraft)
        
        # Update the data with processed aircraft
        data['aircraft'] = processed_aircraft
    
    if 'birds' in data:
        processed_birds = []
        for bird in data['birds']:
            # Assign new ID
            bird['id'] = current_id
            current_id += 1
            
            # Rename fields with units
            bird = rename_fields_with_units(bird)
            # Compute derived values
            bird = compute_derived_values(bird)
            if bird:  # Only add if processing was successful
                processed_birds.append(bird)
        
        # Update the data with processed birds
        data['birds'] = processed_birds
    
    # Save processed data
    save_json_data(data, output_file)
    
    return current_id

def main():
    # Define input and output paths
    data_dir = Path('data')
    processed_dir = data_dir / 'processed'
    
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    
    # Process aircraft data first, starting with ID 1
    next_id = process_database(
        str(data_dir / 'aircraft.json'),
        str(processed_dir / 'aircraft_processed.json'),
        start_id=1
    )
    
    # Process birds data, starting with ID after the last aircraft
    process_database(
        str(data_dir / 'birds.json'),
        str(processed_dir / 'birds_processed.json'),
        start_id=next_id
    )

if __name__ == "__main__":
    main() 