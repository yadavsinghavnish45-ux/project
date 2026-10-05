import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { prisma } from '../index.js';
import { generateVoterToken } from '../utils/jwt.js';
import { createVerificationToken, sendVerificationEmail, verifyEmailToken } from '../services/emailService.js';
import { registerSchema, loginSchema, verifyEmailSchema } from '../utils/validation.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files are allowed'));
    }
  }
});

router.post('/register', upload.single('photo'), asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse({
    fullName: req.body.fullName,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });

  if (existingUser) {
    throw new AppError(409, 'Username or email already exists');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  let faceEmbeddingEnc: Buffer | null = null;
  if (req.body.faceEmbedding) {
    const embeddingBuffer = Buffer.from(req.body.faceEmbedding, 'base64');
    faceEmbeddingEnc = encrypt(embeddingBuffer);
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      passwordHash,
      faceEmbeddingEnc,
    },
  });

  const token = await createVerificationToken(user.id);
  await sendVerificationEmail(user.email, user.username, token);

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    userId: user.id,
  });
}));

router.get('/verify-email', asyncHandler(async (req, res: Response) => {
  const { token } = verifyEmailSchema.parse(req.query);

  const result = await verifyEmailToken(token);
  if (!result) {
    throw new AppError(400, 'Invalid or expired verification token');
  }

  res.json({ message: 'Email verified successfully. You can now log in.' });
}));

router.post('/login', asyncHandler(async (req, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (!user) {
    throw new AppError(401, 'Invalid username or password');
  }

  const validPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'Invalid username or password');
  }

  if (!user.emailVerified) {
    throw new AppError(403, 'Please verify your email before logging in');
  }

  const token = generateVoterToken(user);
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000,
  });

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      hasVoted: user.hasVoted,
      createdAt: user.createdAt,
    },
    token,
  });
}));

router.post('/logout', (_req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.prismaUser) {
    throw new AppError(401, 'Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      emailVerified: true,
      hasVoted: true,
      createdAt: true,
      faceEmbeddingEnc: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
}));

export default router;