import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createVoteSessionSchema, completeVerificationSchema, voteSchema } from '../utils/validation.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import { verifyToken } from '../utils/jwt.js';

const router = Router();

const MATCH_THRESHOLD = 0.5;
const MAX_ATTEMPTS = 3;
const SESSION_EXPIRY_MINUTES = 2;
const TOKEN_EXPIRY_MINUTES = 2;

router.post('/session', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { partyId } = createVoteSessionSchema.parse(req.body);
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasVoted: true, faceEmbeddingEnc: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.hasVoted) {
    throw new AppError(409, 'You have already voted');
  }

  if (!user.faceEmbeddingEnc && process.env.NODE_ENV === 'production') {
    throw new AppError(400, 'Face verification not available. Please re-register with a profile photo.');
  }

  const party = await prisma.party.findUnique({
    where: { id: partyId },
  });

  if (!party || !party.isActive) {
    throw new AppError(404, 'Party not found or inactive');
  }

  const challenges = generateRandomChallenges();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

  const session = await prisma.verificationSession.create({
    data: {
      userId,
      partyId,
      challenges,
      expiresAt,
    },
  });

  res.json({
    sessionId: session.id,
    challenges: session.challenges,
    expiresAt: session.expiresAt,
    matchThreshold: MATCH_THRESHOLD,
  });
}));

router.post('/session/:id/complete', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { matchScore, challengesPassed } = completeVerificationSchema.parse(req.body);
  const userId = req.user!.userId;

  const session = await prisma.verificationSession.findUnique({
    where: { id: req.params.id },
  });

  if (!session) {
    throw new AppError(404, 'Verification session not found');
  }

  if (session.userId !== userId) {
    throw new AppError(403, 'Unauthorized');
  }

  if (session.status !== 'pending') {
    throw new AppError(400, 'Session already completed or failed');
  }

  if (session.expiresAt < new Date()) {
    await prisma.verificationSession.update({
      where: { id: session.id },
      data: { status: 'expired' },
    });
    throw new AppError(400, 'Session expired');
  }

  if (matchScore > MATCH_THRESHOLD) {
    await prisma.verificationSession.update({
      where: { id: session.id },
      data: {
        attempts: { increment: 1 },
        status: session.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending',
      },
    });
    throw new AppError(400, `Face match failed. Score: ${matchScore.toFixed(2)}. Threshold: ${MATCH_THRESHOLD}`);
  }

  const requiredChallenges = session.challenges as Array<{ type: string; completed: boolean }>;
  const allPassed = requiredChallenges.every(c => challengesPassed.includes(c.type as any));

  if (!allPassed) {
    await prisma.verificationSession.update({
      where: { id: session.id },
      data: {
        attempts: { increment: 1 },
        status: session.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending',
      },
    });
    throw new AppError(400, 'Not all liveness challenges passed');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationSession.update({
    where: { id: session.id },
    data: {
      status: 'completed',
      tokenHash,
      expiresAt: tokenExpiresAt,
    },
  });

  res.json({ token });
}));

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { sessionToken } = voteSchema.parse(req.body);
  const userId = req.user!.userId;

  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

  const session = await prisma.verificationSession.findFirst({
    where: {
      tokenHash,
      status: 'completed',
      expiresAt: { gte: new Date() },
    },
    include: { party: true },
  });

  if (!session) {
    throw new AppError(400, 'Invalid or expired session token');
  }

  if (session.userId !== userId) {
    throw new AppError(403, 'Unauthorized');
  }

  const existingReceipt = await prisma.voteReceipt.findUnique({
    where: { userId },
  });

  if (existingReceipt) {
    throw new AppError(409, 'You have already voted');
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.create({
      data: {
        partyId: session.partyId,
      },
    });

    await tx.voteReceipt.create({
      data: { userId },
    });

    await tx.user.update({
      where: { id: userId },
      data: { hasVoted: true },
    });

    await tx.verificationSession.update({
      where: { id: session.id },
      data: { status: 'completed', tokenHash: null },
    });
  });

  res.json({
    message: 'Vote submitted successfully',
    party: session.party.name,
    timestamp: new Date().toISOString(),
  });
}));

router.get('/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { hasVoted: true },
  });

  res.json({ hasVoted: user?.hasVoted || false });
}));

function generateRandomChallenges(): Array<{ type: string; instruction: string; completed: boolean }> {
  const allChallenges = [
    { type: 'blink', instruction: 'Blink your eyes twice' },
    { type: 'turn_left', instruction: 'Turn your head to the left' },
    { type: 'turn_right', instruction: 'Turn your head to the right' },
    { type: 'nod', instruction: 'Nod your head up and down' },
    { type: 'smile', instruction: 'Smile broadly' },
  ];

  const shuffled = [...allChallenges].sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 2);
  return shuffled.slice(0, count).map(c => ({ ...c, completed: false }));
}

export default router;