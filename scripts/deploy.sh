#!/bin/bash

echo "Updating gh-pages branch..."

# Save current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)

# Switch to gh-pages branch
git checkout gh-pages

# Copy all necessary files from main branch
git checkout main -- *.html data/* images/* js/* styles.css

# Commit changes
git add .
git commit -m "chore: sync with main branch"

# Push changes
git push origin gh-pages

# Return to original branch
git checkout $CURRENT_BRANCH

echo "Deployment completed! The site will be available in a few minutes at https://flavioluiz.github.io/FlightDataBank/" 