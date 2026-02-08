import { Request, Response, NextFunction } from 'express';
import {
    getBalanceController,
    fundWalletController,
} from '../../../src/modules/wallet/wallet.controller';
import {
    getBalanceService,
    fundWalletService,
} from '../../../src/modules/wallet/wallet.service';

jest.mock('../../../src/modules/wallet/wallet.service', () => ({
    getBalanceService: jest.fn(),
    fundWalletService: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getBalanceController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {} as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with wallet data', async () => {
        const mockWallet = { id: 'wallet-uuid', balance: 5000 };
        (getBalanceService as jest.Mock).mockResolvedValue({
            wallet: mockWallet,
        });

        await getBalanceController(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Wallet retrieved successfully',
            data: mockWallet,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('DB error');
        (getBalanceService as jest.Mock).mockRejectedValue(error);

        await getBalanceController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('fundWalletController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            body: { amount: 1000 },
        } as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with fund result on success', async () => {
        const mockResult = {
            wallet_id: 'wallet-uuid',
            previous_balance: '5000.0000',
            amount_funded: '1000.0000',
            new_balance: '6000.0000',
        };
        (fundWalletService as jest.Mock).mockResolvedValue(mockResult);

        await fundWalletController(req as Request, res as Response, next);

        expect(fundWalletService).toHaveBeenCalledWith('user-uuid', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Wallet funded successfully',
            data: mockResult,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('Validation error');
        (fundWalletService as jest.Mock).mockRejectedValue(error);

        await fundWalletController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
