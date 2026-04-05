# HealthCare Pro - AI-Powered Healthcare Management System

A comprehensive healthcare application with AI-powered symptom checking, appointment management, electronic health records, and multi-channel notifications.

## Features

- **🔐 Authentication**: Google OAuth + Email/Password with Supabase Auth
- **👥 Role-Based Access Control**: 5 user roles (Patient, Doctor, Admin, Receptionist, Nurse)
- **🤖 AI Symptom Checker**: OpenAI-powered symptom analysis
- **📅 Smart Appointment System**: Real-time availability, booking, and reminders
- **📋 Electronic Health Records**: Secure storage and management of medical documents
- **🔔 Multi-Channel Notifications**: Email (Resend), SMS (Twilio), and in-app
- **📊 Health Analytics**: Dashboard with key metrics and insights
- **🔒 End-to-End Security**: Database RLS, encryption, audit logging

## Tech Stack

- **Frontend**: Next.js 15+, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-3.5
- **Notifications**: Resend (email), Twilio (SMS)
- **Deployment**: Vercel

## Project Structure

```
healthcare-app/
├── app/                          # Next.js frontend
│   ├── (auth)/                   # Auth pages
│   ├── (dashboard)/              # Role-based dashboards
│   ├── lib/                       # Utilities & contexts
│   ├── components/               # Reusable components
│   └── globals.css
├── fastapi/                      # FastAPI backend
│   ├── routes/                   # API endpoints
│   ├── services/                 # Business logic
│   ├── config.py
│   ├── auth.py
│   └── main.py
├── scripts/
│   ├── 01-init-schema.sql        # Database migration
│   └── seed-data.sql             # Test data
└── vercel.json                   # Vercel config
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account
- OpenAI API key

### 2. Clone & Install

```bash
git clone <repo>
cd health-care
npm install
pip install -r requirements.txt
```

### 3. Database Setup

1. Create a Supabase project
2. Run the migration script from `/scripts/01-init-schema.sql` in Supabase SQL Editor
3. Configure Google OAuth in Supabase Auth

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Optional but recommended:
- `RESEND_API_KEY` (for email notifications)
- `TWILIO_*` (for SMS notifications)

### 5. Run Development Servers

**Frontend (Next.js)**:
```bash
npm run dev
# Runs on http://localhost:3000
```

**Backend (FastAPI)**:
```bash
cd fastapi
python -m uvicorn main:app --reload
# Runs on http://localhost:8000
```

## User Roles & Permissions

### Patient
- View own appointments and health records
- Book appointments with doctors
- Use AI symptom checker
- Receive notifications

### Doctor
- View assigned patients
- Manage appointments
- Create health records
- Set availability
- Add medical notes

### Admin
- Full system access
- Manage users and roles
- View analytics
- System configuration

### Receptionist
- Book appointments
- Check-in patients
- Manage clinic schedule
- View patient information

### Nurse
- View patient records
- Assist with vitals
- Support care coordination
- Update health information

## API Endpoints

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/{id}` - Get user by ID

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/{id}` - Get appointment details
- `PUT /api/appointments/{id}` - Update appointment

### Health Records
- `GET /api/health-records/patient/{patient_id}` - Get patient records
- `POST /api/health-records` - Create record
- `GET /api/health-records/{id}` - Get record details

### Symptom Checker
- `POST /api/symptoms` - Analyze symptoms
- `GET /api/symptoms/history` - Get symptom history

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/{id}` - Mark as read

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel Settings
4. Deploy

```bash
vercel
```

The vercel.json file is already configured for FastAPI backend routing.

## Security Features

- ✅ Row-Level Security (RLS) on all tables
- ✅ JWT authentication
- ✅ HTTPS encryption
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting on API endpoints
- ✅ Audit logging for record access
- ✅ Sensitive field encryption

## Contributing

1. Create a feature branch
2. Make changes
3. Submit PR with description

## License

MIT

## Support

For issues and questions, open an issue on GitHub or contact support@healthcare.pro

---

**Built with ❤️ for better healthcare**
