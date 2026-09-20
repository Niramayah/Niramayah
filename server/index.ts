import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load env vars
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Global Prisma Client
export const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import ticketRoutes from './routes/ticket.routes';
import blogRoutes from './routes/blog.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/blogs', blogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NIRAMAYAH API is running' });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
