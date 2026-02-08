import { NextFunction, Request, Response } from 'express';
import {
    createLoanService,
    getLoanService,
    accrueInterestService,
    getAccrualsService,
} from './interest.service';

export const createLoanController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const response = await createLoanService(userId, req.body);

        res.status(201).json({
            message: 'Loan created successfully',
            data: response.loan,
        });
    } catch (error) {
        next(error);
    }
};

export const getLoanController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const id = req.params.id as string;
        const response = await getLoanService(id, userId);

        res.status(200).json({
            message: 'Loan retrieved successfully',
            data: response.loan,
        });
    } catch (error) {
        next(error);
    }
};

export const accrueInterestController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const id = req.params.id as string;
        const response = await accrueInterestService(id, userId, req.body);

        res.status(200).json({
            message: 'Interest accrued successfully',
            data: response,
        });
    } catch (error) {
        next(error);
    }
};

export const getAccrualsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.context?.userId as string;
        const id = req.params.id as string;
        const response = await getAccrualsService(id, userId);

        res.status(200).json({
            message: 'Accruals retrieved successfully',
            data: response,
        });
    } catch (error) {
        next(error);
    }
};
