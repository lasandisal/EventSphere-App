#!/usr/bin/env python3
"""
EventSphere Frontend Environment Config Generator
Reads public environment variables from .env, validates required fields,
and generates js/env.js for browser runtime consumption.
"""

import os
import shutil
import sys

# Explicit security whitelist: ONLY browser-safe public variables are permitted.
ALLOWED_PUBLIC_KEYS = {
    'API_BASE',
    'PAYHERE_GATEWAY_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_UPLOAD_PRESET'
}

REQUIRED_KEYS = {'API_BASE'}

def parse_env_file(filepath):
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                env_vars[key] = val
    return env_vars

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_file = os.path.join(root_dir, '.env')
    env_example_file = os.path.join(root_dir, '.env.example')
    output_js_file = os.path.join(root_dir, 'js', 'env.js')

    # Copy .env.example -> .env if .env is missing
    if not os.path.exists(env_file):
        if os.path.exists(env_example_file):
            print("Notice: .env not found. Creating .env from .env.example...")
            shutil.copy(env_example_file, env_file)
        else:
            print("Error: Neither .env nor .env.example was found.", file=sys.stderr)
            sys.exit(1)

    # Read environment variables
    env_vars = parse_env_file(env_file)
    
    # Also allow system environment variables to override .env if provided
    for key in ALLOWED_PUBLIC_KEYS | {'PORT'}:
        if key in os.environ and os.environ[key].strip():
            env_vars[key] = os.environ[key].strip()

    # Validate required keys
    for req_key in REQUIRED_KEYS:
        if not env_vars.get(req_key):
            print(f"Error: Missing required public configuration variable '{req_key}' in .env", file=sys.stderr)
            print("Please set API_BASE in .env (e.g. API_BASE=http://localhost:8080/api/v1)", file=sys.stderr)
            sys.exit(1)

    # Filter strictly by whitelist
    config_payload = {k: env_vars.get(k, '') for k in ALLOWED_PUBLIC_KEYS}

    # Generate js/env.js
    os.makedirs(os.path.dirname(output_js_file), exist_ok=True)
    with open(output_js_file, 'w', encoding='utf-8') as f:
        f.write("/* =========================================================\n")
        f.write("   EventSphere — Generated Runtime Environment Configuration\n")
        f.write("   GENERATED AUTOMATICALLY BY dev.sh — DO NOT EDIT MANUALLY!\n")
        f.write("   ========================================================= */\n\n")
        f.write("window.ES_CONFIG = {\n")
        f.write(f'  API_BASE: "{config_payload.get("API_BASE", "")}",\n')
        f.write(f'  PAYHERE_GATEWAY_URL: "{config_payload.get("PAYHERE_GATEWAY_URL", "")}",\n')
        f.write(f'  CLOUDINARY_CLOUD_NAME: "{config_payload.get("CLOUDINARY_CLOUD_NAME", "")}",\n')
        f.write(f'  CLOUDINARY_UPLOAD_PRESET: "{config_payload.get("CLOUDINARY_UPLOAD_PRESET", "")}"\n')
        f.write("};\n")

    print(f"Generated js/env.js successfully -> API_BASE: {config_payload['API_BASE']}")
    
    # Print server port for caller shell script
    port = env_vars.get('PORT', '8000')
    return port

if __name__ == '__main__':
    main()
