import { Request, Response, NextFunction } from 'express';
import { signUpController, signInController } from '../../../src/modules/auth/auth.controller';
import { signUpService, signInService } from '../../../src/modules/auth/auth.service';

jest.mock('../../../src/modules/auth/auth.service', () => ({
    signUpService: jest.fn(),
    signInService: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks(); 
});

describe('signUpController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: { email: 'new@example.com', password: 'password' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 201 and response data on successful sign-up', async () => {
        const mockUser = { id: 1, email: 'new@example.com', username: 'newuser' };
        (signUpService as jest.Mock).mockResolvedValue({ user: mockUser });

        await signUpController(req as Request, res as Response, next);

        expect(signUpService).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Successfully signed up',
            data: mockUser,
        });
    });

    it('should call next with error if service throws an error', async () => {
        const error = new Error('Service error');
        (signUpService as jest.Mock).mockRejectedValue(error);

        await signUpController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('signInController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: { email: 'test@example.com', password: 'password' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 and response data on successful sign-in', async () => {
        const mockResponse = {
            user: { id: 1, email: 'test@example.com', username: 'testuser' },
            accessToken: 'mocked_access_token',
        };
        (signInService as jest.Mock).mockResolvedValue(mockResponse);

        await signInController(req as Request, res as Response, next);

        expect(signInService).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Successfully signed in',
            data: mockResponse,
        });
    });

    it('should call next with error if service throws an error', async () => {
        const error = new Error('Invalid credentials');
        (signInService as jest.Mock).mockRejectedValue(error);

        await signInController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});