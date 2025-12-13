#!/bin/bash
# Script to make HTTP calls that Kestra can't make directly
# This can be called from Kestra or run manually

ACTION=$1
MESSAGE=$2
ERROR=$3
TIMESTAMP=$4
GITHUB_PAT=$5

case $ACTION in
  vercel)
    echo "📡 Sending webhook to Vercel..."
    curl -X POST "https://metamorph-ai-three.vercel.app/api/webhooks" \
      -H "Content-Type: application/json" \
      -d "{\"status\":\"ANALYZING\",\"message\":\"$MESSAGE\",\"type\":\"warning\",\"timestamp\":\"$TIMESTAMP\"}"
    ;;
  github)
    echo "🤖 Triggering GitHub Actions..."
    curl -X POST "https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches" \
      -H "Authorization: Bearer $GITHUB_PAT" \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Content-Type: application/json" \
      -d "{\"event_type\":\"deploy-agent\",\"client_payload\":{\"mission\":\"$MESSAGE\",\"original_error\":\"$ERROR\",\"timestamp\":\"$TIMESTAMP\"}}"
    ;;
  *)
    echo "Usage: $0 {vercel|github} <message> [error] [timestamp] [github_pat]"
    exit 1
    ;;
esac

