import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { prisma } from '../index.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  prismaUser?: Awaited<ReturnType<typeof prisma.user.findUnique>>;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'voter') {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, emailVerified: true, hasVoted: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = payload;
    req.prismaUser = user;
    next();
  } catch {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

export async function adminAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      res.status(401).json({ message: 'Admin authentication required' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true },
    });

    if (!admin) {
      res.status(401).json({ message: 'Admin not found' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Admin authentication failed' });
  }
}