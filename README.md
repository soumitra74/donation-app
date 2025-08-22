# Donation App - SSR DP 2025

A comprehensive donation management application with user authentication, block assignments, and donation tracking.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Flask + SQLAlchemy + PostgreSQL
- **Database**: PostgreSQL (ssr_dp_2025)
- **Authentication**: JWT + bcrypt
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start with Docker

### Prerequisites

- Docker
- Docker Compose

### 1. Clone and Setup

```bash
git clone <repository-url>
cd donation-app
```

### 2. Start the Application

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## 📊 Database Setup

The application automatically:

1. **Creates PostgreSQL database**: `ssr_dp_2025`
2. **Initializes tables**: users, user_roles, invites, donors, campaigns, donations
3. **Adds all users** with their assigned blocks
4. **Runs verification** to ensure everything is working

## 👥 Pre-configured Users

All users have the password: `Welcome@123`

| User | Email | Assigned Blocks | Role |
|------|-------|----------------|------|
| System Administrator | admin@donationapp.com | All blocks (A-J) | admin |
| Surojeet | surojeets@yahoo.com | E, F | collector |
| Abhijit Banerjee | abhijit.banerjee5@gmail.com | G, H | collector |
| Pramit Band | bandpramit@gmail.com | A, B, J | collector |
| Abhijit Ray Chaudhury | abhijit.ray.chaudhury@gmail.com | G, H | collector |
| Indranil CSE | indranil.cse@gmail.com | H | collector |
| Paul Sanjib | paulsanjib@hotmail.com | C, D | collector |
| Subhra Roy | subhra.roy@gmail.com | A, B | collector |
| Sibnath Ghosh | sibnath_ghosh@yahoo.com | A, J | collector |
| Sumanta Mallick | sumantamallick.ssr@gmail.com | D, E, F, G | collector |
| Deep MCA | deep.mca84@gmail.com | A, B | collector |

## 🔧 Docker Services

### Database (PostgreSQL)
- **Container**: `ssr_dp_2025_db`
- **Database**: `ssr_dp_2025`
- **Port**: 5432
- **Credentials**: 
  - User: `donation_user`
  - Password: `donation_password`

### Backend (Flask API)
- **Container**: `ssr_dp_2025_backend`
- **Port**: 5000
- **Features**:
  - Automatic database initialization
  - User creation and verification
  - API endpoints for authentication and donations

### Frontend (React)
- **Container**: `ssr_dp_2025_frontend`
- **Port**: 3000
- **Features**:
  - Modern React interface
  - Block-based donation tracking
  - User authentication

## 🔍 Verification Process

The setup includes comprehensive verification:

1. **Database Tables**: Ensures all required tables exist
2. **User Creation**: Verifies all users are created with correct roles
3. **Password Verification**: Tests login functionality
4. **API Endpoints**: Validates API health and login endpoints
5. **User Summary**: Generates detailed user and block assignment report

## 🛠️ Development

### Running Locally (without Docker)

#### Backend
```bash
cd backend
pip install -r requirements.txt
python init_db.py
python add_multiple_users.py
python run.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Management

#### Connect to Database
```bash
# Using Docker
docker exec -it ssr_dp_2025_db psql -U donation_user -d ssr_dp_2025

# Using local PostgreSQL client
psql -h localhost -U donation_user -d ssr_dp_2025
```

#### View Database
```bash
# Run verification script
docker exec -it ssr_dp_2025_backend python verify_setup.py

# Or run individual scripts
docker exec -it ssr_dp_2025_backend python user_summary.py
docker exec -it ssr_dp_2025_backend python debug_user_login.py
```

## 📁 Project Structure

```
donation-app/
├── docker-compose.yml          # Docker orchestration
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── app.py                 # Flask application
│   ├── models.py              # Database models
│   ├── auth.py                # Authentication service
│   ├── auth_routes.py         # Auth endpoints
│   ├── routes.py              # API endpoints
│   ├── init_db.py             # Database initialization
│   ├── add_multiple_users.py  # User creation
│   ├── verify_setup.py        # Comprehensive verification
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── Dockerfile             # Frontend container
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   └── App.tsx           # Main application
│   └── package.json          # Node dependencies
└── README.md                 # This file
```

## 🔐 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and collector roles
- **Block Assignment**: Users can only access assigned blocks
- **CORS Protection**: Configured for secure cross-origin requests

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 5000, and 5432 are available
2. **Database Connection**: Check if PostgreSQL container is running
3. **Build Failures**: Clear Docker cache with `docker system prune`

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

## 📝 API Endpoints

- `GET /health` - Health check
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/donations` - Get donations
- `POST /api/v1/donations` - Create donation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker setup
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
