#!/bin/bash

echo "🔨 Building BAC4 plugin..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📦 Deploying to vaults..."

# Deploy to BAC4Testv09
VAULT1="/Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4"
if [ -d "$VAULT1" ]; then
    cp main.js manifest.json "$VAULT1/"
    echo "✅ Deployed to BAC4Testv09"
else
    echo "⚠️  Vault folder not found: $VAULT1"
fi

# Deploy to TestVault
VAULT2="/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4"
if [ -d "$VAULT2" ]; then
    cp main.js manifest.json "$VAULT2/"
    echo "✅ Deployed to TestVault"
else
    echo "⚠️  Vault folder not found: $VAULT2"
fi

echo ""
echo "🎉 Done! Reload Obsidian (Cmd+R) to see changes."
