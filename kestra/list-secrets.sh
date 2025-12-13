#!/bin/bash

# Script to list secrets from standalone Kestra via REST API
# Usage: ./list-secrets.sh

KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-ai.metamorph}"

echo "🔐 Listing secrets from Kestra..."
echo "Kestra URL: $KESTRA_URL"
echo "Namespace: $NAMESPACE"
echo ""

# Check if Kestra is running
if ! curl -s "$KESTRA_URL/api/v1/health" > /dev/null 2>&1; then
    echo "❌ Error: Kestra is not running at $KESTRA_URL"
    echo "   Please start Kestra first: docker-compose up -d"
    exit 1
fi

# Fetch secrets
response=$(curl -s -X GET "$KESTRA_URL/api/v1/secrets/$NAMESPACE")

if [ -z "$response" ] || echo "$response" | grep -q "error\|Error\|404"; then
    echo "❌ Error: Could not fetch secrets"
    echo "   Response: $response"
    exit 1
fi

# Parse and display secrets
echo "📋 Secrets in namespace '$NAMESPACE':"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Use jq if available, otherwise use basic parsing
if command -v jq &> /dev/null; then
    echo "$response" | jq -r '.[] | "Key: \(.key)\nDescription: \(.description // "N/A")\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'
else
    # Basic parsing without jq
    echo "$response" | grep -o '"key":"[^"]*"' | sed 's/"key":"\([^"]*\)"/Key: \1/'
    echo ""
    echo "Note: Install 'jq' for better formatting: brew install jq"
fi

echo ""
echo "✅ Done"

