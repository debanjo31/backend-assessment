import { DB } from '@/database';
import { Loan } from '@/interfaces/loan.interfaces';
import { InterestAccrual } from '@/interfaces/interest-accrual.interfaces';
import { LoanCreationAttributes } from '@/database/models/loan.model';
import { InterestAccrualCreationAttributes } from '@/database/models/interest-accrual.model';
import { Transaction } from 'sequelize';

const repo = {
    createLoan: async (data: LoanCreationAttributes): Promise<Loan> => {
        return await DB.Loans.create(data);
    },

    findLoanById: async (id: string): Promise<Loan | null> => {
        return await DB.Loans.findByPk(id);
    },

    findLoansByUserId: async (userId: string): Promise<Loan[]> => {
        return await DB.Loans.findAll({ where: { user_id: userId } });
    },

    updateLoan: async (
        id: string,
        data: Partial<Loan>,
        transaction?: Transaction,
    ): Promise<void> => {
        await DB.Loans.update(data, {
            where: { id },
            ...(transaction ? { transaction } : {}),
        });
    },

    createInterestAccrual: async (
        data: InterestAccrualCreationAttributes,
        transaction?: Transaction,
    ): Promise<InterestAccrual> => {
        return await DB.InterestAccruals.create(data, {
            ...(transaction ? { transaction } : {}),
        });
    },

    findAccrualsByLoanId: async (
        loanId: string,
    ): Promise<InterestAccrual[]> => {
        return await DB.InterestAccruals.findAll({
            where: { loan_id: loanId },
            order: [['date', 'ASC']],
        });
    },

    findAccrualByLoanAndDate: async (
        loanId: string,
        date: string,
    ): Promise<InterestAccrual | null> => {
        return await DB.InterestAccruals.findOne({
            where: { loan_id: loanId, date },
        });
    },
};

export default repo;
