# Wikipedia Image Attribution Scraper

This tool scrapes attribution information for images hosted on Wikimedia Commons. It's designed to work with JSON files containing image URLs from Wikipedia, specifically for aircraft and bird images.

## Features

- Extracts author, license, description, date, and source information from Wikimedia Commons
- Works with both direct image URLs and thumbnail URLs
- Can process an entire JSON file or test a single URL
- Saves results in a structured JSON format

## Requirements

- Python 3.6+
- Required packages: requests, beautifulsoup4

## Installation

1. Clone this repository or download the script
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

### Process a JSON file

```bash
python wiki_image_scraper.py --file data/aircraft.json --output attribution_results
```

This will:
1. Load the JSON file
2. Extract all image URLs
3. Convert them to Wikimedia Commons description page URLs
4. Scrape the attribution information
5. Save the results to `attribution_results/aircraft_attribution.json`

### Test a single URL

```bash
python wiki_image_scraper.py --url "https://upload.wikimedia.org/wikipedia/commons/5/50/Ryanair_Boeing_737-800_EI-CSW.jpg"
```

This will print the attribution information for the specified image URL.

## Output Format

The output is a JSON file with the following structure:

```json
{
  "attributions": [
    {
      "author": "Author name",
      "license": "License information",
      "description": "Image description",
      "date": "Creation date",
      "source": "Source information",
      "url": "Description page URL",
      "item_name": "Name from the original JSON",
      "original_url": "Original image URL"
    },
    ...
  ]
}
```

## Notes

- The script includes a 1-second delay between requests to avoid overloading the Wikimedia servers
- Some images may not have complete attribution information available 