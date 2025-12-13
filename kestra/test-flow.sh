#!/bin/bash

# Script to test Kestra flow execution
# Usage: ./test-flow.sh

KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-ai.metamorph}"
FLOW_ID="${FLOW_ID:-metamorph_healing_loop}"

echo "🚀 Testing Kestra Flow Execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Kestra URL: $KESTRA_URL"
echo "Namespace: $NAMESPACE"
echo "Flow ID: $FLOW_ID"
echo ""

# Check if Kestra is running
if ! curl -s "$KESTRA_URL/api/v1/health" > /dev/null 2>&1; then
    echo "❌ Error: Kestra is not running at $KESTRA_URL"
    echo "   Please start Kestra first: docker-compose up -d"
    exit 1
fi

echo "✅ Kestra is running"
echo ""
echo "Triggering flow execution..."
echo ""

# Trigger the flow (Kestra requires multipart/form-data)
response=$(curl -s -X POST "$KESTRA_URL/api/v1/executions/$NAMESPACE/$FLOW_ID" \
    -F "inputs.error_logs=CRITICAL: Memory leak detected in src/vulnerable_code.js around line 15. Process exited with code 137.")

# Check if response contains an execution ID (success) or error message
if echo "$response" | grep -q '"id"'; then
    execution_id=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "unknown")
    state=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('state', {}).get('current', 'unknown'))" 2>/dev/null || echo "unknown")
    echo "✅ Flow execution triggered successfully!"
    echo ""
    echo "Execution ID: $execution_id"
    echo "State: $state"
    echo ""
    echo "View execution in Kestra UI:"
    echo "  $KESTRA_URL/ui/executions/$NAMESPACE/$execution_id"
    echo ""
    echo "Or watch logs:"
    echo "  docker-compose logs -f kestra"
else
    echo "❌ Error triggering flow:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    exit 1
fi

