import authRouter from '@/modules/auth/auth.routes';
import userRouter from '@/modules/user/user.routes';
import walletRouter from '@/modules/wallet/wallet.routes';
import transferRouter from '@/modules/transfer/transfer.routes';
import interestRouter from '@/modules/interest/interest.routes';
import express from 'express';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/wallet', walletRouter);
router.use('/transfer', transferRouter);
router.use('/loans', interestRouter);

export default router;
