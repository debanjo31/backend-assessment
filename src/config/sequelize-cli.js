const { config } = require('dotenv');
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const { DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_HOST, DB_DIALECT } =
    process.env;

module.exports = {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    host: DB_HOST,
    dialect: DB_DIALECT,
    migrationStorageTableName: 'sequelize_migrations',
    seederStorageTableName: 'sequelize_seeds',
};
