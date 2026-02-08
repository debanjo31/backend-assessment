import { NextFunction, Request, Response } from 'express';
import { transferService } from './transfer.service';

export const transferController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const senderId = req.context?.userId as string;
        const response = await transferService(senderId, req.body);

        res.status(200).json({
            message: response.message,
            data: response.transaction,
        });
    } catch (error) {
        next(error);
    }
};
