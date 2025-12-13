#!/bin/bash

# Script to encode secrets for Kestra standalone mode
# Usage: ./encode-secrets.sh

echo "🔐 Encoding Secrets for Kestra Standalone Mode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Kestra standalone mode requires secrets as environment variables:"
echo "  Format: SECRET_<KEY_NAME> (base64-encoded)"
echo ""

read -sp "Enter your OPENROUTER_API_KEY (OpenAI API key): " OPENROUTER_API_KEY
echo ""
OPENROUTER_ENCODED=$(echo -n "$OPENROUTER_API_KEY" | base64)

echo ""
read -sp "Enter your GITHUB_PAT (GitHub Personal Access Token): " GITHUB_PAT
echo ""
GITHUB_PAT_ENCODED=$(echo -n "$GITHUB_PAT" | base64)

echo ""
echo "✅ Encoded secrets:"
echo ""
echo "Add these to your docker-compose.yml environment section:"
echo ""
echo "      SECRET_OPENROUTER_API_KEY: $OPENROUTER_ENCODED"
echo "      SECRET_GITHUB_PAT: $GITHUB_PAT_ENCODED"
echo ""
echo "Or create a .env file with:"
echo "  SECRET_OPENROUTER_API_KEY=$OPENROUTER_ENCODED"
echo "  SECRET_GITHUB_PAT=$GITHUB_PAT_ENCODED"
echo ""

