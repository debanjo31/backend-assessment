import {
    getBalanceService,
    fundWalletService,
} from '../../../src/modules/wallet/wallet.service';
import { CustomError } from '../../../src/utils/custom-error';
import repo from '../../../src/modules/wallet/wallet.repo';

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

jest.mock('../../../src/modules/wallet/wallet.validator', () => ({
    validateFundWallet: jest.fn(() => ({ error: null })),
}));

const mockWallet = {
    id: 'wallet-uuid',
    user_id: 'user-uuid',
    balance: 5000,
};

beforeEach(() => {
    jest.clearAllMocks();
    (repo.findWalletByUserId as jest.Mock).mockResolvedValue({
        ...mockWallet,
    });
    (repo.updateBalance as jest.Mock).mockResolvedValue(undefined);
});

afterAll(async () => {
    jest.restoreAllMocks();
});

describe('getBalanceService', () => {
    it('should return wallet for an existing user', async () => {
        const result = await getBalanceService('user-uuid');

        expect(result.wallet).toEqual(mockWallet);
        expect(repo.findWalletByUserId).toHaveBeenCalledWith('user-uuid');
    });

    it('should throw 404 if wallet not found', async () => {
        (repo.findWalletByUserId as jest.Mock).mockResolvedValue(null);

        await expect(getBalanceService('no-wallet-user')).rejects.toThrow(
            new CustomError('Wallet not found', 404),
        );
    });
});

describe('fundWalletService', () => {
    it('should fund the wallet and return updated balance info', async () => {
        const result = await fundWalletService('user-uuid', { amount: 2000 });

        expect(result.previous_balance).toBe('5000.0000');
        expect(result.amount_funded).toBe('2000.0000');
        expect(result.new_balance).toBe('7000.0000');
        expect(repo.updateBalance).toHaveBeenCalled();
    });

    it('should handle decimal amounts precisely', async () => {
        (repo.findWalletByUserId as jest.Mock).mockResolvedValue({
            ...mockWallet,
            balance: 100.1234,
        });

        const result = await fundWalletService('user-uuid', {
            amount: 50.5678,
        });

        expect(result.previous_balance).toBe('100.1234');
        expect(result.amount_funded).toBe('50.5678');
        expect(result.new_balance).toBe('150.6912');
    });

    it('should throw 404 if wallet not found', async () => {
        (repo.findWalletByUserId as jest.Mock).mockResolvedValue(null);

        await expect(
            fundWalletService('user-uuid', { amount: 1000 }),
        ).rejects.toThrow(new CustomError('Wallet not found', 404));
    });

    it('should throw 400 for validation errors', async () => {
        const { validateFundWallet } = require('../../../src/modules/wallet/wallet.validator');
        validateFundWallet.mockReturnValue({
            error: { details: [{ message: 'Amount must be a positive number' }] },
        });

        await expect(
            fundWalletService('user-uuid', { amount: -100 }),
        ).rejects.toThrow(
            new CustomError('Amount must be a positive number', 400),
        );
    });
});
