'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('transaction_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true,
            },
            idempotency_key: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            sender_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            receiver_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            amount: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            reference: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('transaction_logs');
    },
};
