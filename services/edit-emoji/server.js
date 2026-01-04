// EDIT EMOJI DASHBOARD SERVER - Angepasst für MySQL
const express = require('express');
const crypto = require('crypto');
const { pool, testConnection } = require('../shared/db');

const app = express();
const PORT = 3004;

// Admin-Credentials
const ADMIN_USER = 'DauView25';
const ADMIN_PASS_HASH = crypto.createHash('sha256').update('ongOlympiade#2025').digest('hex');
const validTokens = new Set();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Login-Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (username === ADMIN_USER && hash === ADMIN_PASS_HASH) {
        const token = crypto.randomBytes(32).toString('hex');
        validTokens.add(token);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Login fehlgeschlagen' });
    }
});

// Auth-Middleware
function checkAuth(req, res, next) {
    const token = req.headers.authorization;
    if (token && validTokens.has(token)) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Nicht autorisiert' });
    }
}

// Emoji-Mappings abrufen
app.get('/data/emojiMap.json', async (req, res) => {
    try {
        const [rows] = await pool.execute(
	    'SELECT id, emoji as Emoji, trigger_word as `Trigger` FROM emoji_mappings ORDER BY trigger_word'
        );
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Emoji-Mappings:', error);
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

// Emoji-Mappings speichern
app.post('/api/save', checkAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Alte Mappings löschen
        await connection.execute('DELETE FROM emoji_mappings');
        
        // Neue Mappings einfügen
        const data = req.body;
        for (const item of data) {
            await connection.execute(
                'INSERT INTO emoji_mappings (emoji, trigger_word) VALUES (?, ?)',
                [item.Emoji, item.Trigger]
            );
        }
        
        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Fehler beim Speichern:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Server starten
app.listen(PORT, async () => {
    console.log(`😀 Edit Emoji Dashboard läuft auf http://localhost:${PORT}`);
    await testConnection();
});
