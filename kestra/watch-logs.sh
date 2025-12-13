#!/bin/bash

# Script to watch Kestra logs in real-time
# Usage: ./watch-logs.sh

echo "📊 Watching Kestra Logs (Press Ctrl+C to stop)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"
docker-compose logs -f kestra | grep -E "execution|analyze_logs|notify_dashboard|dispatch_agent|completion|SUCCESS|FAILED|triggered|Error"

