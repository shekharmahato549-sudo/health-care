#!/usr/bin/env python3
import subprocess
import os

os.chdir('/vercel/share/v0-project')

# Configure git
subprocess.run(['git', 'config', 'user.email', 'v0[bot]@users.noreply.github.com'], check=True)
subprocess.run(['git', 'config', 'user.name', 'v0[bot]'], check=True)

# Add all files
subprocess.run(['git', 'add', '.'], check=True)
print("[v0] Added all files to git")

# Commit
commit_message = """Build complete healthcare app with FastAPI backend, Supabase auth, and role-based access

- Supabase database schema with 8 tables and RLS policies
- Next.js 15 frontend with Google OAuth integration
- FastAPI backend with symptom checker, appointments, health records
- Role-based dashboards for patients, doctors, admin, receptionists, nurses
- AI-powered symptom analysis with OpenAI
- Multi-channel notifications (Email/SMS/In-app)
- Comprehensive security with HTTPS, JWT, and encrypted data

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"""

subprocess.run(['git', 'commit', '-m', commit_message], check=True)
print("[v0] Committed changes")

# Push
result = subprocess.run(['git', 'push', 'origin', 'HEAD'], capture_output=True, text=True)
print("[v0] Pushing to GitHub...")
print(result.stdout)
if result.returncode == 0:
    print("[v0] ✓ Successfully pushed to GitHub")
else:
    print(f"[v0] Error: {result.stderr}")
