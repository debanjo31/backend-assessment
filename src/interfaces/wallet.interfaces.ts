export interface Wallet {
    id?: string;
    user_id: string;
    balance: number;
    created_at: string | undefined;
    updated_at: string | undefined;
}
