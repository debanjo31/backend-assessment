export type LoanStatus = 'ACTIVE' | 'CLOSED';

export interface Loan {
    id?: string;
    user_id: string;
    principal: number;
    annual_rate: number;
    accrued_interest: number;
    last_interest_date: string;
    status: LoanStatus;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}
