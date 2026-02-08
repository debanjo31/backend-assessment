import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
    interface Request {
        context?: JwtPayload;
    }
}
