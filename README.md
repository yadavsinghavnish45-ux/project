# Face Detection Voting System

A web-based voting system with facial recognition and liveness detection.

## Features

- **Voter Registration**: Name, username, email, password, profile photo with face detection
- **Email Verification**: OTP-based email verification
- **Secure Login**: JWT authentication with bcrypt password hashing
- **Face Verification**: Camera-based face matching with profile photo
- **Liveness Detection**: Random challenges (blink, turn head, nod, smile)
- **One Vote Per Voter**: Database-enforced uniqueness
- **Admin Portal**: Separate login for party management

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt
- **Face Detection**: Browser-based face-api.js (TensorFlow.js)
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker (Recommended)

```bash
# Clone and navigate
cd face-voting-system

# Start all services
docker compose up -d

# Run database migrations
docker compose exec server npx prisma migrate deploy

# Seed admin user
docker compose exec server npm run seed:admin

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Admin login: admin / admin123
```

### Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL (or use Docker)
docker compose up -d postgres

# Setup database
cd server
cp .env.example .env
npx prisma migrate dev
npm run seed:admin

# Start servers
cd ..
npm run dev
```

### Production Deployment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your production values
vim .env.production

# Deploy with production compose
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# Seed admin
docker compose -f docker-compose.prod.yml exec server npm run seed:admin
```

## Project Structure

```
face-voting-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   └── index.ts       # Entry point
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Admin seed script
├── shared/                 # Shared TypeScript types
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## API Endpoints

### Voter Auth
- `POST /api/v1/auth/register` - Register new voter
- `GET /api/v1/auth/verify-email?token=` - Verify email
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Parties
- `GET /api/v1/parties` - List active parties

### Voting
- `GET /api/v1/votes/status` - Check vote status
- `POST /api/v1/votes/session` - Start verification session
- `POST /api/v1/votes/session/:id/complete` - Complete verification
- `POST /api/v1/votes` - Submit vote

### Admin
- `POST /api/v1/admin/auth/login` - Admin login
- `GET /api/v1/admin/parties` - List all parties (with vote counts)
- `POST /api/v1/admin/parties` - Create party
- `PUT /api/v1/admin/parties/:id` - Update party
- `DELETE /api/v1/admin/parties/:id` - Delete/deactivate party
- `GET /api/v1/admin/results` - Get vote results

## Environment Variables

### Server (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| JWT_SECRET | JWT signing secret (32+ chars) | Required |
| JWT_EXPIRES_IN | Token expiry | 30m |
| PORT | Server port | 3001 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |
| SMTP_HOST | SMTP server host | smtp.mailtrap.io |
| SMTP_PORT | SMTP port | 2525 |
| SMTP_USER | SMTP username | |
| SMTP_PASS | SMTP password | |
| EMAIL_FROM | From email address | noreply@facevoting.local |
| ENCRYPTION_KEY | 32-char hex for face data encryption | Required |
| ADMIN_USERNAME | Initial admin username | admin |
| ADMIN_PASSWORD | Initial admin password | admin123 |

### Client (.env)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

## Production Checklist

- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Generate ENCRYPTION_KEY (64 hex chars): `openssl rand -hex 32`
- [ ] Use strong PostgreSQL password
- [ ] Configure SMTP for email verification
- [ ] Set FRONTEND_URL to your domain
- [ ] Use HTTPS in production (configure reverse proxy)
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable database backups
- [ ] Set up monitoring and logging

## Security Notes

⚠️ **This is a demo/learning system.** The face recognition and liveness detection use browser-based face-api.js which can be bypassed. For any real election:

1. Move face matching to server-side (Python + DeepFace/InsightFace)
2. Implement proper liveness detection (depth, texture analysis)
3. Use hardware-backed biometric authentication
4. Conduct independent security audits
5. Comply with biometric data regulations (GDPR, DPDP Act, etc.)

## Testing

```bash
# Backend unit tests
cd server && npm test

# Frontend build test
cd client && npm run build

# Lint
npm run lint
```

## License

MIT
