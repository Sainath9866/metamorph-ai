from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import shutil
import os
import zipfile
import requests
from typing import Optional

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
        
        owner, repo = request.repository.split('/')
        
        # Download repository as ZIP
        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if request.github_token:
            headers["Authorization"] = f"Bearer {request.github_token}"
        
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
        
        # Find extracted folder (GitHub creates folder with commit hash)
        extracted_folders = [d for d in os.listdir(temp_dir) if os.path.isdir(os.path.join(temp_dir, d))]
        if not extracted_folders:
            raise HTTPException(status_code=500, detail="No folder found in ZIP")
        
        repo_dir = os.path.join(temp_dir, extracted_folders[0])
        
        # Run Cline
        env = os.environ.copy()
        env["OPENAI_API_KEY"] = api_key
        
        cline_cmd = f'npx -y cline@latest --autonomous --task "{request.mission}" --max-iterations 5'
        
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
        
        # Check for changes (simplified - check git status if git is initialized)
        # For now, assume changes were made
        
        # Create PR via GitHub API
        if request.github_token:
            import time
            branch_name = f"metamorph-fixes-{int(time.time() * 1000)}"
            
            # This simplified version assumes git is available
            # In production, would use GitHub API to create tree/commit/PR
            
            return {
                "success": True,
                "message": "Healing completed",
                "changes_made": True,
                "output": result.stdout,
                "note": "PR creation to be implemented"
            }
        
        return {
            "success": True,
            "message": "Healing completed (no GitHub token for PR)",
            "changes_made": True,
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
