import { getUserProfileService } from '../../../src/modules/user/user.service';
import { verifyJWT } from '../../../src/middlewares/jwt.service';
import { repo } from '../../../src/modules/user/user.repo';
import { CustomError } from '../../../src/utils/custom-error';
import { JWT_ACCESS_TOKEN_SECRET } from '../../../src/config/index';

jest.mock('../../../src/middlewares/jwt.service');
jest.mock('../../../src/modules/user/user.repo');
jest.mock('../../../src/database', ()=>({
    DB: {
        sequelize: {
            close: jest.fn(),
            authenticate: jest.fn(),
        }
    }
}));

jest.mock('../../../src/config/index', () => ({
    JWT_ACCESS_TOKEN_SECRET: 'mock_secret_key'
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getUserProfileService', () => {
    const mockAccessToken = 'mockAccessToken';
    const mockUserId = 'user123';
    const mockUser = { id: mockUserId, email: 'user@example.com', username: 'user' };

    it('should return user profile when accessToken is valid', async () => {
        (verifyJWT as jest.Mock).mockResolvedValue({ userId: mockUserId });
        (repo.getUserProfile as jest.Mock).mockResolvedValue(mockUser);

        const result = await getUserProfileService(mockAccessToken);

        expect(verifyJWT).toHaveBeenCalledWith(mockAccessToken, JWT_ACCESS_TOKEN_SECRET);
        expect(repo.getUserProfile).toHaveBeenCalledWith(mockUserId);
        expect(result).toEqual(mockUser);
    });

    it('should throw an error if user is not found', async () => {
        (verifyJWT as jest.Mock).mockResolvedValue({ userId: mockUserId });
        (repo.getUserProfile as jest.Mock).mockResolvedValue(null);

        await expect(getUserProfileService(mockAccessToken)).rejects.toThrow(
            new CustomError('User not found', 404),
        );

        expect(verifyJWT).toHaveBeenCalledWith(mockAccessToken, expect.any(String));
        expect(repo.getUserProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw an error if token verification fails', async () => {
        (verifyJWT as jest.Mock).mockRejectedValue(new Error('Invalid token'));
    
        await expect(getUserProfileService(mockAccessToken)).rejects.toThrow('Invalid token');
    
        expect(verifyJWT).toHaveBeenCalledWith(mockAccessToken, expect.any(String));
        expect(repo.getUserProfile).not.toHaveBeenCalled();
    });
    
});
