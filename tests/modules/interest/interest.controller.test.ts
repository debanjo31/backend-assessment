import { Request, Response, NextFunction } from 'express';
import {
    createLoanController,
    getLoanController,
    accrueInterestController,
    getAccrualsController,
} from '../../../src/modules/interest/interest.controller';
import {
    createLoanService,
    getLoanService,
    accrueInterestService,
    getAccrualsService,
} from '../../../src/modules/interest/interest.service';

jest.mock('../../../src/modules/interest/interest.service', () => ({
    createLoanService: jest.fn(),
    getLoanService: jest.fn(),
    accrueInterestService: jest.fn(),
    getAccrualsService: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createLoanController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            body: { principal: 100000, start_date: '2025-01-01' },
        } as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 201 with loan data on success', async () => {
        const mockLoan = { id: 'loan-uuid', principal: 100000 };
        (createLoanService as jest.Mock).mockResolvedValue({
            loan: mockLoan,
        });

        await createLoanController(req as Request, res as Response, next);

        expect(createLoanService).toHaveBeenCalledWith('user-uuid', req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Loan created successfully',
            data: mockLoan,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('Validation error');
        (createLoanService as jest.Mock).mockRejectedValue(error);

        await createLoanController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('getLoanController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            params: { id: 'loan-uuid' },
        } as unknown as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with loan data on success', async () => {
        const mockLoan = { id: 'loan-uuid', principal: 100000 };
        (getLoanService as jest.Mock).mockResolvedValue({ loan: mockLoan });

        await getLoanController(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Loan retrieved successfully',
            data: mockLoan,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('Not found');
        (getLoanService as jest.Mock).mockRejectedValue(error);

        await getLoanController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('accrueInterestController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            params: { id: 'loan-uuid' },
            body: { end_date: '2025-01-31' },
        } as unknown as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with accrual data on success', async () => {
        const mockResult = {
            days_processed: 30,
            total_interest_accrued: '2260.2740',
        };
        (accrueInterestService as jest.Mock).mockResolvedValue(mockResult);

        await accrueInterestController(
            req as Request,
            res as Response,
            next,
        );

        expect(accrueInterestService).toHaveBeenCalledWith(
            'loan-uuid',
            'user-uuid',
            req.body,
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Interest accrued successfully',
            data: mockResult,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('Loan not found');
        (accrueInterestService as jest.Mock).mockRejectedValue(error);

        await accrueInterestController(
            req as Request,
            res as Response,
            next,
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('getAccrualsController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            params: { id: 'loan-uuid' },
        } as unknown as Partial<Request>;
        (req as Record<string, unknown>).context = { userId: 'user-uuid' };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 with accrual records on success', async () => {
        const mockResult = {
            loan: { id: 'loan-uuid' },
            accruals: [{ date: '2025-01-02', interest: 75.3425 }],
        };
        (getAccrualsService as jest.Mock).mockResolvedValue(mockResult);

        await getAccrualsController(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Accruals retrieved successfully',
            data: mockResult,
        });
    });

    it('should call next with error on failure', async () => {
        const error = new Error('Unauthorized');
        (getAccrualsService as jest.Mock).mockRejectedValue(error);

        await getAccrualsController(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
