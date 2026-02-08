import { NextFunction, Request, Response } from 'express';
import { getBalanceService, fundWalletService } from './wallet.service';

export const getBalanceController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const response = await getBalanceService(userId);

        res.status(200).json({
            message: 'Wallet retrieved successfully',
            data: response.wallet,
        });
    } catch (error) {
        next(error);
    }
};

export const fundWalletController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const response = await fundWalletService(userId, req.body);

        res.status(200).json({
            message: 'Wallet funded successfully',
            data: response,
        });
    } catch (error) {
        next(error);
    }
};
