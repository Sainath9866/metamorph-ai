# MetaMorph AI Healing Service

FastAPI backend for running Cline autonomous code healing.

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Set root directory to `healing-service`
5. Add environment variable:
   - `METAMORPH_API_KEY` = your OpenAI API key
6. Deploy!

## API Endpoints

- `GET /` - Service status
- `GET /health` - Health check
- `POST /heal` - Trigger healing
  ```json
  {
    "repository": "owner/repo",
    "mission": "Fix memory leak in src/file.js",
    "github_token": "ghp_..."
  }
  ```

## Environment Variables

- `METAMORPH_API_KEY` - OpenAI API key (required)
- `PORT` - Server port (Railway sets automatically)
