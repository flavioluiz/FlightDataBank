#!/usr/bin/env python3
import json
import os

# Read the range data from the temporary file
range_data = {}
with open('aircraft_ranges.txt', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            parts = line.split('|')
            if len(parts) == 2:
                aircraft_name = parts[0].strip()
                range_km = int(parts[1].strip())
                range_data[aircraft_name] = range_km

# Create a backup of the original file
os.system('cp data/aircraft.json data/aircraft.json.backup')

# Read the aircraft.json file
with open('data/aircraft.json', 'r') as f:
    aircraft_data = json.load(f)

# Update the range_km field for each aircraft
updated_count = 0
for aircraft in aircraft_data['aircraft']:
    name = aircraft['name']
    if name in range_data:
        aircraft['range_km'] = range_data[name]
        updated_count += 1
    elif 'range_km' not in aircraft:
        aircraft['range_km'] = None

# Write the updated data back to the file
with open('data/aircraft.json', 'w') as f:
    json.dump(aircraft_data, f, indent=2)

print(f"Updated range data for {updated_count} aircraft.")
print(f"Original file backed up to data/aircraft.json.backup") 