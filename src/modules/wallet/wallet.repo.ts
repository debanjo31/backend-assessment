import { DB } from '@/database';
import { Wallet } from '@/interfaces/wallet.interfaces';
import { Transaction } from 'sequelize';

const repo = {
    findWalletByUserId: async (
        userId: string,
        transaction?: Transaction,
    ): Promise<Wallet | null> => {
        return await DB.Wallets.findOne({
            where: { user_id: userId },
            ...(transaction
                ? { transaction, lock: transaction.LOCK.UPDATE }
                : {}),
        });
    },

    createWallet: async (
        userId: string,
        transaction?: Transaction,
    ): Promise<Wallet> => {
        return await DB.Wallets.create(
            { user_id: userId },
            { ...(transaction ? { transaction } : {}) },
        );
    },

    updateBalance: async (
        walletId: string,
        newBalance: number,
        transaction: Transaction,
    ): Promise<void> => {
        await DB.Wallets.update(
            { balance: newBalance },
            { where: { id: walletId }, transaction },
        );
    },

    // Find or create a wallet for a given user
    findOrCreateWallet: async (
        userId: string,
        transaction?: Transaction,
    ): Promise<Wallet> => {
        const [wallet] = await DB.Wallets.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId },
            ...(transaction
                ? { transaction, lock: transaction.LOCK.UPDATE }
                : {}),
        });
        return wallet;
    },
};

export default repo;
