# Face Detection Voting System - Tasks

## Spec/Plan Revision
Based on `spec.md` and `plan.md` (initial drafts)

## Task Breakdown

### Batch 1: Foundation & Core Auth
**Outcome**: Running dev environment with user registration, login, JWT auth

| Task ID | Objective | Acceptance | Dependencies |
|---------|-----------|------------|--------------|
| B1-T1 | Initialize monorepo: frontend (Vite+React+TS), backend (Express+TS), shared types | `npm run dev` starts both; TypeScript compiles | None |
| B1-T2 | Docker Compose: PostgreSQL, backend, frontend | `docker compose up` brings up all services | B1-T1 |
| B1-T3 | Prisma schema + migrations for User, Party, Vote, Admin, EmailVerification | `npx prisma migrate dev` succeeds | B1-T2 |
| B1-T4 | Backend: Express server with CORS, helmet, rate limiting | Health endpoint responds; security headers present | B1-T3 |
| B1-T5 | Auth service: bcrypt password hashing, JWT sign/verify | Unit tests pass for hash/verify/token | B1-T4 |
| B1-T6 | Auth routes: POST /auth/register, POST /auth/login | Returns 201/200 with JWT; validates input | B1-T5 |
| B1-T7 | Frontend: Register page with form validation (name, username, email, password, photo) | Form submits to API; shows errors | B1-T6 |
| B1-T8 | Frontend: Login page with form validation | JWT stored in httpOnly cookie/localStorage | B1-T6 |
| B1-T9 | Frontend: Auth context + protected routes | Redirects unauthenticated users | B1-T7, B1-T8 |
| B1-T10 | E2E: Register → Login → Access protected page | Cypress/Playwright test passes | B1-T9 |

**Verification**: `npm test` (unit), `npm run test:e2e` (B1-T10), manual smoke test

---

### Batch 2: Face Detection & Registration Enhancement
**Outcome**: Registration captures face embedding, stores encrypted

| Task ID | Objective | Acceptance | Dependencies |
|---------|-----------|------------|--------------|
| B2-T1 | Add face-api.js to frontend; download models to `public/models` | Models load without 404 | B1-T1 |
| B2-T2 | Create `useFaceDetection` hook: load models, detect face, compute descriptor | Returns 128-dim Float32Array | B2-T1 |
| B2-T3 | Registration: Camera preview component for profile photo | Live video feed; "Capture" button | B2-T2 |
| B2-T4 | Registration: Generate face embedding from captured photo | Embedding sent to backend with registration | B2-T3 |
| B2-T5 | Backend: Encrypt/decrypt face embedding (AES-GCM) | Round-trip encryption test passes | B1-T5 |
| B2-T6 | Backend: Store encrypted embedding in User.faceEmbedding | Prisma creates record with Bytea | B2-T5 |
| B2-T7 | Profile photo upload to local storage (encrypted filename) | File saved; path in User.profilePhoto | B2-T3 |
| B2-T8 | Email verification: Send 6-digit OTP, verify endpoint | OTP expires in 10 min; resend cooldown | B1-T5 |

**Verification**: Register new user → embedding stored → can decrypt → matches original

---

### Batch 3: Voting Flow with Face Verification
**Outcome**: Complete vote flow with face match + liveness

| Task ID | Objective | Acceptance | Dependencies |
|---------|-----------|------------|--------------|
| B3-T1 | Backend: GET /parties (public), POST /votes (auth) | Returns parties; vote creates Vote record | B1-T3 |
| B3-T2 | Frontend: Voting page with PartyCard grid | Displays parties from API | B3-T1 |
| B3-T3 | FaceVerification component: Camera + face detection overlay | Shows video with face mesh overlay | B2-T2 |
| B3-T4 | Face matching: Compare live descriptor with stored (cosine similarity) | Match > 0.6 → proceed; else error | B2-T6 |
| B3-T5 | Liveness challenges: Blink, Turn Left, Turn Right, Nod, Smile | Random order; each verifies via landmarks | B3-T3 |
| B3-T6 | Liveness verification logic: EAR for blink, landmark ratios for turns/nod/smile | All 5 challenges detectable | B3-T5 |
| B3-T7 | Vote submission flow: Party click → FaceVerification modal → Success | End-to-end vote recorded in DB | B3-T2, B3-T4, B3-T6 |
| B3-T8 | Double vote prevention: Check User.hasVoted + DB unique constraint | Second attempt returns 409 | B1-T3, B3-T1 |
| B3-T9 | Vote success page with timestamp + party name | Shows confirmation, no sensitive data | B3-T7 |

**Verification**: 
- Unit: Face match threshold, liveness detectors
- E2E: Valid user votes → success; Invalid face → blocked; Double vote → blocked

---

### Batch 4: Admin Portal
**Outcome**: Admin can manage parties

| Task ID | Objective | Acceptance | Dependencies |
|---------|-----------|------------|--------------|
| B4-T1 | Admin model + seed script (CLI: `npm run seed:admin`) | Creates admin user in DB | B1-T3 |
| B4-T2 | Backend: Admin auth middleware (role check) | 403 for non-admin; 200 for admin | B1-T5 |
| B4-T3 | Admin routes: CRUD /admin/parties | All operations work; validation | B4-T2 |
| B4-T4 | Frontend: Admin login page (separate from voter) | Redirects to admin dashboard | B4-T2 |
| B4-T5 | Frontend: Admin dashboard with party table + add/edit/delete | Real-time updates; optimistic UI | B4-T3 |
| B4-T6 | Party symbol upload (emoji or image) | Displays on voting page | B4-T5 |

**Verification**: Admin login → add party → appears on voting page → edit → delete (soft)

---

### Batch 5: Polish, Security & Testing
**Outcome**: Production-ready with full test coverage

| Task ID | Objective | Acceptance | Dependencies |
|---------|-----------|------------|--------------|
| B5-T1 | Email verification enforced before voting | Unverified users blocked at vote | B2-T8 |
| B5-T2 | Rate limiting: Auth endpoints (5/min), Vote (1/hour) | 429 responses with retry-after | B1-T4 |
| B5-T3 | Security headers: CSP, HSTS, X-Frame-Options | Security scan passes | B1-T4 |
| B5-T4 | Error boundaries + loading skeletons + toast notifications | No uncaught errors; UX smooth | All batches |
| B5-T5 | Accessibility: ARIA labels, keyboard nav, color contrast | axe-core audit passes | All batches |
| B5-T6 | Unit tests: Auth, face utils, liveness logic | >80% coverage | All batches |
| B5-T7 | E2E tests: Full flows (register→vote, admin→party) | All critical paths covered | All batches |
| B5-T8 | Docker production build + docker-compose.prod.yml | Multi-stage builds; <500MB images | B1-T2 |
| B5-T9 | README: Setup, env vars, deployment guide | New dev can run in <10 min | All batches |

**Verification**: Full test suite passes; security audit; manual UAT

---

## Batch Execution Order

| Batch | Status | Next Action |
|-------|--------|-------------|
| 1 | `pending` | Awaiting combined approval |
| 2 | `pending` | After Batch 1 verified |
| 3 | `pending` | After Batch 2 verified |
| 4 | `pending` | After Batch 3 verified |
| 5 | `pending` | After Batch 4 verified |

## Approval Record
**Combined Approval**: [ ] Spec  [ ] Plan  [ ] Tasks  
**Approved by**: ___________  
**Date**: ___________  
**Scope**: All 5 batches as defined above

## Current State
- **Phase**: Drafting complete, awaiting combined approval
- **Next**: Human review of spec.md, plan.md, tasks.md together
- **Authorization**: None granted yet

---

## Specialist/Tool Exceptions
| Task | Exception | Reason |
|------|-----------|--------|
| B2-T2, B3-T3..B3-T6 | Add `ml-engineer` specialist | Face detection requires ML expertise |
| B5-T3 | Add `security-engineer` for review | Security headers need expert validation |
| All | Use `playwright` for E2E (not Cypress) | Better cross-browser, faster CI |

## Verification Commands
```bash
# Unit tests
npm test --workspace=backend
npm test --workspace=frontend

# E2E tests
npm run test:e2e

# Type check
npm run typecheck --workspaces

# Lint
npm run lint --workspaces

# Security audit
npm audit --workspace=backend
npm audit --workspace=frontend
```