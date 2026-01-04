const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.MYSQL_HOST || 'mysql',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'olympiade_user',
    password: process.env.MYSQL_PASSWORD || 'olympiade2025',
    database: process.env.MYSQL_DATABASE || 'schulolympiade',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Datenbankverbindung erfolgreich!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Datenbankverbindung fehlgeschlagen:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
