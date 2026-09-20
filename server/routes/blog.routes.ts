import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(blogs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

export default router;
