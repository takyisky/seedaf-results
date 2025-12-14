# Cycling Results Management System

A secure, tamper-proof system for displaying cycling race results. Admins can upload results via Excel files or link to Google Sheets, while the public can view official results that cannot be manipulated.

## Features

- **Public Results Viewing**: Clean, responsive interface for viewing race results
- **Admin Dashboard**: Password-protected admin area for managing results
- **Excel Upload**: Parse results directly from Excel files (.xlsx, .xls)
- **Google Sheets Integration**: Link to online Google Sheets for real-time updates
- **CRUD Operations**: Add, edit, and delete results with ease
- **Secure Storage**: Firebase Firestore for reliable, cloud-based storage
- **Tamper-Proof**: Users can only view results, not modify them

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Click "Add app" and select Web
4. Register your app and copy the configuration
5. Enable Firestore Database:
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Start in **test mode** for now (configure production rules later)
   - Choose your preferred location

### 3. Configure Environment Variables

Edit `.env.local` and replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Change this to a secure password for admin access
ADMIN_PASSWORD=your_secure_password_here
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public results page.

## Usage

### Admin Access

1. Click "Admin Login" on the main page or go to `/admin`
2. Enter the admin password (default: `cycling_admin_2024` - **change this!**)
3. You'll see the admin dashboard

### Adding Results (Excel Upload)

1. Click "Add Result"
2. Enter the race title/name
3. Select "Excel Upload"
4. Upload your Excel file

**Excel Format:**
- First row = Headers (e.g., Position, Name, Time, Team, Category)
- Subsequent rows = Data
- Supported header names:
  - Position: `Position`, `Pos`, `#`
  - Name: `Name`, `Rider`, `Athlete`
  - Time: `Time`, `Finish Time`
  - Team: `Team`
  - Category: `Category`, `Cat`
  - Any other columns will be stored as additional data

Example:
```
Position | Name          | Time     | Team
1        | John Smith    | 1:23:45  | Team A
2        | Jane Doe      | 1:24:12  | Team B
3        | Bob Johnson   | 1:25:30  | Team C
```

### Adding Results (Google Sheets)

1. Click "Add Result"
2. Enter the race title/name
3. Select "Google Sheets Link"
4. Paste your Google Sheets URL
5. Click "Fetch"

**Important:** The Google Sheet must be published to the web:
1. Open your Google Sheet
2. Go to File → Share → Publish to web
3. Click "Publish"
4. Copy the URL and paste it in the admin panel

### Editing Results

1. Click "Edit" next to any result
2. Modify the title or upload new data
3. Click "Update Result"

### Deleting Results

1. Click "Delete" next to any result
2. Confirm the deletion

## Production Security

Before deploying to production, configure Firebase Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cycling_results/{document} {
      // Anyone can read
      allow read: if true;

      // No one can write directly from client
      // All writes must go through API routes
      allow write: if false;
    }
  }
}
```

**Additional Security Measures:**

1. Change the default admin password in `.env.local`
2. Use a strong, unique password
3. Consider adding rate limiting to API routes
4. Enable Firebase App Check for additional security
5. Set up Firebase monitoring and alerts

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── results/        # CRUD operations for results
│   │   └── sheets/         # Google Sheets fetching
│   ├── admin/
│   │   └── page.tsx        # Admin dashboard
│   ├── layout.tsx          # Root layout with Toaster
│   └── page.tsx            # Public results page
├── lib/
│   ├── auth.ts             # Authentication utilities
│   ├── excel-parser.ts     # Excel/Google Sheets parsing
│   ├── firebase.ts         # Firebase initialization
│   └── firestore.ts        # Firestore operations
├── types/
│   └── index.ts            # TypeScript interfaces
└── .env.local              # Environment configuration
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase Firestore** - Cloud database
- **xlsx** - Excel file parsing
- **react-hot-toast** - Toast notifications

## Deployment

Deploy to Vercel (recommended):

```bash
pnpm run build
```

Then deploy via Vercel CLI or connect your GitHub repository to Vercel.

Make sure to:
1. Add all environment variables in Vercel dashboard
2. Update Firebase security rules for production
3. Change the admin password
4. Enable production mode in Firebase Console

## License

MIT
