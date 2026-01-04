const express = require('express');
const path = require('path');
const fs = require('fs');
const { pool, testConnection } = require('/app/shared/db');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';

app.use(express.static('public'));
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// IP-Logging Middleware
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown IP';
    const now = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.headers['user-agent'] || 'unknown UA';
    const logLine = `[${now}] ${ip} - ${method} ${url} - UA: ${userAgent}\n`;
    console.log(logLine.trim());
    
    const logFilePath = "/app/logs/api-logs.txt";
    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) console.error('Fehler beim Schreiben der Logs:', err);
    });
    next();
});

async function getProcessedData() {
    try {
        const [results] = await pool.execute(
            'SELECT team, disziplin, punkte, platz, TIME_FORMAT(uhr, "%H:%i:%s") as uhr FROM results ORDER BY uhr DESC'
        );

        const teamScores = {};
        const disciplineStats = {};

        results.forEach(row => {
            if (!teamScores[row.team]) {
                teamScores[row.team] = {
                    name: row.team,
                    totalPoints: 0,
                    events: 0,
                    avgPlace: 0,
                    places: []
                };
            }

            teamScores[row.team].totalPoints += row.punkte;
            teamScores[row.team].events++;
            teamScores[row.team].places.push(row.platz);

            if (!disciplineStats[row.disziplin]) {
                disciplineStats[row.disziplin] = {
                    name: row.disziplin,
                    participants: new Set(),
                    totalPoints: 0,
                    events: 0
                };
            }

            disciplineStats[row.disziplin].participants.add(row.team);
            disciplineStats[row.disziplin].totalPoints += row.punkte;
            disciplineStats[row.disziplin].events++;
        });

        Object.values(teamScores).forEach(team => {
            if (team.places.length > 0) {
                team.avgPlace = team.places.reduce((a, b) => a + b, 0) / team.places.length;
            }
        });

        const leaderboard = Object.values(teamScores)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((team, index) => ({
                ...team,
                rank: index + 1
            }));

        const disciplines = Object.values(disciplineStats).map(d => ({
            name: d.name,
            participants: d.participants.size,
            avgPoints: d.events > 0 ? (d.totalPoints / d.events).toFixed(1) : 0,
            totalEvents: d.events
        }));

        const recentResults = results.slice(0, 10).map(r => ({
            team: r.team,
            discipline: r.disziplin,
            points: r.punkte,
            place: r.platz,
            time: r.uhr
        }));

        return {
            teams: Object.keys(teamScores),
            disciplines,
            totalParticipants: Object.keys(teamScores).length,
            totalEvents: results.length,
            leaderboard,
            recentResults
        };
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
        throw error;
    }
}

app.get('/api/stats', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json({
            totalParticipants: data.totalParticipants,
            totalEvents: data.totalEvents,
            totalDisciplines: data.disciplines.length,
            lastUpdate: new Date().toLocaleString('de-DE')
        });
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/disciplines', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.disciplines);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/recent', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.recentResults);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/emoji-map', (req, res) => {
    try {
        const emojiMapPath = path.join(__dirname, 'public', 'data', 'emojiMap.json');
        const emojiMap = JSON.parse(fs.readFileSync(emojiMapPath, 'utf8'));
        // Convert to match expected format: { emoji, trigger_word }
        const result = emojiMap.map(item => ({
            emoji: item.Emoji,
            trigger_word: item.Trigger
        }));
        res.json(result);
    } catch (error) {
        console.error('Fehler beim Abrufen der Emoji-Map:', error);
        res.json([]);
    }
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Dashboard läuft auf Port ${PORT}`);
    await testConnection();
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server wird beendet...');
    pool.end();
    process.exit(0);
});
