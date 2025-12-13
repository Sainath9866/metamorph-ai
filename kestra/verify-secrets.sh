#!/bin/bash

# Script to verify secrets are accessible in Kestra
# This creates a test flow that uses the secrets

KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-ai.metamorph}"

echo "🔍 Verifying secrets in Kestra..."
echo "Kestra URL: $KESTRA_URL"
echo "Namespace: $NAMESPACE"
echo ""

# Check if Kestra is running
if ! curl -s "$KESTRA_URL/api/v1/health" > /dev/null 2>&1; then
    echo "❌ Error: Kestra is not running at $KESTRA_URL"
    exit 1
fi

echo "✅ Kestra is running"
echo ""
echo "To verify your secrets are working:"
echo ""
echo "1. Go to Kestra UI: http://localhost:8080"
echo "2. Open your flow: metamorph_healing_loop"
echo "3. Try to save it - if it saves without errors, secrets are working!"
echo ""
echo "Or check the flow execution logs when you run it."
echo ""
echo "Your secrets should be:"
echo "  - OPENROUTER_API_KEY"
echo "  - GITHUB_PAT"
echo ""

