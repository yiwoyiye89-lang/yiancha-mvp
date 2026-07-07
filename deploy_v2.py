import os
import json
import base64
import urllib.request
import ssl

# Netlify credentials
TOKEN = "nfp_SbefSZMc7pYGV737Q3cEJ1ZmXKyrxBvG21aa"
SITE_ID = "e97eae2d-1f84-4964-ba5f-5bcefd206311"

# Files to deploy
files = ['index.html', 'app.js']

# Read and encode files
deploy_files = {}
for fname in files:
    if os.path.exists(fname):
        with open(fname, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')
            deploy_files[fname] = content
            print(f"OK {fname} - {len(content)} bytes")

print(f"Total: {len(deploy_files)} files")

# Deploy to Netlify
if deploy_files:
    url = f"https://api.netlify.com/api/v1/sites/{SITE_ID}/deploys"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "files": deploy_files,
        "functions": {},
        "async": False
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    # Create SSL context
    ctx = ssl.create_default_context()
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("Deploy successful!")
            print(f"Deploy URL: {result.get('deploy_url', 'N/A')}")
            print(f"Live URL: https://yiancha.netlify.app")
    except Exception as e:
        print(f"Deploy failed: {e}")
