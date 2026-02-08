import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    getBalanceController,
    fundWalletController,
} from './wallet.controller';

const walletRouter = express.Router();

walletRouter.get('/balance', authMiddleware, getBalanceController);
walletRouter.post('/fund', authMiddleware, fundWalletController);

export default walletRouter;
