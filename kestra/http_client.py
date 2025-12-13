#!/usr/bin/env python3
"""
Simple HTTP client for Kestra to make webhook calls
"""
import sys
import json
import os
import urllib.request
import urllib.parse

def send_webhook(url, data, headers=None):
    """Send HTTP POST request"""
    if headers is None:
        headers = {'Content-Type': 'application/json'}
    
    # Convert data to JSON string
    json_data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=json_data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            print(f"✅ Success: {result}")
            return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Get arguments from environment or command line
    action = sys.argv[1] if len(sys.argv) > 1 else os.getenv('ACTION', 'vercel')
    
    if action == 'vercel':
        url = os.getenv('VERCEL_URL', 'https://metamorph-ai-three.vercel.app/api/webhooks')
        message = os.getenv('MESSAGE', '')
        data = {
            'status': 'ANALYZING',
            'message': message,
            'type': 'warning',
            'timestamp': os.getenv('TIMESTAMP', '')
        }
        send_webhook(url, data)
    
    elif action == 'github':
        url = os.getenv('GITHUB_URL', 'https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches')
        token = os.getenv('GITHUB_PAT', '')
        mission = os.getenv('MISSION', '')
        error = os.getenv('ERROR', '')
        timestamp = os.getenv('TIMESTAMP', '')
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        
        data = {
            'event_type': 'deploy-agent',
            'client_payload': {
                'mission': mission,
                'original_error': error,
                'timestamp': timestamp
            }
        }
        send_webhook(url, data, headers)

