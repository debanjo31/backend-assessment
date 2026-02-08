'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ledgers', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true,
            },
            wallet_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'wallets',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            transaction_log_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'transaction_logs',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            entry_type: {
                type: Sequelize.ENUM('CREDIT', 'DEBIT'),
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            balance_before: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            balance_after: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('ledgers');
    },
};
