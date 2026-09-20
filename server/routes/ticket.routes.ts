import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { subject, message } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        replies: {
          create: {
            userId,
            message,
          }
        }
      }
    });
    res.status(201).json(ticket);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

export default router;
