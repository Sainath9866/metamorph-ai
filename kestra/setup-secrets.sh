#!/bin/bash

# Script to set up secrets for Kestra standalone mode
# This will encode your secrets and update docker-compose.yml

echo "🔐 Setting up Kestra Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -sp "Enter your OPENROUTER_API_KEY (OpenAI API key): " OPENROUTER_API_KEY
echo ""
OPENROUTER_ENCODED=$(echo -n "$OPENROUTER_API_KEY" | base64)

echo ""
read -sp "Enter your GITHUB_PAT (GitHub Personal Access Token): " GITHUB_PAT
echo ""
GITHUB_PAT_ENCODED=$(echo -n "$GITHUB_PAT" | base64)

echo ""
echo "✅ Secrets encoded!"
echo ""
echo "Updating docker-compose.yml..."

# Create a temporary file with updated environment section
cat > /tmp/kestra-env-update.yml << EOF
      # Secrets for Kestra standalone mode (base64-encoded)
      SECRET_OPENROUTER_API_KEY: $OPENROUTER_ENCODED
      SECRET_GITHUB_PAT: $GITHUB_PAT_ENCODED
EOF

# Use sed to replace the placeholder in docker-compose.yml
if grep -q "SECRET_OPENROUTER_API_KEY: \${SECRET_OPENROUTER_API_KEY:-}" docker-compose.yml; then
    # Replace the placeholder lines
    sed -i.bak "/SECRET_OPENROUTER_API_KEY: \${SECRET_OPENROUTER_API_KEY:-}/d" docker-compose.yml
    sed -i.bak "/SECRET_GITHUB_PAT: \${SECRET_GITHUB_PAT:-}/d" docker-compose.yml
    # Insert the actual values before the closing of environment section
    sed -i.bak "/tmp-dir:/r /tmp/kestra-env-update.yml" docker-compose.yml
    rm docker-compose.yml.bak 2>/dev/null
    echo "✅ docker-compose.yml updated!"
else
    echo "⚠️  Could not find placeholder in docker-compose.yml"
    echo "   Please manually add these to docker-compose.yml environment section:"
    echo ""
    cat /tmp/kestra-env-update.yml
fi

rm /tmp/kestra-env-update.yml

echo ""
echo "🔄 Restarting Kestra to apply secrets..."
docker-compose down
docker-compose up -d

echo ""
echo "✅ Done! Secrets are now configured."
echo ""
echo "Test your flow by running: ./test-flow.sh"

