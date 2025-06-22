# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static aircraft databank website that displays aircraft and bird data with interactive visualizations, galleries, and comparisons. It's a data-driven web application that processes JSON data about aircraft and birds with their technical specifications and images from Wikimedia Commons.

## Core Architecture

- **Static Website**: HTML/CSS/JavaScript frontend served by Python HTTP server
- **Data Processing Pipeline**: Python scripts that process raw JSON data into structured formats
- **Data Storage**: JSON files in `data/` directory (raw) and `data/processed/` (processed)
- **Image Attribution**: Automated scraping from Wikimedia Commons for proper attribution

### Key Components

- **Frontend Pages**: Multiple HTML pages for different views (gallery, details, comparisons, range maps)
- **JavaScript Modules**: Modular JS files in `js/` directory for specific functionality
- **Data Processing**: `process_aircraft_data.py` is the main data processor that computes aerodynamic values
- **Image Management**: `wiki_image_scraper.py` handles Wikimedia Commons attribution, `add_thumbnail_urls.py` extracts thumbnails

## Development Commands

### Start Development Server
```bash
python serve.py
```
This starts a local HTTP server on port 8000 (or next available port) to serve the static files.

### Process Aircraft Data
```bash
python process_aircraft_data.py
```
Interactive script that:
- Processes raw aircraft/bird data from `data/aircraft.json` and `data/birds.json`
- Computes aerodynamic values (lift coefficients, wing loading, aspect ratio, etc.)
- Adds attribution data from Wikimedia Commons
- Outputs processed data to `data/processed/` directory

### Update Image Attribution
```bash
python wiki_image_scraper.py --file data/aircraft.json --output attribution_results
```
Scrapes Wikimedia Commons for proper image attribution information.

### Add Thumbnail URLs
```bash
python add_thumbnail_urls.py
```
Extracts lower-resolution thumbnail URLs from Wikimedia Commons for faster loading.

## Data Flow

1. **Raw Data**: `data/aircraft.json` and `data/birds.json` contain basic aircraft/bird specifications
2. **Processing**: `process_aircraft_data.py` computes derived aerodynamic values using ISA atmospheric models
3. **Attribution**: Scripts fetch proper attribution data from Wikimedia Commons
4. **Output**: Processed data in `data/processed/` is used by the frontend JavaScript

## Key Technical Features

- **Aerodynamic Calculations**: Implements International Standard Atmosphere (ISA) model for density calculations
- **Wake Turbulence Categories**: Automatically determines WTC based on MTOW
- **Aviation Era Classification**: Categorizes aircraft by historical periods
- **Wikimedia Integration**: Handles Commons URLs, thumbnails, and attribution requirements

## File Structure Notes

- `images/aircraft/` contains individual aircraft info JSON files and some image files
- `test/` and `test_output/` directories contain development artifacts
- `attribution_results/` stores scraped attribution data
- JavaScript files are duplicated between root `js/` and `test/js/` directories

## Dependencies

Python dependencies are minimal:
- `requests` and `beautifulsoup4` for web scraping
- Standard library modules for JSON processing and HTTP serving

Frontend uses:
- Plotly.js for interactive charts and visualizations
- Vanilla JavaScript (no frameworks)