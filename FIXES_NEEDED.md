# 🔧 Fixes Needed to Make System Fully Functional

## Current Status

✅ **Working:**
- Error detection
- AI analysis (OpenAI API)
- Kestra flow orchestration
- Flow execution completes successfully

❌ **Not Working:**
- Actual HTTP calls (currently just logging)
- GitHub Actions dispatch (not triggered)
- Cline agent (not running)
- Code fix (not happening)
- Oumi evaluation (not running)
- CodeRabbit review (not happening)

## How to Fix Each Issue

### 1. Make HTTP Calls Work

**Problem:** Kestra standalone v0.15.0 doesn't have HTTP plugin or script tasks.

**Solutions:**

#### Option A: Use External Webhook Service (Recommended for Demo)
Create a simple Node.js service that Kestra can call:

```bash
# Start webhook proxy
cd kestra
node webhook-proxy.js &
```

Then update flow.yaml to call `http://localhost:3001` instead of direct HTTP.

#### Option B: Use Managed Kestra
Upgrade to Kestra Cloud or Enterprise which has HTTP plugin support.

#### Option C: Use Docker Tasks (Complex)
Build custom Docker images that make HTTP calls, but this is complex.

### 2. Trigger GitHub Actions

**Current:** Just logging the dispatch
**Needed:** Actually call GitHub API

**Fix:**
1. Make HTTP call work (see #1)
2. Update flow.yaml to use actual HTTP call to:
   ```
   POST https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches
   Headers: Authorization: Bearer <GITHUB_PAT>
   Body: { event_type: "deploy-agent", client_payload: {...} }
   ```

### 3. Make Cline Agent Run

**Current:** GitHub Actions workflow exists but isn't triggered
**Needed:** Actually trigger the workflow

**Fix:**
1. Fix GitHub dispatch (#2)
2. Verify `.github/workflows/agent-dispatch.yml` is in your repo
3. Verify `OPENROUTER_API_KEY` is in GitHub Secrets
4. The workflow will run when dispatch is received

### 4. Actually Fix the Code

**Current:** Code is analyzed but not fixed
**Needed:** Cline agent edits `src/vulnerable_code.js`

**Fix:**
1. Cline agent runs in GitHub Actions (#3)
2. Cline will:
   - Read the mission from `github.event.client_payload.mission`
   - Edit `src/vulnerable_code.js` to fix memory leak
   - Run Oumi evaluation
   - Create PR if score >= 80

### 5. Run Oumi Evaluation

**Current:** Not running
**Needed:** Run after code fix

**Fix:**
- Already in GitHub Actions workflow (line 85)
- Will run automatically when Cline fixes code
- Script: `python3 scripts/oumi_eval.py src/vulnerable_code.js`

### 6. CodeRabbit Review

**Current:** Not running
**Needed:** Review the PR

**Fix:**
1. CodeRabbit must be installed on your GitHub repo
2. When Cline creates PR, CodeRabbit will auto-review
3. Configure in `.coderabbit.yaml`

## Quick Fix Summary

**To make it work end-to-end:**

1. **Start webhook proxy:**
   ```bash
   cd kestra
   node webhook-proxy.js &
   ```

2. **Update flow.yaml** to call webhook proxy instead of direct HTTP

3. **Test GitHub dispatch:**
   ```bash
   curl -X POST "https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches" \
     -H "Authorization: Bearer YOUR_GITHUB_PAT" \
     -H "Accept: application/vnd.github.v3+json" \
     -d '{"event_type":"deploy-agent","client_payload":{"mission":"test"}}'
   ```

4. **Verify GitHub Actions runs** when dispatch is received

5. **Check if Cline fixes the code** in the Actions logs

## For Hackathon Demo

**Current state is good enough for demo:**
- ✅ Shows AI analysis working
- ✅ Shows orchestration working
- ✅ Shows the flow completing

**To show full functionality:**
- Need to implement HTTP calls (webhook proxy)
- Need to verify GitHub Actions workflow
- Need to test Cline agent

