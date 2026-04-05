# Quick Start Guide - HealthCare Pro

## What's Been Built

A production-ready healthcare management system with:

### Features Implemented
- ✅ Google OAuth + Email/Password authentication
- ✅ 5 role-based dashboards (Patient, Doctor, Admin, Receptionist, Nurse)
- ✅ AI Symptom Checker (OpenAI powered)
- ✅ Appointment booking and management
- ✅ Electronic health records system
- ✅ Multi-channel notifications (Email, SMS, In-app)
- ✅ Patient profile management
- ✅ Role-based access control with database RLS

### Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth with Google OAuth
- AI: OpenAI GPT-3.5 for symptom analysis

---

## Step-by-Step Setup

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to your project's SQL Editor
3. Copy the entire content from `/scripts/01-init-schema.sql`
4. Paste it into the SQL Editor and execute
5. Go to Authentication → Providers → Google and enable Google OAuth
   - Add your OAuth credentials (get from Google Cloud Console)

### 2. Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the required variables:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

**Optional (for notifications):**
```
RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

### 4. Run Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
# Opens at http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd fastapi
python -m uvicorn main:app --reload
# Runs at http://localhost:8000
```

---

## Testing the App

### Test Accounts

After setup, you can:
1. **Sign up** with Google OAuth at the sign-in page
2. Or sign up with email/password and the system will auto-create your account as a patient

### Default Test Flow

1. **Patient**: Sign in → Book appointment → Use symptom checker → View health records
2. **Doctor**: Sign in → View appointments → View patients → Create health records
3. **Admin**: Sign in → View all users → See system analytics

---

## API Documentation

All FastAPI endpoints are documented at: `http://localhost:8000/docs`

### Key Endpoints

**Appointments:**
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - List your appointments
- `PUT /api/appointments/{id}` - Update appointment

**Health Records:**
- `POST /api/health-records` - Create record
- `GET /api/health-records/patient/{id}` - Get patient records

**Symptom Checker:**
- `POST /api/symptoms` - Analyze symptoms
- `GET /api/symptoms/history` - Get check history

**Users:**
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile

See `/scripts/01-init-schema.sql` for database structure.

---

## Project Structure

```
healthcare-app/
├── app/
│   ├── (auth)/              # Sign in/up pages
│   ├── (dashboard)/         # Role-based dashboards
│   ├── lib/                 # Auth & utilities
│   └── components/
├── fastapi/
│   ├── routes/              # API endpoints
│   ├── auth.py              # Token verification
│   ├── config.py            # Settings
│   └── main.py
├── scripts/
│   └── 01-init-schema.sql   # Database schema
├── package.json
├── requirements.txt
├── vercel.json
└── README.md
```

---

## Deployment to Vercel

1. Push to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
vercel
```

The app will be live at your Vercel URL.

---

## What Each Role Can Do

### Patient
- View appointments
- Book appointments with doctors
- Use AI symptom checker
- Manage health records
- Update profile information
- Receive notifications

### Doctor
- View assigned patients
- Manage appointments
- Create health records
- Set availability
- Write medical notes

### Admin
- Manage all users
- View system analytics
- Manage clinics
- System configuration

### Receptionist
- Book appointments for patients
- Check-in patients
- Manage clinic schedule

### Nurse
- View patient records
- Assist with vitals
- Help with documentation

---

## Troubleshooting

### "Token verification failed"
- Check SUPABASE_SERVICE_KEY is set in FastAPI
- Verify Supabase is running and accessible

### "Google OAuth not working"
- Add Google OAuth credentials to Supabase Auth
- Verify redirect URI in Google Cloud Console

### "AI Symptom Checker not working"
- Check OPENAI_API_KEY is valid
- Verify API account has sufficient credits

### "Database tables not found"
- Run the SQL migration from `/scripts/01-init-schema.sql`
- Check Supabase connection

---

## Next Steps

1. **Test the app** with the flows above
2. **Customize** the branding and colors
3. **Add more features** like ratings, prescriptions, lab reports
4. **Set up notifications** by configuring Resend and Twilio
5. **Deploy to production** on Vercel

---

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- OpenAI Docs: https://platform.openai.com/docs

---

**Your healthcare app is ready to go! 🚀**
