import logger from '@/utils/logger';
import Sequelize from 'sequelize';
import userModel from './models/user.model';
import walletModel from './models/wallet.model';
import transactionLogModel from './models/transaction-log.model';
import ledgerModel from './models/ledger.model';
import loanModel from './models/loan.model';
import interestAccrualModel from './models/interest-accrual.model';
import {
    DB_DIALECT,
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USERNAME,
    NODE_ENV,
} from '@/config';

const sequelize = new Sequelize.Sequelize(
    DB_NAME as string,
    DB_USERNAME as string,
    DB_PASSWORD,
    {
        dialect: (DB_DIALECT as Sequelize.Dialect) || 'postgres',
        host: DB_HOST,
        port: parseInt(DB_PORT as string, 10),
        timezone: '+00:00',
        define: {
            underscored: true,
            freezeTableName: true,
        },
        pool: {
            min: 0,
            max: 5,
        },
        logQueryParameters: NODE_ENV === 'development',
        logging: (query, time) => {
            logger.info(time + 'ms' + ' ' + query);
        },
        benchmark: true,
    },
);

sequelize.authenticate();

export const DB = {
    Users: userModel(sequelize),
    Wallets: walletModel(sequelize),
    TransactionLogs: transactionLogModel(sequelize),
    Ledgers: ledgerModel(sequelize),
    Loans: loanModel(sequelize),
    InterestAccruals: interestAccrualModel(sequelize),
    sequelize,
    Sequelize,
};
