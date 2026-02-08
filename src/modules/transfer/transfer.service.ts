import { CustomError } from '@/utils/custom-error';
import { validateTransfer } from './transfer.validator';
import transferRepo from './transfer.repo';
import walletRepo from '../wallet/wallet.repo';
import { DB } from '@/database';
import Decimal from 'decimal.js';

interface TransferInput {
    idempotency_key: string;
    receiver_id: string;
    amount: number;
}

export const transferService = async (
    senderId: string,
    body: TransferInput,
) => {
    // 1. Validate input
    const { error } = validateTransfer(body);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const { idempotency_key, receiver_id, amount } = body;

    // 2. Prevent self-transfer
    if (senderId === receiver_id) {
        throw new CustomError('Cannot transfer to yourself', 400);
    }

    // 3. Check idempotency — if this key was already used, return existing result
    const existingLog = await transferRepo.findByIdempotencyKey(
        idempotency_key,
    );
    if (existingLog) {
        if (existingLog.status === 'COMPLETED') {
            return {
                message: 'Transfer already processed',
                transaction: existingLog,
            };
        }
        if (existingLog.status === 'PENDING') {
            throw new CustomError('Transfer is already being processed', 409);
        }
        // If FAILED, allow retry by continuing below with a new key
        // (the unique constraint on the old key means we can't reuse it,
        //  so the client should send a new idempotency_key for retry)
        throw new CustomError(
            'Previous transfer with this key failed. Please use a new idempotency key to retry.',
            409,
        );
    }

    // 4. Create TransactionLog with PENDING status BEFORE the main transaction
    const reference = `TXN-${Date.now().toString(36).toUpperCase()}`;
    const transactionLog = await transferRepo.createTransactionLog({
        idempotency_key,
        sender_id: senderId,
        receiver_id,
        amount,
        reference,
    });

    // 5. Execute the transfer inside a Sequelize managed transaction
    try {
        const result = await DB.sequelize.transaction(async t => {
            // Lock both wallets with SELECT FOR UPDATE to prevent race conditions
            // Always lock in deterministic order (by user_id) to avoid deadlocks
            const [firstId, secondId] =
                senderId < receiver_id
                    ? [senderId, receiver_id]
                    : [receiver_id, senderId];

            const firstWallet = await walletRepo.findWalletByUserId(firstId, t);
            const secondWallet = await walletRepo.findWalletByUserId(
                secondId,
                t,
            );

            if (!firstWallet || !secondWallet) {
                throw new CustomError('Wallet not found for one or both users', 404);
            }

            const senderWallet =
                firstWallet.user_id === senderId ? firstWallet : secondWallet;
            const receiverWallet =
                firstWallet.user_id === receiver_id
                    ? firstWallet
                    : secondWallet;

            // Check sufficient balance using Decimal.js for precision
            const senderBalance = new Decimal(senderWallet.balance);
            const transferAmount = new Decimal(amount);

            if (senderBalance.lessThan(transferAmount)) {
                throw new CustomError('Insufficient funds', 402);
            }

            // Calculate new balances
            const newSenderBalance = senderBalance.minus(transferAmount);
            const receiverBalance = new Decimal(receiverWallet.balance);
            const newReceiverBalance = receiverBalance.plus(transferAmount);

            // Update wallet balances
            await walletRepo.updateBalance(
                senderWallet.id as string,
                newSenderBalance.toNumber(),
                t,
            );
            await walletRepo.updateBalance(
                receiverWallet.id as string,
                newReceiverBalance.toNumber(),
                t,
            );

            // Create double-entry ledger records
            await transferRepo.createLedgerEntry(
                {
                    wallet_id: senderWallet.id as string,
                    transaction_log_id: transactionLog.id as string,
                    entry_type: 'DEBIT',
                    amount: transferAmount.toNumber(),
                    balance_before: senderBalance.toNumber(),
                    balance_after: newSenderBalance.toNumber(),
                },
                t,
            );

            await transferRepo.createLedgerEntry(
                {
                    wallet_id: receiverWallet.id as string,
                    transaction_log_id: transactionLog.id as string,
                    entry_type: 'CREDIT',
                    amount: transferAmount.toNumber(),
                    balance_before: receiverBalance.toNumber(),
                    balance_after: newReceiverBalance.toNumber(),
                },
                t,
            );

            // Mark transaction as COMPLETED
            await transferRepo.updateTransactionLogStatus(
                transactionLog.id as string,
                'COMPLETED',
                t,
            );

            return {
                transaction_id: transactionLog.id,
                reference,
                sender_id: senderId,
                receiver_id,
                amount: transferAmount.toFixed(4),
                sender_new_balance: newSenderBalance.toFixed(4),
                status: 'COMPLETED',
            };
        });

        return { message: 'Transfer successful', transaction: result };
    } catch (err) {
        // Mark transaction as FAILED if it wasn't a validation error
        // (validation errors are thrown before the DB transaction)
        try {
            await transferRepo.updateTransactionLogStatus(
                transactionLog.id as string,
                'FAILED',
            );
        } catch {
            // If we can't update the status, the PENDING record stays
            // which is safe — it prevents duplicate processing
        }
        throw err;
    }
};
