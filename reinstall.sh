#!/bin/bash

echo "🔨 Building BAC4 plugin..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🗑️  Removing old plugin installations..."

# Remove old installations
rm -rf "/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4"
rm -rf "/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4"

echo ""
echo "📁 Creating fresh plugin folders..."

# Create fresh folders
mkdir -p "/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4"
mkdir -p "/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4"

echo ""
echo "📦 Deploying to vaults..."

# Deploy to BAC4Testv09
cp main.js "/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4/"
cp manifest.json "/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4/"
echo "✅ Deployed to BAC4Testv09"

# Deploy to TestVault
cp main.js "/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4/"
cp manifest.json "/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4/"
echo "✅ Deployed to TestVault"

echo ""
echo "✅ Verification..."
ls -lh "/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4/"
echo ""
ls -lh "/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4/"

echo ""
echo "🎉 Done! Reload Obsidian (Cmd+R) to see changes."
