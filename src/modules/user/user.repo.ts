import { DB } from '@/database';
import { User } from '@/interfaces/user.interfaces';

export const repo = {
    getUserProfile: async (
        userId: string | undefined,
    ): Promise<User | null> => {
        return await DB.Users.findOne({ where: { id: userId } });
    },
};
