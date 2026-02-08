export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface TransactionLog {
    id?: string;
    idempotency_key: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    status: TransactionStatus;
    reference: string;
    created_at: string | undefined;
    updated_at: string | undefined;
}
