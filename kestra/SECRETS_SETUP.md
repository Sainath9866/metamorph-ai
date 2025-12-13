# Setting Up Secrets for Kestra Standalone

Kestra standalone mode requires secrets as **base64-encoded environment variables** with the `SECRET_` prefix.

## Quick Setup

Run the setup script:

```bash
cd kestra
./setup-secrets.sh
```

This will:
1. Prompt you for your API keys
2. Base64 encode them
3. Update docker-compose.yml
4. Restart Kestra

## Manual Setup

If you prefer to do it manually:

### 1. Encode your secrets:

```bash
# Encode OpenAI API key
echo -n "your-openai-api-key-here" | base64

# Encode GitHub PAT
echo -n "your-github-pat-here" | base64
```

### 2. Create `.env` file in the `kestra/` directory:

```bash
cd kestra
cat > .env << EOF
SECRET_OPENROUTER_API_KEY=<paste-base64-encoded-openai-key>
SECRET_GITHUB_PAT=<paste-base64-encoded-github-pat>
EOF
```

### 3. Restart Kestra:

```bash
docker-compose down
docker-compose up -d
```

## Verify Secrets

Test your flow:
```bash
./test-flow.sh
```

Or check in Kestra UI: http://localhost:8080

