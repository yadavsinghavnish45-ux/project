import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res: Response) => {
  const parties = await prisma.party.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      logoPath: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({ parties });
}));

router.get('/:id', asyncHandler(async (req, res: Response) => {
  const party = await prisma.party.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      logoPath: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!party) {
    throw new AppError(404, 'Party not found');
  }

  res.json({ party });
}));

export default router;