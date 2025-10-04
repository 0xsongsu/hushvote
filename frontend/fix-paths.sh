#!/bin/bash

# Fix all @/ imports to relative imports
echo "Fixing import paths..."

# Fix components imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/|from '../components/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/hooks/|from '../hooks/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/services/|from '../services/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/utils/|from '../utils/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/types'|from '../types'|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/types/|from '../types/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/styles/|from '../styles/|g"

# Fix pages specific paths
find src/pages -name "*.tsx" | xargs sed -i '' "s|from '\.\./|from '../|g"

# Fix components specific paths (they're in same folder)
find src/components -name "*.tsx" | xargs sed -i '' "s|from '\.\./components/|from './|g"

echo "Done!"