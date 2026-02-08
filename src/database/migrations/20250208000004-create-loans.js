'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('loans', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            principal: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
            },
            annual_rate: {
                type: Sequelize.DECIMAL(10, 6),
                allowNull: false,
            },
            accrued_interest: {
                type: Sequelize.DECIMAL(20, 4),
                allowNull: false,
                defaultValue: 0,
            },
            last_interest_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'CLOSED'),
                allowNull: false,
                defaultValue: 'ACTIVE',
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
        await queryInterface.dropTable('loans');
    },
};
