export interface InterestAccrual {
    id?: string;
    loan_id: string;
    date: string;
    daily_rate: number;
    principal: number;
    interest: number;
    created_at?: string | undefined;
}
