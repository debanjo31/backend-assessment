import { transferService } from '../../../src/modules/transfer/transfer.service';
import { CustomError } from '../../../src/utils/custom-error';
import transferRepo from '../../../src/modules/transfer/transfer.repo';
import walletRepo from '../../../src/modules/wallet/wallet.repo';

jest.mock('../../../src/modules/transfer/transfer.repo');
jest.mock('../../../src/modules/wallet/wallet.repo');
jest.mock('../../../src/database', () => ({
    DB: {
        sequelize: {
            transaction: jest.fn((cb: (t: object) => Promise<unknown>) =>
                cb({ LOCK: { UPDATE: 'UPDATE' } }),
            ),
            close: jest.fn(),
            authenticate: jest.fn(),
        },
    },
}));

jest.mock('../../../src/modules/transfer/transfer.validator', () => ({
    validateTransfer: jest.fn(() => ({ error: null })),
}));

const senderWallet = {
    id: 'sender-wallet-id',
    user_id: 'sender-uuid',
    balance: 5000,
};

const receiverWallet = {
    id: 'receiver-wallet-id',
    user_id: 'receiver-uuid',
    balance: 1000,
};

beforeEach(() => {
    jest.clearAllMocks();

    (transferRepo.findByIdempotencyKey as jest.Mock).mockResolvedValue(null);
    (transferRepo.createTransactionLog as jest.Mock).mockResolvedValue({
        id: 'txn-log-id',
        status: 'PENDING',
    });
    (transferRepo.updateTransactionLogStatus as jest.Mock).mockResolvedValue(
        undefined,
    );
    (transferRepo.createLedgerEntry as jest.Mock).mockResolvedValue(undefined);

    (walletRepo.findWalletByUserId as jest.Mock).mockImplementation(
        (userId: string) => {
            if (userId === 'sender-uuid')
                return Promise.resolve({ ...senderWallet });
            if (userId === 'receiver-uuid')
                return Promise.resolve({ ...receiverWallet });
            return Promise.resolve(null);
        },
    );
    (walletRepo.updateBalance as jest.Mock).mockResolvedValue(undefined);
});

afterAll(async () => {
    jest.restoreAllMocks();
});

describe('transferService', () => {
    const validBody = {
        idempotency_key: 'unique-key-1',
        receiver_id: 'receiver-uuid',
        amount: 1000,
    };

    it('should complete a successful transfer', async () => {
        const result = await transferService('sender-uuid', validBody);

        expect(result.message).toBe('Transfer successful');
        expect(result.transaction.status).toBe('COMPLETED');
        expect(result.transaction.amount).toBe('1000.0000');
        expect((result.transaction as Record<string, unknown>).sender_new_balance).toBe('4000.0000');

        // Verify wallet updates
        expect(walletRepo.updateBalance).toHaveBeenCalledTimes(2);

        // Verify double-entry ledger (DEBIT + CREDIT)
        expect(transferRepo.createLedgerEntry).toHaveBeenCalledTimes(2);

        // Verify DEBIT entry
        expect(transferRepo.createLedgerEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                entry_type: 'DEBIT',
                amount: 1000,
                balance_before: 5000,
                balance_after: 4000,
            }),
            expect.anything(),
        );

        // Verify CREDIT entry
        expect(transferRepo.createLedgerEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                entry_type: 'CREDIT',
                amount: 1000,
                balance_before: 1000,
                balance_after: 2000,
            }),
            expect.anything(),
        );

        // Verify transaction log marked as COMPLETED
        expect(transferRepo.updateTransactionLogStatus).toHaveBeenCalledWith(
            'txn-log-id',
            'COMPLETED',
            expect.anything(),
        );
    });

    it('should throw 402 if sender has insufficient funds', async () => {
        (walletRepo.findWalletByUserId as jest.Mock).mockImplementation(
            (userId: string) => {
                if (userId === 'sender-uuid')
                    return Promise.resolve({
                        ...senderWallet,
                        balance: 500, // not enough
                    });
                return Promise.resolve({ ...receiverWallet });
            },
        );

        await expect(
            transferService('sender-uuid', {
                ...validBody,
                amount: 1000,
            }),
        ).rejects.toThrow(new CustomError('Insufficient funds', 402));

        // Transaction log should be marked as FAILED
        expect(transferRepo.updateTransactionLogStatus).toHaveBeenCalledWith(
            'txn-log-id',
            'FAILED',
        );
    });

    it('should throw 400 if sender transfers to themselves', async () => {
        await expect(
            transferService('sender-uuid', {
                ...validBody,
                receiver_id: 'sender-uuid',
            }),
        ).rejects.toThrow(
            new CustomError('Cannot transfer to yourself', 400),
        );
    });

    it('should return existing result for duplicate idempotency key (COMPLETED)', async () => {
        const existingLog = {
            id: 'existing-txn-id',
            idempotency_key: 'unique-key-1',
            status: 'COMPLETED',
            amount: 1000,
        };
        (transferRepo.findByIdempotencyKey as jest.Mock).mockResolvedValue(
            existingLog,
        );

        const result = await transferService('sender-uuid', validBody);

        expect(result.message).toBe('Transfer already processed');
        expect(result.transaction).toEqual(existingLog);

        // Should NOT create a new transaction log or update wallets
        expect(transferRepo.createTransactionLog).not.toHaveBeenCalled();
        expect(walletRepo.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw 409 for duplicate idempotency key (PENDING)', async () => {
        (transferRepo.findByIdempotencyKey as jest.Mock).mockResolvedValue({
            id: 'existing-txn-id',
            status: 'PENDING',
        });

        await expect(
            transferService('sender-uuid', validBody),
        ).rejects.toThrow(
            new CustomError('Transfer is already being processed', 409),
        );
    });

    it('should throw 409 for duplicate idempotency key (FAILED)', async () => {
        (transferRepo.findByIdempotencyKey as jest.Mock).mockResolvedValue({
            id: 'existing-txn-id',
            status: 'FAILED',
        });

        await expect(
            transferService('sender-uuid', validBody),
        ).rejects.toThrow(CustomError);
    });

    it('should create TransactionLog with PENDING status before main transaction', async () => {
        await transferService('sender-uuid', validBody);

        // createTransactionLog should be called BEFORE the db transaction
        expect(transferRepo.createTransactionLog).toHaveBeenCalledWith(
            expect.objectContaining({
                idempotency_key: 'unique-key-1',
                sender_id: 'sender-uuid',
                receiver_id: 'receiver-uuid',
                amount: 1000,
            }),
        );
    });

    it('should handle exact balance transfer (drains sender wallet to zero)', async () => {
        const result = await transferService('sender-uuid', {
            ...validBody,
            amount: 5000, // exact sender balance
        });

        expect(result.message).toBe('Transfer successful');
        expect((result.transaction as Record<string, unknown>).sender_new_balance).toBe('0.0000');
    });
});
