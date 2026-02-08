import {
    TransactionLog,
    TransactionStatus,
} from '@/interfaces/transaction-log.interfaces';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type TransactionLogCreationAttributes = Optional<
    TransactionLog,
    'id' | 'status' | 'reference'
>;

export class TransactionLogModel
    extends Model<TransactionLog, TransactionLogCreationAttributes>
    implements TransactionLog
{
    public id!: string;
    public idempotency_key!: string;
    public sender_id!: string;
    public receiver_id!: string;
    public amount!: number;
    public status!: TransactionStatus;
    public reference!: string;
    public created_at: string | undefined;
    public updated_at: string | undefined;
}

export default function (sequelize: Sequelize): typeof TransactionLogModel {
    TransactionLogModel.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUIDV4,
                defaultValue: DataTypes.UUIDV4,
            },
            idempotency_key: {
                allowNull: false,
                type: DataTypes.STRING,
                unique: true,
            },
            sender_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            receiver_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            amount: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            status: {
                allowNull: false,
                type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
                defaultValue: 'PENDING',
            },
            reference: {
                allowNull: true,
                type: DataTypes.STRING,
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        },
        {
            tableName: 'transaction_logs',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return TransactionLogModel;
}
