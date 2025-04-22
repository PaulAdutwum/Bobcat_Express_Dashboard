#!/bin/bash

# Clean up TurboPack artifacts
echo "Removing Next.js build cache and artifacts..."
rm -rf .next

# Clean node_modules cache as well
echo "Cleaning node_modules cache..."
rm -rf node_modules/.cache

# Rebuild the application
echo "Rebuilding application..."
npm run build

# Start the application
echo "Starting application with standard webpack compiler..."
npm run start 