import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    createLoanController,
    getLoanController,
    accrueInterestController,
    getAccrualsController,
} from './interest.controller';

const interestRouter = express.Router();

interestRouter.post('/', authMiddleware, createLoanController);
interestRouter.get('/:id', authMiddleware, getLoanController);
interestRouter.post('/:id/accrue', authMiddleware, accrueInterestController);
interestRouter.get('/:id/accruals', authMiddleware, getAccrualsController);

export default interestRouter;
