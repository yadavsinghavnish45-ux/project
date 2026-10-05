import jwt from 'jsonwebtoken';
import { User } from '@shared/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'voter' | 'admin';
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateAdminToken(adminId: string, username: string): string {
  return generateToken({ userId: adminId, username, role: 'admin' });
}

export function generateVoterToken(user: User): string {
  return generateToken({ userId: user.id, username: user.username, role: 'voter' });
}