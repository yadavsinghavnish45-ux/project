import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { partySchema } from '../utils/validation.js';
import { AuthenticatedRequest } from '../middleware/adminAuth.js';

const router = Router();

router.get('/parties', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const parties = await prisma.party.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { votes: true } },
    },
  });

  res.json({
    parties: parties.map(p => ({
      id: p.id,
      name: p.name,
      logoPath: p.logoPath,
      isActive: p.isActive,
      voteCount: p._count.votes,
      createdAt: p.createdAt,
    })),
  });
}));

router.post('/parties', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = partySchema.parse(req.body);

  const party = await prisma.party.create({
    data: {
      name: data.name,
      logoPath: data.logoPath,
      createdBy: req.user!.userId,
    },
  });

  res.status(201).json({ party });
}));

router.put('/parties/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = partySchema.parse(req.body);

  const party = await prisma.party.update({
    where: { id: req.params.id },
    data: {
      name: data.name,
      logoPath: data.logoPath,
    },
  });

  res.json({ party });
}));

router.delete('/parties/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const party = await prisma.party.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { votes: true } } },
  });

  if (!party) {
    throw new AppError(404, 'Party not found');
  }

  if (party._count.votes > 0) {
    await prisma.party.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Party deactivated (has votes)' });
  } else {
    await prisma.party.delete({ where: { id: req.params.id } });
    res.json({ message: 'Party deleted' });
  }
}));

router.get('/results', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const results = await prisma.party.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const totalVotes = results.reduce((sum, p) => sum + p._count.votes, 0);

  res.json({
    totalVotes,
    results: results.map(p => ({
      id: p.id,
      name: p.name,
      logoPath: p.logoPath,
      votes: p._count.votes,
      percentage: totalVotes > 0 ? ((p._count.votes / totalVotes) * 100).toFixed(1) : '0.0',
    })),
  });
}));

export default router;