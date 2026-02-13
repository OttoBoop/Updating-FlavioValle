"""
Duplicate flaviovalle.com via the Wix REST API.

Usage:
  python scripts/wix_duplicate_api.py

Requires WIX_API_KEY environment variable (account-level API key).
Get one at: https://manage.wix.com/account/api-keys
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load .env from general_scraper (shares the same workspace root)
env_path = os.path.join(os.path.dirname(__file__), "..", "..", "general_scraper", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded .env from: {os.path.abspath(env_path)}")
else:
    # Fallback: try workspace root
    alt = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(alt):
        load_dotenv(alt)
        print(f"Loaded .env from: {os.path.abspath(alt)}")

SITE_ID = "3d861f70-c919-4aa5-8420-e7643606ce2b"
NEW_SITE_NAME = "flaviovalle-dev"
API_BASE = "https://www.wixapis.com"

def get_api_key():
    key = os.environ.get("WIX_API_KEY")
    if not key:
        print("=" * 60)
        print("WIX_API_KEY not found in environment.")
        print()
        print("To create one:")
        print("  1. Go to: https://manage.wix.com/account/api-keys")
        print("  2. Click 'Generate API Key'")
        print("  3. Name: 'Site Duplication'")
        print("  4. Permissions: select 'Manage Sites' (account-level)")
        print("  5. Copy the key")
        print()
        key = input("Paste your API key here: ").strip()
        if not key:
            print("No key provided. Exiting.")
            sys.exit(1)
    return key


def duplicate_site(api_key: str):
    """Call the Wix Duplicate Site API."""
    url = f"{API_BASE}/site-management/v1/sites/{SITE_ID}/duplicate"
    
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    
    payload = {
        "newSiteName": NEW_SITE_NAME,
    }
    
    print(f"Duplicating site {SITE_ID} as '{NEW_SITE_NAME}'...")
    print(f"POST {url}")
    print()
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        sys.exit(1)
    
    print(f"Status: {response.status_code}")
    print()
    
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(f"Response body: {response.text[:500]}")
    
    if response.status_code == 200:
        print()
        print("=" * 60)
        print("SUCCESS! Site duplicated.")
        if "site" in data:
            new_id = data["site"].get("id", "unknown")
            print(f"New site ID: {new_id}")
            print(f"Editor URL: https://editor.wix.com/html/editor/web/renderer/edit/{new_id}")
        print("=" * 60)
    elif response.status_code == 401:
        print()
        print("ERROR: Unauthorized. Check your API key.")
        print("Make sure it's an ACCOUNT-level key with 'Manage Sites' permission.")
    elif response.status_code == 403:
        print()
        print("ERROR: Forbidden. The API key lacks the required permissions.")
        print("Required: 'Manage Sites' scope at the account level.")
    elif response.status_code == 404:
        print()
        print("ERROR: Site not found. Verify the site ID is correct.")
    else:
        print()
        print(f"ERROR: Unexpected status {response.status_code}")
        print("The API may not support duplicating classic editor sites,")
        print("or the site may have restrictions preventing duplication.")


def list_sites(api_key: str):
    """List all sites to verify API key works and find the right site."""
    url = f"{API_BASE}/site-management/v1/sites"
    
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    
    print("Listing account sites to verify API access...")
    print(f"GET {url}")
    print()
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        sites = data.get("sites", [])
        print(f"Found {len(sites)} site(s):")
        for s in sites:
            name = s.get("displayName", "?")
            sid = s.get("id", "?")
            state = s.get("state", "?")
            print(f"  - {name} (id={sid}, state={state})")
        print()
        return True
    else:
        print(f"Failed to list sites: {response.text[:300]}")
        return False


if __name__ == "__main__":
    api_key = get_api_key()
    
    print()
    print("=" * 60)
    print("Step 1: Verify API access by listing sites")
    print("=" * 60)
    print()
    
    if list_sites(api_key):
        print()
        print("=" * 60)
        print("Step 2: Duplicate the site")
        print("=" * 60)
        print()
        duplicate_site(api_key)
    else:
        print("Could not verify API access. Fix the API key and try again.")
