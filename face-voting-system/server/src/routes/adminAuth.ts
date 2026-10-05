import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { adminLoginSchema } from '../utils/validation.js';
import { generateAdminToken } from '../utils/jwt.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res: Response) => {
  const data = adminLoginSchema.parse(req.body);

  const admin = await prisma.admin.findUnique({
    where: { username: data.username },
  });

  if (!admin) {
    throw new AppError(401, 'Invalid credentials');
  }

  const validPassword = await bcrypt.compare(data.password, admin.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = generateAdminToken(admin.id, admin.username);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });

  res.json({
    admin: { id: admin.id, username: admin.username },
    token,
  });
}));

export default router;