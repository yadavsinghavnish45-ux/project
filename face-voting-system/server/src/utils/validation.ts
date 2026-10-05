import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  faceEmbedding: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const partySchema = z.object({
  name: z.string().min(1, 'Party name is required').max(100),
  logoPath: z.string().url('Invalid logo URL').optional().nullable(),
});

export const createVoteSessionSchema = z.object({
  partyId: z.string().cuid('Invalid party ID'),
});

export const completeVerificationSchema = z.object({
  matchScore: z.number().min(0).max(1),
  challengesPassed: z.array(z.enum(['blink', 'turn_left', 'turn_right', 'nod', 'smile'])),
});

export const voteSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});