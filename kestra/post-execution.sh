#!/bin/bash
# Post-execution script to make HTTP calls after Kestra flow completes
# Usage: ./post-execution.sh <execution-id>

EXECUTION_ID=$1
KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-ai.metamorph}"

if [ -z "$EXECUTION_ID" ]; then
    echo "Usage: ./post-execution.sh <execution-id>"
    echo "Get execution ID from: $KESTRA_URL/ui/executions"
    exit 1
fi

echo "📊 Fetching execution data from Kestra..."
EXECUTION_DATA=$(curl -s "$KESTRA_URL/api/v1/executions/$NAMESPACE/$EXECUTION_ID")

# Extract AI analysis result (simplified - in production use jq)
AI_MESSAGE=$(echo "$EXECUTION_DATA" | grep -o '"message":"[^"]*"' | head -1 | sed 's/"message":"\([^"]*\)"/\1/')
ERROR_LOG=$(echo "$EXECUTION_DATA" | grep -o '"error_logs":"[^"]*"' | sed 's/"error_logs":"\([^"]*\)"/\1/')

if [ -z "$AI_MESSAGE" ]; then
    echo "⚠️  Could not extract AI message. Using fallback."
    AI_MESSAGE="Memory leak detected - requires fix"
fi

echo ""
echo "🔗 Making HTTP calls..."

# 1. Send to Vercel
echo "📡 Sending to Vercel dashboard..."
curl -X POST "https://metamorph-ai-three.vercel.app/api/webhooks" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"ANALYZING\",\"message\":\"$AI_MESSAGE\",\"type\":\"warning\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  && echo " ✅ Vercel webhook sent"

# 2. Trigger GitHub Actions
echo ""
echo "🤖 Triggering GitHub Actions..."
if [ -f .env ]; then
    source .env
    GITHUB_PAT_DECODED=$(echo "$SECRET_GITHUB_PAT" | base64 -d 2>/dev/null || echo "$SECRET_GITHUB_PAT")
else
    echo "⚠️  .env file not found. Set GITHUB_PAT manually."
    read -sp "Enter GitHub PAT: " GITHUB_PAT_DECODED
    echo ""
fi

curl -X POST "https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches" \
  -H "Authorization: Bearer $GITHUB_PAT_DECODED" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"deploy-agent\",\"client_payload\":{\"mission\":\"$AI_MESSAGE\",\"original_error\":\"$ERROR_LOG\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" \
  && echo " ✅ GitHub Actions triggered"

echo ""
echo "✅ Post-execution complete!"
echo "Check GitHub Actions: https://github.com/Sainath9866/metamorph-ai/actions"

