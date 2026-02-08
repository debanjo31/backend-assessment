import { Loan, LoanStatus } from '@/interfaces/loan.interfaces';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type LoanCreationAttributes = Optional<
    Loan,
    'id' | 'accrued_interest' | 'status' | 'created_at' | 'updated_at'
>;

export class LoanModel
    extends Model<Loan, LoanCreationAttributes>
    implements Loan
{
    public id!: string;
    public user_id!: string;
    public principal!: number;
    public annual_rate!: number;
    public accrued_interest!: number;
    public last_interest_date!: string;
    public status!: LoanStatus;
    public created_at: string | undefined;
    public updated_at: string | undefined;
}

export default function (sequelize: Sequelize): typeof LoanModel {
    LoanModel.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUIDV4,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            principal: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            annual_rate: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 6),
            },
            accrued_interest: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
                defaultValue: 0,
            },
            last_interest_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
            },
            status: {
                allowNull: false,
                type: DataTypes.ENUM('ACTIVE', 'CLOSED'),
                defaultValue: 'ACTIVE',
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        },
        {
            tableName: 'loans',
            sequelize,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            timestamps: true,
        },
    );

    return LoanModel;
}
