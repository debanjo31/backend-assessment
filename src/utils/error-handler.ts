import { Request, Response, NextFunction } from 'express';
import { CustomError } from './custom-error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
    err: Error | CustomError,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const statusCode = err instanceof CustomError ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({ error: message });
};
