import express from 'express';
import { signInController, signUpController } from './auth.controller';

const authRouter = express.Router();

authRouter.post('/signup', signUpController);
authRouter.post('/signin', signInController);

export default authRouter;
