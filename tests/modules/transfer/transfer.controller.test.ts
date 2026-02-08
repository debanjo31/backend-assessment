import { Request, Response, NextFunction } from 'express';
import { transferController } from '../../../src/modules/transfer/transfer.controller';
import { transferService } from '../../../src/modules/transfer/transfer.service';

jest.mock('../../../src/modules/transfer/transfer.service', () => ({
    transferService: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('transferController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            body: {
                idempotency_key: 'key-1',
                receiver_id: 'receiver-uuid',
                amount: 1000,
            },
        } as Partial<Request>;
        // Set custom context property (added via Express type augmentation)
        (req as Record<string, unknown>).context = { userId: 'sender-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with transaction data on success', async () => {
        const mockResponse = {
            message: 'Transfer successful',
            transaction: {
                transaction_id: 'txn-id',
                amount: '1000.0000',
                status: 'COMPLETED',
            },
        };
        (transferService as jest.Mock).mockResolvedValue(mockResponse);

        await transferController(req as Request, res as Response, next);

        expect(transferService).toHaveBeenCalledWith('sender-uuid', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Transfer successful',
            data: mockResponse.transaction,
        });
    });

    it('should call next with error when service throws', async () => {
        const error = new Error('Insufficient funds');
        (transferService as jest.Mock).mockRejectedValue(error);

        await transferController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
