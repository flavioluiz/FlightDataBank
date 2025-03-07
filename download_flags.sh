#!/bin/bash

# Create flags directory if it doesn't exist
mkdir -p web/images/flags

# Download UK flag
curl -o web/images/flags/uk.png "https://flagcdn.com/w40/gb.png"

# Download Brazil flag
curl -o web/images/flags/br.png "https://flagcdn.com/w40/br.png" 