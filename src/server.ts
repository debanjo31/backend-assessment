import express from 'express';
import cors from 'cors';
import router from '@routes/routes';
import logger from '@utils/logger';
import { DB } from '@database/index';
import { PORT } from './config';
import { errorHandler } from './utils/error-handler';

const appServer = express();
const port = PORT;

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

appServer.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        if (res.statusCode >= 500) {
            logger.error(message);
        } else if (res.statusCode >= 400) {
            logger.warn(message);
        } else {
            logger.info(message);
        }
    });

    next();
});

// Enable CORS
appServer.use(cors(corsOptions));
appServer.options('*', cors(corsOptions));

// Middleware for parsing JSON and URL-encoded bodies
appServer.use(express.json());
appServer.use(express.urlencoded({ extended: true }));

// Use the router with the /api prefix
appServer.use('/api', router);
appServer.use(errorHandler);

appServer.all('*', (req, res) => {
    res.status(404).json({ message: 'Sorry! Page not found' });
});

DB.sequelize
    .authenticate()
    .then(() => {
        logger.info('Database connected successfully!');
        appServer.listen(port, () => {
            logger.info(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(error => {
        logger.error('Unable to connect to the database:', error);
    });
