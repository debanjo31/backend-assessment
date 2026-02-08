import { Wallet } from '@/interfaces/wallet.interfaces';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type WalletCreationAttributes = Optional<Wallet, 'id' | 'balance'>;

export class WalletModel
    extends Model<Wallet, WalletCreationAttributes>
    implements Wallet
{
    public id!: string;
    public user_id!: string;
    public balance!: number;
    public created_at: string | undefined;
    public updated_at: string | undefined;
}

export default function (sequelize: Sequelize): typeof WalletModel {
    WalletModel.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUIDV4,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                allowNull: false,
                type: DataTypes.UUID,
                unique: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            balance: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
                defaultValue: 0,
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        },
        {
            tableName: 'wallets',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return WalletModel;
}
