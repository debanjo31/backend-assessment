import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { transferController } from './transfer.controller';

const transferRouter = express.Router();

transferRouter.post('/', authMiddleware, transferController);

export default transferRouter;
