import { config } from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
config({ path: envFile });

export const { PORT, NODE_ENV, BASE_URL, JWT_ACCESS_TOKEN_SECRET } =
    process.env;

export const {
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_HOST,
    DB_DIALECT,
} = process.env;
