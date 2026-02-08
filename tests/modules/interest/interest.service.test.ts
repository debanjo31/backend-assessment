import Decimal from 'decimal.js';
import {
    isLeapYear,
    daysInYear,
    calculateDailyInterest,
    createLoanService,
    accrueInterestService,
    getLoanService,
    getAccrualsService,
} from '../../../src/modules/interest/interest.service';
import { CustomError } from '../../../src/utils/custom-error';
import repo from '../../../src/modules/interest/interest.repo';

jest.mock('../../../src/modules/interest/interest.repo');
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

jest.mock('../../../src/modules/interest/interest.validator', () => ({
    validateCreateLoan: jest.fn(() => ({
        error: null,
        value: {
            principal: 100000,
            annual_rate: 27.5,
            start_date: '2025-01-01',
        },
    })),
    // Pass through the actual input so date-based tests work correctly
    validateAccrueInterest: jest.fn((data: { end_date: string }) => ({
        error: null,
        value: { end_date: data.end_date },
    })),
}));

afterAll(async () => {
    jest.restoreAllMocks();
});

// ─── Pure Math Tests (no mocks needed) ───────────────────────────────────────

describe('isLeapYear', () => {
    it('should return true for a year divisible by 4 but not 100', () => {
        expect(isLeapYear(2024)).toBe(true);
        expect(isLeapYear(2028)).toBe(true);
    });

    it('should return false for a year divisible by 100 but not 400', () => {
        expect(isLeapYear(1900)).toBe(false);
        expect(isLeapYear(2100)).toBe(false);
    });

    it('should return true for a year divisible by 400', () => {
        expect(isLeapYear(2000)).toBe(true);
        expect(isLeapYear(2400)).toBe(true);
    });

    it('should return false for a common non-leap year', () => {
        expect(isLeapYear(2023)).toBe(false);
        expect(isLeapYear(2025)).toBe(false);
    });
});

describe('daysInYear', () => {
    it('should return 365 for a non-leap year', () => {
        expect(daysInYear('2025-06-15')).toBe(365);
        expect(daysInYear('2023-01-01')).toBe(365);
    });

    it('should return 366 for a leap year', () => {
        expect(daysInYear('2024-02-29')).toBe(366);
        expect(daysInYear('2000-07-04')).toBe(366);
    });

    it('should return 365 for century years that are not leap years', () => {
        expect(daysInYear('1900-03-01')).toBe(365);
        expect(daysInYear('2100-12-31')).toBe(365);
    });
});

describe('calculateDailyInterest', () => {
    const principal = new Decimal(100000);
    const annualRate = new Decimal(27.5);

    it('should calculate correct daily rate for a non-leap year (365 days)', () => {
        const { dailyRate, interest } = calculateDailyInterest(
            principal,
            annualRate,
            '2025-06-15',
        );

        // daily_rate = 27.5 / 365
        const expectedDailyRate = new Decimal(27.5).dividedBy(365);
        expect(dailyRate.toFixed(10)).toBe(expectedDailyRate.toFixed(10));

        // interest = 100000 * 27.5 / 100 / 365
        const expectedInterest = new Decimal(100000)
            .times(27.5)
            .dividedBy(100)
            .dividedBy(365);
        expect(interest.toFixed(4)).toBe(expectedInterest.toFixed(4));
    });

    it('should calculate correct daily rate for a leap year (366 days)', () => {
        const { dailyRate, interest } = calculateDailyInterest(
            principal,
            annualRate,
            '2024-02-29',
        );

        // daily_rate = 27.5 / 366
        const expectedDailyRate = new Decimal(27.5).dividedBy(366);
        expect(dailyRate.toFixed(10)).toBe(expectedDailyRate.toFixed(10));

        // interest = 100000 * 27.5 / 100 / 366
        const expectedInterest = new Decimal(100000)
            .times(27.5)
            .dividedBy(100)
            .dividedBy(366);
        expect(interest.toFixed(4)).toBe(expectedInterest.toFixed(4));
    });

    it('should return zero interest for zero principal', () => {
        const { interest } = calculateDailyInterest(
            new Decimal(0),
            annualRate,
            '2025-01-01',
        );
        expect(interest.toNumber()).toBe(0);
    });

    it('should handle very large principals without precision loss', () => {
        const largePrincipal = new Decimal('9999999999.9999');
        const { interest } = calculateDailyInterest(
            largePrincipal,
            annualRate,
            '2025-01-01',
        );

        const expected = largePrincipal
            .times(27.5)
            .dividedBy(100)
            .dividedBy(365);
        expect(interest.toFixed(4)).toBe(expected.toFixed(4));
    });

    it('should maintain precision — no floating-point drift over 365 days', () => {
        // Sum daily interest for a full non-leap year
        // and compare against the exact annual interest
        let totalInterest = new Decimal(0);

        for (let day = 1; day <= 365; day++) {
            const month = String(Math.ceil(day / 30.44)).padStart(2, '0');
            const { interest } = calculateDailyInterest(
                principal,
                annualRate,
                '2025-01-15', // same non-leap year for consistency
            );
            totalInterest = totalInterest.plus(interest);
        }

        // Annual interest should be exactly principal * rate / 100
        const annualInterest = principal.times(annualRate).dividedBy(100);

        // With Decimal.js there should be ZERO drift
        expect(totalInterest.toFixed(4)).toBe(annualInterest.toFixed(4));
    });

    it('should maintain precision — no floating-point drift over 366 days (leap year)', () => {
        let totalInterest = new Decimal(0);

        for (let day = 1; day <= 366; day++) {
            const { interest } = calculateDailyInterest(
                principal,
                annualRate,
                '2024-06-15', // leap year
            );
            totalInterest = totalInterest.plus(interest);
        }

        const annualInterest = principal.times(annualRate).dividedBy(100);
        expect(totalInterest.toFixed(4)).toBe(annualInterest.toFixed(4));
    });

    it('should use 366 days for Feb 29 in a leap year', () => {
        const { dailyRate } = calculateDailyInterest(
            principal,
            annualRate,
            '2024-02-29',
        );
        const expectedRate = new Decimal(27.5).dividedBy(366);
        expect(dailyRate.toFixed(10)).toBe(expectedRate.toFixed(10));
    });

    it('should handle year boundary correctly (Dec 31 non-leap → Jan 1 non-leap)', () => {
        const dec31 = calculateDailyInterest(principal, annualRate, '2025-12-31');
        const jan1 = calculateDailyInterest(principal, annualRate, '2026-01-01');

        // Both 2025 and 2026 are non-leap years, so rates should be equal
        expect(dec31.dailyRate.toFixed(10)).toBe(jan1.dailyRate.toFixed(10));
    });

    it('should handle year boundary correctly (Dec 31 non-leap → Jan 1 leap)', () => {
        const dec31 = calculateDailyInterest(principal, annualRate, '2023-12-31');
        const jan1 = calculateDailyInterest(principal, annualRate, '2024-01-01');

        // 2023 has 365 days, 2024 has 366 — rates differ
        expect(dec31.dailyRate.toFixed(10)).not.toBe(jan1.dailyRate.toFixed(10));
        expect(dec31.interest.greaterThan(jan1.interest)).toBe(true);
    });

    it('should prove Decimal.js avoids IEEE 754 errors', () => {
        // Classic floating-point failure: 0.1 + 0.2 !== 0.3
        const a = new Decimal(0.1);
        const b = new Decimal(0.2);
        expect(a.plus(b).toNumber()).toBe(0.3);

        // Our interest calculation should not suffer from this
        const smallPrincipal = new Decimal('0.01');
        const { interest } = calculateDailyInterest(
            smallPrincipal,
            annualRate,
            '2025-01-01',
        );
        // Verify it's a clean Decimal, not an IEEE 754 artifact
        expect(interest.isFinite()).toBe(true);
        expect(interest.greaterThan(0)).toBe(true);
    });
});

// ─── Service Tests (mocked DB) ──────────────────────────────────────────────

describe('createLoanService', () => {
    it('should create a loan and return it', async () => {
        const mockLoan = {
            id: 'loan-uuid',
            user_id: 'user-uuid',
            principal: 100000,
            annual_rate: 27.5,
            accrued_interest: 0,
            last_interest_date: '2025-01-01',
            status: 'ACTIVE',
        };
        (repo.createLoan as jest.Mock).mockResolvedValue(mockLoan);

        const result = await createLoanService('user-uuid', {
            principal: 100000,
            annual_rate: 27.5,
            start_date: '2025-01-01',
        });

        expect(result.loan).toEqual(mockLoan);
        expect(repo.createLoan).toHaveBeenCalled();
    });
});

describe('getLoanService', () => {
    it('should return the loan if found and owned by user', async () => {
        const mockLoan = {
            id: 'loan-uuid',
            user_id: 'user-uuid',
            principal: 100000,
        };
        (repo.findLoanById as jest.Mock).mockResolvedValue(mockLoan);

        const result = await getLoanService('loan-uuid', 'user-uuid');
        expect(result.loan).toEqual(mockLoan);
    });

    it('should throw 404 if loan not found', async () => {
        (repo.findLoanById as jest.Mock).mockResolvedValue(null);

        await expect(
            getLoanService('bad-uuid', 'user-uuid'),
        ).rejects.toThrow(new CustomError('Loan not found', 404));
    });

    it('should throw 403 if user does not own the loan', async () => {
        (repo.findLoanById as jest.Mock).mockResolvedValue({
            id: 'loan-uuid',
            user_id: 'other-user',
        });

        await expect(
            getLoanService('loan-uuid', 'user-uuid'),
        ).rejects.toThrow(new CustomError('Unauthorized access to this loan', 403));
    });
});

describe('accrueInterestService', () => {
    const mockLoan = {
        id: 'loan-uuid',
        user_id: 'user-uuid',
        principal: 100000,
        annual_rate: 27.5,
        accrued_interest: 0,
        last_interest_date: '2025-01-01',
        status: 'ACTIVE',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (repo.findLoanById as jest.Mock).mockResolvedValue(mockLoan);
        (repo.createInterestAccrual as jest.Mock).mockResolvedValue({});
        (repo.updateLoan as jest.Mock).mockResolvedValue(undefined);
    });

    it('should accrue interest for multiple days and update the loan', async () => {
        const result = await accrueInterestService(
            'loan-uuid',
            'user-uuid',
            { end_date: '2025-01-03' },
        );

        expect(result.days_processed).toBe(2); // Jan 2 and Jan 3
        expect(result.last_interest_date).toBe('2025-01-03');
        expect(repo.createInterestAccrual).toHaveBeenCalledTimes(2);
        expect(repo.updateLoan).toHaveBeenCalledTimes(1);

        // Verify total interest is correct
        const expectedDaily = new Decimal(100000)
            .times(27.5)
            .dividedBy(100)
            .dividedBy(365);
        const expectedTotal = expectedDaily.times(2);
        expect(result.total_interest_accrued).toBe(expectedTotal.toFixed(4));
    });

    it('should throw 404 if loan not found', async () => {
        (repo.findLoanById as jest.Mock).mockResolvedValue(null);

        await expect(
            accrueInterestService('bad-uuid', 'user-uuid', {
                end_date: '2025-01-03',
            }),
        ).rejects.toThrow(new CustomError('Loan not found', 404));
    });

    it('should throw 400 if loan is closed', async () => {
        (repo.findLoanById as jest.Mock).mockResolvedValue({
            ...mockLoan,
            status: 'CLOSED',
        });

        await expect(
            accrueInterestService('loan-uuid', 'user-uuid', {
                end_date: '2025-01-03',
            }),
        ).rejects.toThrow(
            new CustomError('Cannot accrue interest on a closed loan', 400),
        );
    });

    it('should throw 400 if end_date is before last_interest_date', async () => {
        await expect(
            accrueInterestService('loan-uuid', 'user-uuid', {
                end_date: '2024-12-31',
            }),
        ).rejects.toThrow(CustomError);
    });
});

describe('getAccrualsService', () => {
    it('should return accruals for a loan', async () => {
        const mockLoan = { id: 'loan-uuid', user_id: 'user-uuid' };
        const mockAccruals = [
            { date: '2025-01-02', interest: 75.3425 },
            { date: '2025-01-03', interest: 75.3425 },
        ];
        (repo.findLoanById as jest.Mock).mockResolvedValue(mockLoan);
        (repo.findAccrualsByLoanId as jest.Mock).mockResolvedValue(mockAccruals);

        const result = await getAccrualsService('loan-uuid', 'user-uuid');
        expect(result.accruals).toEqual(mockAccruals);
    });
});
