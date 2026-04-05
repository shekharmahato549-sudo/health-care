#!/bin/bash

cd /vercel/share/v0-project

# Configure git
git config user.email "v0[bot]@users.noreply.github.com"
git config user.name "v0[bot]"

# Add all files
git add .

# Commit with message
git commit -m "Build complete healthcare app with FastAPI backend, Supabase auth, and role-based access

- Supabase database schema with 8 tables and RLS policies
- Next.js 15 frontend with Google OAuth integration
- FastAPI backend with symptom checker, appointments, health records
- Role-based dashboards for patients, doctors, admin, receptionists, nurses
- AI-powered symptom analysis with OpenAI
- Multi-channel notifications (Email/SMS/In-app)
- Comprehensive security with HTTPS, JWT, and encrypted data" \
  -m "Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

# Push to current branch
git push origin HEAD

echo "✓ Successfully pushed to GitHub"
