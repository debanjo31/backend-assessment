export type EntryType = 'CREDIT' | 'DEBIT';

export interface Ledger {
    id?: string;
    wallet_id: string;
    transaction_log_id: string;
    entry_type: EntryType;
    amount: number;
    balance_before: number;
    balance_after: number;
    created_at?: string | undefined;
}
