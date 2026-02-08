import { Request, Response, NextFunction } from 'express';
import { getUserProfileController } from '../../../src/modules/user/user.controller';
import { getUserProfileService } from '../../../src/modules/user/user.service';
import { CustomError } from '../../../src/utils/custom-error';

jest.mock('../../../src/modules/user/user.service', () => ({
    getUserProfileService: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks(); 
});

describe('getUserProfileController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer mockAccessToken',
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        jest.clearAllMocks();
    });

    it('should return user profile when accessToken is valid', async () => {
        const mockUser = {
            id: 'user123',
            email: 'user@example.com',
            username: 'user',
        };
        (getUserProfileService as jest.Mock).mockResolvedValue(mockUser);

        await getUserProfileController(req as Request, res as Response, next);

        expect(getUserProfileService).toHaveBeenCalledWith('mockAccessToken');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User data fetched',
            data: mockUser,
        });
    });

    it('should return 404 if authorization header is missing', async () => {
        req.headers!.authorization = undefined;

        await getUserProfileController(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        expect(getUserProfileService).not.toHaveBeenCalled();
    });

    it('should call next with error if getUserProfileService throws an error', async () => {
        const error = new CustomError('Invalid token', 401);
        (getUserProfileService as jest.Mock).mockRejectedValue(error);

        await getUserProfileController(req as Request, res as Response, next);

        expect(getUserProfileService).toHaveBeenCalledWith('mockAccessToken');
        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
