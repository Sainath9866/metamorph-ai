from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import shutil
import os
import zipfile
import requests
import json
import base64
from typing import Optional
import time

app = FastAPI(title="MetaMorph AI Healing Service")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://metamorph-ai-three.vercel.app", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealRequest(BaseModel):
    repository: str
    mission: str
    github_token: Optional[str] = None

@app.get("/")
def root():
    return {"status": "MetaMorph AI Healing Service Running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/heal")
async def heal_repository(request: HealRequest):
    """
    Downloads repository, runs Cline to fix issues, creates PR
    """
    temp_dir = None
    zip_path = None
    
    try:
        # Get environment variable
        api_key = os.getenv("METAMORPH_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="METAMORPH_API_KEY not configured")
        
        if not request.github_token:
            raise HTTPException(status_code=401, detail="GitHub token required")
        
        owner, repo = request.repository.split('/')
        
        # Download repository as ZIP
        headers = {
            "Authorization": f"Bearer {request.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        zip_url = f"https://api.github.com/repos/{request.repository}/zipball/main"
        zip_response = requests.get(zip_url, headers=headers, stream=True)
        
        if zip_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to download repository: {zip_response.status_code}")
        
        # Save and extract ZIP
        temp_dir = tempfile.mkdtemp(prefix="metamorph_")
        zip_path = os.path.join(temp_dir, "repo.zip")
        
        with open(zip_path, 'wb') as f:
            for chunk in zip_response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Extract
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Find extracted folder
        extracted_folders = [d for d in os.listdir(temp_dir) if os.path.isdir(os.path.join(temp_dir, d))]
        if not extracted_folders:
            raise HTTPException(status_code=500, detail="No folder found in ZIP")
        
        repo_dir = os.path.join(temp_dir, extracted_folders[0])
        
        # Store original files for comparison
        original_files = {}
        for root, dirs, files in os.walk(repo_dir):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if not file.startswith('.'):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, repo_dir)
                    try:
                        with open(file_path, 'r') as f:
                            original_files[rel_path] = f.read()
                    except:
                        pass  # Skip binary files
        
        # Run Cline
        env = os.environ.copy()
        env["OPENAI_API_KEY"] = api_key
        
        # Use correct Cline flags: --oneshot for autonomous mode, --yolo for non-interactive
        cline_cmd = f'npx -y cline@latest "{request.mission}" --oneshot --yolo'
        
        result = subprocess.run(
            cline_cmd,
            shell=True,
            cwd=repo_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes
        )
        
        print(f"Cline stdout: {result.stdout}")
        print(f"Cline stderr: {result.stderr}")
        
        # Detect changed files
        changed_files = {}
        for root, dirs, files in os.walk(repo_dir):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if not file.startswith('.'):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, repo_dir)
                    try:
                        with open(file_path, 'r') as f:
                            new_content = f.read()
                        
                        # Check if file was changed
                        if rel_path in original_files:
                            if original_files[rel_path] != new_content:
                                changed_files[rel_path] = new_content
                        else:
                            # New file
                            changed_files[rel_path] = new_content
                    except:
                        pass
        
        if not changed_files:
            return {
                "success": True,
                "message": "No changes needed",
                "changes_made": False,
                "output": result.stdout
            }
        
        # Create PR via GitHub API
        branch_name = f"metamorph-fixes-{int(time.time() * 1000)}"
        
        # Get default branch SHA
        ref_response = requests.get(
            f"https://api.github.com/repos/{request.repository}/git/refs/heads/main",
            headers=headers
        )
        ref_data = ref_response.json()
        base_sha = ref_data['object']['sha']
        
        # Create new branch
        create_branch_response = requests.post(
            f"https://api.github.com/repos/{request.repository}/git/refs",
            headers=headers,
            json={
                "ref": f"refs/heads/{branch_name}",
                "sha": base_sha
            }
        )
        
        if create_branch_response.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail=f"Failed to create branch: {create_branch_response.text}")
        
        # Upload changed files to the new branch
        for file_path, content in changed_files.items():
            encoded_content = base64.b64encode(content.encode()).decode()
            
            # Check if file exists to get its SHA
            file_sha = None
            get_file_response = requests.get(
                f"https://api.github.com/repos/{request.repository}/contents/{file_path}",
                headers=headers,
                params={"ref": "main"}
            )
            if get_file_response.status_code == 200:
                file_sha = get_file_response.json().get('sha')
            
            # Create or update file
            update_data = {
                "message": f"fix: Auto-heal {file_path} via MetaMorph AI",
                "content": encoded_content,
                "branch": branch_name
            }
            if file_sha:
                update_data["sha"] = file_sha
            
            update_response = requests.put(
                f"https://api.github.com/repos/{request.repository}/contents/{file_path}",
                headers=headers,
                json=update_data
            )
            
            if update_response.status_code not in [200, 201]:
                print(f"Failed to update {file_path}: {update_response.text}")
        
        # Create PR
        pr_body = f"""## 🤖 Autonomous Code Healing

This PR was automatically generated by MetaMorph AI.

**Mission:** {request.mission}

### Files Changed:
{chr(10).join([f'- `{f}`' for f in changed_files.keys()])}

### Cline Output:
```
{result.stdout[:500]}
```

Powered by MetaMorph AI 🛡️"""
        
        pr_response = requests.post(
            f"https://api.github.com/repos/{request.repository}/pulls",
            headers=headers,
            json={
                "title": "🤖 MetaMorph AI: Automated Code Fixes",
                "body": pr_body,
                "head": branch_name,
                "base": "main"
            }
        )
        
        if pr_response.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail=f"Failed to create PR: {pr_response.text}")
        
        pr_data = pr_response.json()
        
        return {
            "success": True,
            "message": "Healing complete, PR created",
            "changes_made": True,
            "pr_url": pr_data['html_url'],
            "pr_number": pr_data['number'],
            "files_changed": list(changed_files.keys()),
            "output": result.stdout
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Cline execution timed out")
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
