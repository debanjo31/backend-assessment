import express from 'express';
import { getUserProfileController } from './user.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const userRouter = express.Router();

userRouter.get('/profile', authMiddleware, getUserProfileController);

export default userRouter;
