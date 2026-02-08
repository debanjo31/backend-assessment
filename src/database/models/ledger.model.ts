import { Ledger, EntryType } from '@/interfaces/ledger.interfaces';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type LedgerCreationAttributes = Optional<Ledger, 'id' | 'created_at'>;

export class LedgerModel
    extends Model<Ledger, LedgerCreationAttributes>
    implements Ledger
{
    public id!: string;
    public wallet_id!: string;
    public transaction_log_id!: string;
    public entry_type!: EntryType;
    public amount!: number;
    public balance_before!: number;
    public balance_after!: number;
    public created_at: string | undefined;
}

export default function (sequelize: Sequelize): typeof LedgerModel {
    LedgerModel.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUIDV4,
                defaultValue: DataTypes.UUIDV4,
            },
            wallet_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'wallets',
                    key: 'id',
                },
            },
            transaction_log_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'transaction_logs',
                    key: 'id',
                },
            },
            entry_type: {
                allowNull: false,
                type: DataTypes.ENUM('CREDIT', 'DEBIT'),
            },
            amount: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            balance_before: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            balance_after: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            created_at: DataTypes.DATE,
        },
        {
            tableName: 'ledgers',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
        },
    );

    return LedgerModel;
}
