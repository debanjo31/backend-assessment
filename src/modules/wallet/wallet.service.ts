import { CustomError } from '@/utils/custom-error';
import { validateFundWallet } from './wallet.validator';
import repo from './wallet.repo';
import { DB } from '@/database';
import Decimal from 'decimal.js';

// Get wallet balance for authenticated user
export const getBalanceService = async (userId: string) => {
    const wallet = await repo.findWalletByUserId(userId);
    if (!wallet) {
        throw new CustomError('Wallet not found', 404);
    }
    return { wallet };
};

// Fund a wallet (add money) — used for testing transfers
export const fundWalletService = async (
    userId: string,
    body: { amount: number },
) => {
    const { error } = validateFundWallet(body);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const result = await DB.sequelize.transaction(async t => {
        const wallet = await repo.findWalletByUserId(userId, t);
        if (!wallet) {
            throw new CustomError('Wallet not found', 404);
        }

        const currentBalance = new Decimal(wallet.balance);
        const fundAmount = new Decimal(body.amount);
        const newBalance = currentBalance.plus(fundAmount);

        await repo.updateBalance(wallet.id as string, newBalance.toNumber(), t);

        return {
            wallet_id: wallet.id,
            previous_balance: currentBalance.toFixed(4),
            amount_funded: fundAmount.toFixed(4),
            new_balance: newBalance.toFixed(4),
        };
    });

    return result;
};
