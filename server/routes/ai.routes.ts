import { Router } from 'express';
import { processTest } from '../controllers/ai.controller';

const router = Router();

router.post('/analyze', processTest);

export default router;
