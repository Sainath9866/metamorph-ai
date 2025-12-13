#!/bin/bash

# Script to add secrets to standalone Kestra via REST API
# Usage: ./add-secrets.sh

KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-ai.metamorph}"

echo "🔐 Adding secrets to Kestra..."
echo "Kestra URL: $KESTRA_URL"
echo "Namespace: $NAMESPACE"
echo ""

# Check if Kestra is running
if ! curl -s "$KESTRA_URL/api/v1/health" > /dev/null 2>&1; then
    echo "❌ Error: Kestra is not running at $KESTRA_URL"
    echo "   Please start Kestra first: docker-compose up -d"
    exit 1
fi

# Function to add a secret
add_secret() {
    local key=$1
    local value=$2
    local description=$3
    
    echo "Adding secret: $key"
    
    response=$(curl -s -X POST "$KESTRA_URL/api/v1/secrets/$NAMESPACE" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"value\": \"$value\",
            \"description\": \"$description\"
        }")
    
    if echo "$response" | grep -q "error\|Error"; then
        echo "  ⚠️  Warning: $response"
    else
        echo "  ✅ Success"
    fi
}

# Prompt for secrets
read -sp "Enter your OPENROUTER_API_KEY (OpenAI API key): " OPENROUTER_API_KEY
echo ""
add_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "OpenAI API key for AI analysis"

echo ""
read -sp "Enter your GITHUB_PAT (GitHub Personal Access Token): " GITHUB_PAT
echo ""
add_secret "GITHUB_PAT" "$GITHUB_PAT" "GitHub PAT for triggering Actions"

echo ""
echo "✅ Secrets added successfully!"
echo ""
echo "You can now save your flow.yaml in Kestra UI."

