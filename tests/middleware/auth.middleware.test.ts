import { authMiddleware } from '../../src/middlewares/auth.middleware';
import { verifyJWT } from '../../src/middlewares/jwt.service';
import { CustomError } from '../../src/utils/custom-error';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../src/middlewares/jwt.service', () => ({
    verifyJWT: jest.fn(),
}));

interface CustomRequest extends Request {
    context?: any;
}

describe('authMiddleware', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            method: 'GET',
            url: '',
            header: jest.fn(),
            context: {},
        };
        res = {};
        next = jest.fn();
    });

    test('Should bypass middleware if the request method is OPTIONS', async () => {
        req.method = 'OPTIONS';

        await authMiddleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    test('Should bypass middleware for /api/auth/signin route', async () => {
        req.method = 'POST';
        req.url = '/api/auth/signin';

        await authMiddleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    test('Should throw an error if Authorization header is missing', async () => {
        req.url = '/api/protected-route';
        (req.header as jest.Mock).mockReturnValue(undefined);

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(
            new CustomError('Authorization header missing', 401),
        );
    });

    test('Should proceed if the token is valid', async () => {
        req.url = '/api/protected-route';
        const mockPayload = { userId: '123' };

        (req.header as jest.Mock).mockReturnValue('Bearer validToken');
        (verifyJWT as jest.Mock).mockResolvedValue(mockPayload);

        await authMiddleware(req as Request, res as Response, next);

        expect(req.context).toEqual(mockPayload);
        expect(next).toHaveBeenCalled();
    });

    test('Should throw an error if the token is invalid', async () => {
        req.url = '/api/protected-route';

        (req.header as jest.Mock).mockReturnValue('Bearer invalidToken');
        (verifyJWT as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(new Error('Invalid token'));
    });
});
