import { DB } from '@/database';
import { TransactionLog } from '@/interfaces/transaction-log.interfaces';
import { LedgerCreationAttributes } from '@/database/models/ledger.model';
import { Transaction } from 'sequelize';

const repo = {
    findByIdempotencyKey: async (
        idempotencyKey: string,
    ): Promise<TransactionLog | null> => {
        return await DB.TransactionLogs.findOne({
            where: { idempotency_key: idempotencyKey },
        });
    },

    createTransactionLog: async (
        data: {
            idempotency_key: string;
            sender_id: string;
            receiver_id: string;
            amount: number;
            reference: string;
        },
        transaction?: Transaction,
    ): Promise<TransactionLog> => {
        return await DB.TransactionLogs.create(
            { ...data, status: 'PENDING' },
            { ...(transaction ? { transaction } : {}) },
        );
    },

    updateTransactionLogStatus: async (
        id: string,
        status: 'COMPLETED' | 'FAILED',
        transaction?: Transaction,
    ): Promise<void> => {
        await DB.TransactionLogs.update(
            { status },
            { where: { id }, ...(transaction ? { transaction } : {}) },
        );
    },

    createLedgerEntry: async (
        data: LedgerCreationAttributes,
        transaction: Transaction,
    ): Promise<void> => {
        await DB.Ledgers.create(data, { transaction });
    },
};

export default repo;
