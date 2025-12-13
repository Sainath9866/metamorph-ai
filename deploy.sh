#!/bin/bash

# MetaMorph AI - Automated Deployment Script
# This script helps you quickly deploy to Vercel and set up all integrations

set -e  # Exit on error

echo "🚀 MetaMorph AI - Deployment Script"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Deploy to Vercel:"
echo "   Run: vercel"
echo "   - Choose 'metamorph-ai' as the project name"
echo "   - Link to Sainath9866/metamorph-ai repository"
echo "   - Use default settings (Next.js detected automatically)"
echo ""

echo "2. Add GitHub Secrets:"
echo "   Go to: https://github.com/Sainath9866/metamorph-ai/settings/secrets/actions"
echo "   Add: OPENROUTER_API_KEY"
echo ""

echo "3. Install CodeRabbit:"
echo "   Visit: https://coderabbit.ai"
echo "   Install on: Sainath9866/metamorph-ai"
echo ""

echo "4. Start Kestra:"
echo "   cd kestra && docker-compose up -d"
echo ""

echo "5. Test the demo:"
echo "   Open your Vercel URL and click 'SIMULATE FAILURE'"
echo ""

# Optional: Run Vercel deployment automatically
read -p "Would you like to deploy to Vercel now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel..."
    vercel
fi
