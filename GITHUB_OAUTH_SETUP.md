# MetaMorph AI - Setup Instructions

## Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** MetaMorph AI (or your preferred name)
   - **Homepage URL:** http://localhost:3001 (for development)
   - **Authorization callback URL:** http://localhost:3001/api/auth/github
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# GitHub OAuth (from Step 1)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Kestra (optional)
KESTRA_API_URL=http://localhost:8080
```

## Step 3: Install Dependencies & Run

```bash
npm install
npm run dev
```

Open http://localhost:3001

## Step 4: Using the Dashboard

1. Click "Connect GitHub" button
2. Authorize the OAuth app
3. Select a repository from your account
4. Click "SIMULATE FAILURE" to trigger the self-healing workflow
5. The workflow will:
   - Analyze code issues
   - Run Cline to fix them
   - Evaluate with Oumi
   - Create a PR
   - CodeRabbit will review it

That's it! 🎉
