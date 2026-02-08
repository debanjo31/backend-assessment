import { repo } from './user.repo';
import { CustomError } from '@/utils/custom-error';
import { verifyJWT } from '@/middlewares/jwt.service';
import { JWT_ACCESS_TOKEN_SECRET } from '@/config';

export const getUserProfileService = async (accessToken: string) => {
    const decodeToken = await verifyJWT(
        accessToken,
        JWT_ACCESS_TOKEN_SECRET as string,
    );

    const userId = decodeToken.userId;

    const user = await repo.getUserProfile(userId);
    if (!user) {
        throw new CustomError('User not found', 404);
    }

    const userObj = user instanceof Object ? JSON.parse(JSON.stringify(user)) : user;
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
};
