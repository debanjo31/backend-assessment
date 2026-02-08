'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('interest_accruals', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true,
            },
            loan_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'loans',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            daily_rate: {
                type: Sequelize.DECIMAL(20, 10),
                allowNull: false,
            },
            principal: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            interest: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Prevent duplicate accruals for the same loan + date
        await queryInterface.addIndex('interest_accruals', ['loan_id', 'date'], {
            unique: true,
            name: 'idx_interest_accruals_loan_date',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('interest_accruals');
    },
};
