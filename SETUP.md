# MetaMorph AI - Quick Setup Guide

## ✅ Completed
- [x] Project structure created
- [x] Next.js dashboard with cyberpunk UI
- [x] Kestra workflow with AI log analysis
- [x] GitHub Actions + Cline integration
- [x] Oumi evaluation script (tested: 50/100 on buggy code)
- [x] CodeRabbit configuration
- [x] Git repository initialized (23 files)

## 🔄 Current Step: Push to GitHub

Your local Git is configured with `Sainath9866` but the repo is owned by `sainathfyi`, causing a credential conflict.

**Solution - Run in terminal:**
```bash
cd /Users/sainath/projects/metamorph-ai
git push -u origin main
```

If prompted for credentials, use your `sainathfyi` account credentials.

## 📋 Next Steps After Push

### 1. Configure GitHub Repository Secrets
Go to: https://github.com/Sainath9866/metamorph-ai/settings/secrets/actions

Add these secrets:
- `OPENROUTER_API_KEY`: Your OpenRouter or Together AI key
  - Get from: https://openrouter.ai or https://together.ai

### 2. Deploy to Vercel (Stormbreaker Award)
```bash
npm i -g vercel
vercel
```

This will:
- Deploy the dashboard
- Give you a production URL
- Auto-link to your GitHub repo

**Important:** Copy the Vercel URL - you'll need it for Kestra webhooks.

### 3. Install CodeRabbit (Captain Code Award)
1. Go to https://coderabbit.ai
2. Install the app on `Sainath9866/metamorph-ai`
3. It will automatically use the `.coderabbit.yaml` config we created

### 4. Start Kestra (Wakanda Award)
```bash
cd kestra
docker-compose up -d
```

Then visit http://localhost:8080 and:
1. Go to **Flows** → **Create**
2. Paste contents of `kestra/flow.yaml`
3. Add secrets (Settings → Secrets):
   - `OPENAI_API_KEY`: Your OpenRouter/Together AI key
   - `GITHUB_PAT`: Generate at https://github.com/settings/tokens (select `repo` and `workflow` scopes)
   - `GITHUB_USERNAME`: `Sainath9866`
   - `VERCEL_URL`: Your Vercel deployment URL (from step 2)

### 5. Test the Demo! 🎉

Open your Vercel dashboard (or http://localhost:3001 for local dev) and click:

**"SIMULATE FAILURE"**

Watch the magic:
1. 🧠 Kestra analyzes the error with AI
2. ⚡ Triggers GitHub Actions
3. 🤖 Cline fixes the code autonomously
4. 🎯 Oumi evaluates quality (must score >= 80/100)
5. 📝 Creates pull request
6. 🛡️ CodeRabbit reviews the PR
7. 👁️ Dashboard streams everything live!

## 🧪 Testing Locally

### Test Oumi Evaluation
```bash
python3 scripts/oumi_eval.py src/vulnerable_code.js
# Should output: 50/100 (failing - has memory leaks)
```

### Test Dashboard UI
The dev server is already running at: http://localhost:3001

### Test API Endpoints
```bash
# Test webhook
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"status":"TEST","message":"Hello from Kestra"}'

# Test status
curl http://localhost:3001/api/status
```

## 🎬 Demo Script for Judges

**0:00 - Introduction**
"We built MetaMorph AI - a self-healing DevOps system targeting 5 awards worth $15k total."

**0:30 - Show the Architecture**
Point to the dashboard's architecture section showing all 5 technologies integrated.

**1:00 - Trigger the Demo**
Click "SIMULATE FAILURE" and narrate as it happens:
- "Kestra is analyzing the error with AI..." (Wakanda)
- "GitHub Actions running Cline CLI headlessly..." (Infinity)
- "Oumi evaluating code quality..." (Iron Intelligence)
- "Dashboard streaming everything live..." (Stormbreaker)

**1:45 - Show the PR**
Open the pull request and show CodeRabbit's review (Captain Code)

**2:00 - Conclusion**
"The system healed itself in 2 minutes. No human intervention needed."

## 🏆 Prize Justifications

Each component directly addresses specific prize criteria:

- **Wakanda ($4k)**: `kestra/flow.yaml` line 11-20 uses AI for log summarization
- **Infinity ($5k)**: `.github/workflows/agent-dispatch.yml` runs Cline CLI in CI/CD
- **Iron ($3k)**: `scripts/oumi_eval.py` performs sophisticated code evaluation
- **Stormbreaker ($2k)**: Real-time Vercel dashboard with webhooks and streaming
- **Captain Code ($1k)**: `.coderabbit.yaml` with strict review automation

---

**Current Status:** Ready for GitHub push! 🚀
