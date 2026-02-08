import { InterestAccrual } from '@/interfaces/interest-accrual.interfaces';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type InterestAccrualCreationAttributes = Optional<
    InterestAccrual,
    'id' | 'created_at'
>;

export class InterestAccrualModel
    extends Model<InterestAccrual, InterestAccrualCreationAttributes>
    implements InterestAccrual
{
    public id!: string;
    public loan_id!: string;
    public date!: string;
    public daily_rate!: number;
    public principal!: number;
    public interest!: number;
    public created_at: string | undefined;
}

export default function (sequelize: Sequelize): typeof InterestAccrualModel {
    InterestAccrualModel.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUIDV4,
                defaultValue: DataTypes.UUIDV4,
            },
            loan_id: {
                allowNull: false,
                type: DataTypes.UUID,
                references: {
                    model: 'loans',
                    key: 'id',
                },
            },
            date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
            },
            daily_rate: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 10),
            },
            principal: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            interest: {
                allowNull: false,
                type: DataTypes.DECIMAL(20, 4),
            },
            created_at: DataTypes.DATE,
        },
        {
            tableName: 'interest_accruals',
            sequelize,
            createdAt: 'created_at',
            updatedAt: false,
            timestamps: true,
        },
    );

    return InterestAccrualModel;
}
