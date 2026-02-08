import { CustomError } from '@/utils/custom-error';
import {
    validateCreateLoan,
    validateAccrueInterest,
} from './interest.validator';
import repo from './interest.repo';
import { DB } from '@/database';
import Decimal from 'decimal.js';

// Configure Decimal.js for high precision financial calculations
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

/**
 * Determines whether a given year is a leap year.
 * A year is a leap year if divisible by 4, NOT by 100, UNLESS also by 400.
 */
export const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Returns the number of days in the year that contains the given date.
 */
export const daysInYear = (date: string): number => {
    const year = new Date(date).getFullYear();
    return isLeapYear(year) ? 366 : 365;
};

/**
 * Calculates the daily interest for a given principal, annual rate, and date.
 * Uses Decimal.js for precision — no floating-point errors.
 *
 * Formula: daily_interest = principal * (annual_rate / 100) / days_in_year
 */
export const calculateDailyInterest = (
    principal: Decimal,
    annualRate: Decimal,
    date: string,
): { dailyRate: Decimal; interest: Decimal } => {
    const days = new Decimal(daysInYear(date));
    const dailyRate = annualRate.dividedBy(days);
    const interest = principal
        .times(annualRate)
        .dividedBy(new Decimal(100))
        .dividedBy(days);

    return { dailyRate, interest };
};

/**
 * Adds one day to a YYYY-MM-DD date string.
 */
const addOneDay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().split('T')[0];
};

// Create a new loan
export const createLoanService = async (
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
) => {
    const { error, value } = validateCreateLoan(body);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const loan = await repo.createLoan({
        user_id: userId,
        principal: value.principal,
        annual_rate: value.annual_rate,
        last_interest_date: value.start_date,
    });

    return { loan };
};

// Get loan details by ID
export const getLoanService = async (loanId: string, userId: string) => {
    const loan = await repo.findLoanById(loanId);
    if (!loan) {
        throw new CustomError('Loan not found', 404);
    }
    if (loan.user_id !== userId) {
        throw new CustomError('Unauthorized access to this loan', 403);
    }
    return { loan };
};

/**
 * Accrue daily interest for a loan up to the specified end_date.
 * Calculates interest for each day from (last_interest_date + 1) through end_date.
 * Each day's accrual is logged individually for full auditability.
 */
export const accrueInterestService = async (
    loanId: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
) => {
    const { error, value } = validateAccrueInterest(body);
    if (error) {
        throw new CustomError(error.details[0].message, 400);
    }

    const loan = await repo.findLoanById(loanId);
    if (!loan) {
        throw new CustomError('Loan not found', 404);
    }
    if (loan.user_id !== userId) {
        throw new CustomError('Unauthorized access to this loan', 403);
    }
    if (loan.status !== 'ACTIVE') {
        throw new CustomError('Cannot accrue interest on a closed loan', 400);
    }

    const endDate = value.end_date;
    const startDate = addOneDay(loan.last_interest_date);

    if (startDate > endDate) {
        throw new CustomError(
            `Interest already accrued up to ${loan.last_interest_date}. ` +
                `End date must be after ${loan.last_interest_date}.`,
            400,
        );
    }

    // Process all days inside a single transaction for atomicity
    const result = await DB.sequelize.transaction(async t => {
        let currentDate = startDate;
        let totalInterest = new Decimal(0);
        const principal = new Decimal(loan.principal);
        const annualRate = new Decimal(loan.annual_rate);
        const accruals: Array<{
            date: string;
            daily_rate: string;
            interest: string;
        }> = [];

        while (currentDate <= endDate) {
            const { dailyRate, interest } = calculateDailyInterest(
                principal,
                annualRate,
                currentDate,
            );

            await repo.createInterestAccrual(
                {
                    loan_id: loanId,
                    date: currentDate,
                    daily_rate: dailyRate.toNumber(),
                    principal: principal.toNumber(),
                    interest: interest.toNumber(),
                },
                t,
            );

            accruals.push({
                date: currentDate,
                daily_rate: dailyRate.toFixed(10),
                interest: interest.toFixed(4),
            });

            totalInterest = totalInterest.plus(interest);
            currentDate = addOneDay(currentDate);
        }

        // Update loan with new accrued interest total and last_interest_date
        const newAccruedInterest = new Decimal(loan.accrued_interest).plus(
            totalInterest,
        );

        await repo.updateLoan(
            loanId,
            {
                accrued_interest: newAccruedInterest.toNumber(),
                last_interest_date: endDate,
            },
            t,
        );

        return {
            loan_id: loanId,
            days_processed: accruals.length,
            total_interest_accrued: totalInterest.toFixed(4),
            new_total_accrued_interest: newAccruedInterest.toFixed(4),
            last_interest_date: endDate,
            accruals,
        };
    });

    return result;
};

// Get all accrual records for a loan
export const getAccrualsService = async (loanId: string, userId: string) => {
    const loan = await repo.findLoanById(loanId);
    if (!loan) {
        throw new CustomError('Loan not found', 404);
    }
    if (loan.user_id !== userId) {
        throw new CustomError('Unauthorized access to this loan', 403);
    }

    const accruals = await repo.findAccrualsByLoanId(loanId);
    return { loan, accruals };
};
