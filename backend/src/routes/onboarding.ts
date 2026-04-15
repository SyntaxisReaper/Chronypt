import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, getAuthUser } from '../middleware/auth';

const router = Router();

const onboardingSchema = z.object({
  operationalRole: z.enum(['technical_founder', 'nontechnical_founder', 'product_manager', 'operations_lead']),
  primaryObjective: z.enum(['market_validation', 'system_architecture', 'operational_deployment', 'full_ecosystem']),
  infrastructureState: z.enum(['greenfield', 'mvp_scaling', 'legacy_modernization']),
  deploymentTimeline: z.enum(['immediate', 'q2_q3', 'long_term']),
});

// ─── POST /api/onboarding — Save onboarding answers ───
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const userId = getAuthUser(req).userId;

    // Check if already onboarded
    const existing = await prisma.onboarding.findUnique({ where: { userId } });
    if (existing) {
      // Update existing
      await prisma.onboarding.update({
        where: { userId },
        data: parsed.data,
      });
    } else {
      // Create new
      await prisma.onboarding.create({
        data: {
          userId,
          ...parsed.data,
        },
      });
    }

    // Mark user as onboarded
    await prisma.user.update({
      where: { id: userId },
      data: { onboarded: true },
    });

    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
    });

    res.json({ message: 'Onboarding complete.', onboarding });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/onboarding — Get onboarding data ───
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId: getAuthUser(req).userId },
    });
    if (!onboarding) {
      res.status(404).json({ error: 'Onboarding not completed yet.' });
      return;
    }
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
