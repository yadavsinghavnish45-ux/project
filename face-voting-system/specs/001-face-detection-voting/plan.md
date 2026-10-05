# Face Detection Voting System - Implementation Plan

## Spec Revision
Based on `specs/001-face-detection-voting/spec.md` (initial draft)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│   (React/TS)    │     │   (Express/TS)  │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Face Detection  │     │  Auth Service   │     │  File Storage   │
│ (TF.js/MediaPipe)│     │  (JWT/bcrypt)   │     │  (Local/S3)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Component Breakdown

### Frontend (React 18 + TypeScript + Vite)
| Component | Responsibility |
|-----------|----------------|
| `pages/Register.tsx` | Registration form, photo upload, email verification |
| `pages/Login.tsx` | Login form, JWT storage |
| `pages/Voting.tsx` | Party list, vote button, face verification modal |
| `pages/Admin.tsx` | Admin dashboard, party CRUD |
| `components/FaceVerification.tsx` | Camera access, face detection, liveness challenges |
| `components/PartyCard.tsx` | Display party with vote button |
| `hooks/useAuth.ts` | Auth state, token management |
| `hooks/useFaceDetection.ts` | Face-api.js/MediaPipe integration |
| `services/api.ts` | Axios instance with interceptors |

### Backend (Express + TypeScript)
| Module | Responsibility |
|--------|----------------|
| `routes/auth.ts` | Register, login, email verification, password reset |
| `routes/voting.ts` | Get parties, submit vote, check vote status |
| `routes/admin.ts` | Party CRUD (admin only) |
| `middleware/auth.ts` | JWT verification, role checking |
| `middleware/rateLimit.ts` | Rate limiting for auth endpoints |
| `services/faceService.ts` | Face embedding generation, comparison |
| `services/emailService.ts` | OTP/verification emails |
| `services/storageService.ts` | Profile photo upload/retrieval |
| `utils/faceUtils.ts` | Face-api.js server-side utilities (if needed) |

### Database Schema (Prisma)
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  username      String   @unique
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  profilePhoto  String?  // Encrypted path/reference
  faceEmbedding Bytea?   // Encrypted face descriptor
  hasVoted      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Party {
  id          String   @id @default(cuid())
  name        String
  symbol      String?  // Emoji or image path
  description String?
  displayOrder Int     @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Vote {
  id        String   @id @default(cuid())
  userId    String   @unique
  partyId   String
  timestamp DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  party     Party    @relation(fields: [partyId], references: [id])
}

model Admin {
  id        String   @id @default(cuid())
  username  String   @unique
  passwordHash String
  createdAt DateTime @default(now())
}

model EmailVerification {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
}
```

## Design Decisions

### 1. Face Recognition Library: **face-api.js**
- **Reason**: Lightweight (~500KB), runs entirely in browser, good accuracy for 1:1 matching, MIT license
- **Models needed**: Tiny Face Detector, Face Landmark 68, Face Recognition
- **Alternative considered**: MediaPipe Face Mesh (more accurate but heavier, requires WASM)

### 2. Face Embedding Storage
- **Client-side generation**: Generate embedding in browser during registration, send only embedding to server
- **Encryption**: AES-GCM encrypt embedding before DB storage, decrypt only for comparison
- **Threshold**: 0.6 cosine similarity for match (configurable)

### 3. Liveness Detection Approach
- **Method**: MediaPipe Face Mesh landmarks (468 points) for precise facial feature tracking
- **Challenges**: Blink (eye aspect ratio), Head turn (nose/ear landmark ratio), Nod (nose/forehead), Smile (mouth corners)
- **Randomization**: Shuffle challenge order per session

### 4. Email Verification
- **Method**: 6-digit OTP, 10-minute expiry, stored in DB with hash
- **Resend**: Cooldown 60 seconds

### 5. Admin Authentication
- **Approach**: Separate Admin model, seeded via CLI script on first deploy
- **Alternative**: First registered user becomes admin (simpler but less secure)

### 6. Photo Storage
- **Development**: Local filesystem (`uploads/` with encryption)
- **Production**: S3-compatible (MinIO, AWS S3, Cloudflare R2)
- **Reference**: Store encrypted path in DB, decrypt on retrieval

## Specialist Assignments

| Area | Specialist | Tool |
|------|------------|------|
| Frontend Architecture | frontend-architect | Read/Write/Edit, Bash |
| Face Detection Integration | ml-engineer | Read/Write/Edit, Bash, WebFetch (face-api.js docs) |
| Backend API & Auth | backend-engineer | Read/Write/Edit, Bash |
| Database Design | database-engineer | Read/Write/Edit, Bash |
| Security Review | security-engineer | Read (audit), Bash |
| Testing Strategy | test-engineer | Read/Write/Edit, Bash |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Face matching false negatives | Medium | High | Adjust threshold, allow 3 retries, fallback to manual review |
| Face matching false positives | Low | Critical | Liveness detection mandatory, encrypt embeddings |
| Camera access denied | Medium | High | Clear UI guidance, test on target devices |
| Model loading slow on mobile | Medium | Medium | Lazy load models, show progress, cache in IndexedDB |
| Email delivery failures | Low | Medium | Log failures, allow manual verification by admin |
| Double voting via race condition | Low | Critical | DB unique constraint on Vote.userId, transaction |

## Implementation Batches

### Batch 1: Foundation (Core Setup)
- Project structure, Docker, Prisma schema, basic Express server
- User registration + login (no face yet)
- JWT auth middleware

### Batch 2: Face Detection & Registration
- Integrate face-api.js in frontend
- Profile photo upload + face embedding generation
- Store encrypted embedding in DB

### Batch 3: Voting Flow with Face Verification
- Voting page with party list
- Face verification modal (camera + matching)
- Liveness challenges implementation
- Vote submission + double-vote prevention

### Batch 4: Admin Portal
- Admin auth + dashboard
- Party CRUD operations
- Basic statistics

### Batch 5: Polish & Security
- Email verification flow
- Rate limiting, security headers
- Error handling, loading states
- Accessibility improvements
- E2E tests

## Next Step
Draft `tasks.md` with detailed task breakdown per batch for combined approval.