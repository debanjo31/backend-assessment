import { User } from '@/interfaces/user.interfaces';
import { validateSignIn, validateSignUp } from './auth.validator';
import repo from './auth.repo';
import walletRepo from '../wallet/wallet.repo';
import { compareSync, hash } from 'bcrypt';
import { generateJWT } from '@/middlewares/jwt.service';
import { JWT_ACCESS_TOKEN_SECRET } from '@/config';
import { CustomError } from '@/utils/custom-error';

export const signUpService = async (userData: User) => {
    const { error } = validateSignUp(userData);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const findUser = await repo.findUserByEmail(userData.email);
    if (findUser) {
        throw new CustomError(`Email ${userData.email} already exists`, 409);
    }

    const randomId = (Date.now() + Math.floor(Math.random() * 100)).toString(
        36,
    );
    const username = `${userData.email.split('@')[0]}-${randomId}`;
    const hashedPassword = await hash(userData.password, 10);
    const newUserData = await repo.createUser({
        ...userData,
        username,
        password: hashedPassword,
    });

    // Auto-create wallet for new user
    await walletRepo.createWallet(newUserData.id as string);

    return { user: newUserData };
};

export const signInService = async (userData: User) => {
    const { error } = validateSignIn(userData);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const user = await repo.findUserByEmail(userData.email);
    if (!user) {
        throw new CustomError('Email or password is invalid', 401);
    }

    const validPassword = compareSync(userData.password, user.password);
    if (!validPassword) {
        throw new CustomError('Email or password is invalid', 401);
    }

    const payload = {
        userId: user.id,
    };

    const accessToken = await generateJWT(
        payload,
        JWT_ACCESS_TOKEN_SECRET as string,
    );

    return { user, accessToken };
};
