# Donation App Frontend

This is the React frontend for the donation app with integrated authentication system.

## Features

- **Invite-based Registration**: Users register using invite codes with role and tower assignments
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for admin and collector roles
- **Tower Assignment**: Users can only access apartments in their assigned towers
- **Theme Support**: Light, Dark, and Ambient (Glassmorphic) themes
- **Responsive Design**: Mobile-friendly with carousel navigation
- **Real-time Updates**: Live donation statistics and progress tracking

## Authentication Flow

1. **Admin creates invite** with specific role and tower assignments
2. **User receives invite** via email or direct link
3. **User registers** using invite code with optional system-generated password
4. **User logs in** with email/password or Google OAuth
5. **Dashboard shows** only assigned towers based on user role

## Default Users

### Admin User
- **Email**: `admin@donationapp.com`
- **Password**: `admin123`
- **Role**: Admin (access to all towers)

### Sample Collector Invite
- **Email**: `collector@example.com`
- **Invite Code**: `COLL1234`
- **System Password**: `collector123`
- **Role**: Collector
- **Assigned Towers**: 1, 2, 3

## Environment Configuration

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# Google OAuth Configuration (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm run test
   ```

## API Integration

The frontend uses the authentication service (`src/services/auth.ts`) to communicate with the backend API:

- **Login**: `POST /api/v1/auth/login`
- **Register**: `POST /api/v1/auth/register`
- **Google Auth**: `POST /api/v1/auth/google-auth`
- **Profile**: `GET /api/v1/auth/profile`
- **Invite Details**: `GET /api/v1/auth/invites/{code}`

## Role-based Features

### Admin Role
- Access to all towers (1-10)
- Can create invites for new users
- Can view all users and invites
- Full dashboard access

### Collector Role
- Access only to assigned towers
- Can record donations in assigned towers
- Can mark apartments for follow-up or skip
- Limited dashboard access

## Testing

The test suite includes:
- Authentication tests (login, registration, invite validation)
- Dashboard tests (role-based access, tower assignments)
- Donation form tests (submission, follow-up, skip)
- E2E workflow tests
- Mobile responsive tests

All tests use the new authentication system and remove hardcoded test users.

## Security

- JWT tokens stored in localStorage
- Automatic token validation on app startup
- Role-based access control at component level
- Tower access validation for apartment operations
- Secure password handling (no plain text storage)
