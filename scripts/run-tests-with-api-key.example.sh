#!/bin/bash

# Example script to run tests with LING_1T_API_KEY
# 
# Usage:
#   1. Copy this script: cp scripts/run-tests-with-api-key.example.sh scripts/run-tests-with-api-key.sh
#   2. Edit the file and add your API key
#   3. Run: ./scripts/run-tests-with-api-key.sh

# Set your LING_1T_API_KEY here
export LING_1T_API_KEY="your_api_key_here"

# Run tests
npm test
