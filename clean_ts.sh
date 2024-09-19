#!/bin/bash

# Find and delete all .d.ts files excluding node_modules
find . -type f -name "*.d.ts" -not -path "./node_modules/*" -exec rm -f {} +

# Find and delete all .js files excluding node_modules
find . -type f -name "*.js" -not -path "./node_modules/*" -exec rm -f {} +