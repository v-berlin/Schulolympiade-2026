const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3005;
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || 5678;
const N8N_EVENT_WEBHOOK_ID = process.env.N8N_EVENT_WEBHOOK_ID || 'e1d1b9c8-f46f-4ca8-8061-f0a317e1964e';
const LOGFILE = '/app/logs/ip_log.txt';
const FORMULAR_URL = `http://${SERVER_HOST}:${N8N_PORT}/form/${N8N_EVENT_WEBHOOK_ID}`;

http.createServer((req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    const now = new Date().toISOString();
    const logEntry = `${now} - ${ip}\n`;

    fs.appendFile(LOGFILE, logEntry, (err) => {
        if (err) console.error('Fehler beim Schreiben der Log-Datei:', err);
    });

    res.writeHead(302, { Location: FORMULAR_URL });
    res.end();

}).listen(PORT, () => {
    console.log(`📍 IP-Logging Server läuft auf Port ${PORT}`);
    console.log(`   Redirect zu: ${FORMULAR_URL}`);
});
