class OlympiadeDashboard {
    constructor() {
        this.apiBase = '/api';
        this.data = {};
        this.emojiMap = null;
        this.init();
    }

    async init() {
        await this.loadEmojiMap();
        await this.loadData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadEmojiMap() {
        try {
            // NEU: Emoji-Map von der API laden
            const res = await fetch('/api/emoji-map');
            const emojiData = await res.json();

            // Format anpassen für Frontend
            this.emojiMap = emojiData.map(item => ({
                Emoji: item.emoji,
                Trigger: item.trigger_word
            }));
        } catch (e) {
            console.error('Fehler beim Laden der Emoji-Map:', e);
            this.emojiMap = [];
        }
    }

    async loadData() {
        try {
            const [stats, leaderboard, recent, disciplines] = await Promise.all([
                fetch(`${this.apiBase}/stats`).then(r => r.json()),
                fetch(`${this.apiBase}/leaderboard`).then(r => r.json()),
                fetch(`${this.apiBase}/recent`).then(r => r.json()),
                fetch(`${this.apiBase}/disciplines`).then(r => r.json())
            ]);

            this.data = { stats, leaderboard, recent, disciplines };
            this.updateUI();
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showError();
        }
    }

    updateUI() {
        this.updateStats();
        this.updateGradeRankings();
        this.updateLeaderboard();
        this.updateRecentResults();
        this.updateLastUpdateTime();
    }

    updateStats() {
        const { stats, leaderboard } = this.data;

        document.getElementById('totalTeams').textContent = stats.totalParticipants || 0;
        document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
        document.getElementById('totalDisciplines').textContent = stats.totalDisciplines || 0;

        const avgPoints = leaderboard.length > 0
            ? Math.round(leaderboard.reduce((sum, team) => sum + team.totalPoints, 0) / leaderboard.length)
            : 0;
        document.getElementById('avgPoints').textContent = "⌀ " + avgPoints;
    }

    updateGradeRankings() {
        const container = document.getElementById('barChart');
        container.style.display = 'block';
        container.innerHTML = '';

        const leaderboard = this.data.leaderboard || [];

        const getGrade = team => {
            if (team.grade) return String(team.grade);
            if (team.jahrgang) return String(team.jahrgang);
            const match = team.name && team.name.match(/(\d+)[\.\- ]/);
            return match ? match[1] : 'Unbekannt';
        };

        const allGrades = Array.from(
            new Set(leaderboard.map(getGrade).filter(g => g !== 'Unbekannt'))
        ).sort((a, b) => Number(a) - Number(b));

        const lastGrade = localStorage.getItem('currentGrade');
        let nextIdx = 0;
        if (lastGrade) {
            const idx = allGrades.indexOf(lastGrade);
            nextIdx = idx === -1 || idx === allGrades.length - 1 ? 0 : idx + 1;
        }
        const currentGrade = allGrades[nextIdx];

        localStorage.setItem('currentGrade', currentGrade);

        const teams = leaderboard.filter(team => getGrade(team) == currentGrade)
            .sort((a, b) => b.totalPoints - a.totalPoints);

        const gradeBlock = document.createElement('div');
        gradeBlock.className = 'grade-ranking-block';
        gradeBlock.innerHTML = `
            <div class="grade-title">Jahrgang ${currentGrade}</div>
            <ol class="grade-ranking-list">
                ${teams.map((team, idx) => `
                    <li class="grade-ranking-item${idx === 0 ? ' gold' : idx === 1 ? ' silver' : idx === 2 ? ' bronze' : ''}">
                        <span class="grade-rank-badge">${idx + 1}</span>
                        <span class="grade-team-name" title="${team.name}">${team.name}</span>
                        <span class="grade-team-points">${team.totalPoints} Pkt</span>
                    </li>
                `).join('')}
            </ol>
        `;
        container.appendChild(gradeBlock);
    }

    updateLeaderboard() {
        const container = document.getElementById('leaderboardContent');
        const teams = this.data.leaderboard.slice(0, 10);

        container.innerHTML = teams.map((team, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'other';
            const avgPlace = team.avgPlace && !isNaN(team.avgPlace)
                ? Number(team.avgPlace).toFixed(1).replace('.', '.')
                : '-';

            return `
                <div class="leaderboard-item">
                    <div class="rank ${rankClass}">${team.rank}</div>
                    <div class="team-info">
                        <div class="team-name" title="${team.name}">${team.name}</div>
                        <div class="team-stats">
                            ${team.events} Wettbewerbe
                            <span class="avg-place">| Ø ${avgPlace} Platz</span>
                        </div>
                    </div>
                    <div class="points">${team.totalPoints}</div>
                </div>
            `;
        }).join('');
    }

    updateRecentResults() {
        const container = document.getElementById('recentResults');
        const results = (this.data.recent || []).slice(0, 6);

        if (!results || results.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine aktuellen Ergebnisse verfügbar</div>';
            return;
        }

        const disciplineColors = [
            'discipline-1', 'discipline-2', 'discipline-3', 'discipline-4'
        ];

        container.innerHTML = results.map((result, index) => {
            const colorClass = disciplineColors[index % disciplineColors.length];
            const emoji = this.getDisciplineEmoji(result.discipline);

            return `
                <div class="recent-item">
                    <div class="discipline-icon ${colorClass}">
                        ${emoji}
                    </div>
                    <div class="recent-info">
                        <h4 class="recent-discipline" title="${capitalizeFirstLetter(result.discipline)}">${capitalizeFirstLetter(result.discipline)}</h4>
                        <p class="recent-team">${result.team}</p>
                    </div>
                    <div class="recent-score">
                        <div class="score-value">${result.points} Pkt</div>
                        <div class="score-date">${result.time || ''}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDisciplineEmoji(discipline) {
        if (!Array.isArray(this.emojiMap)) return '🏆';
        const lowercased = discipline.toLowerCase();
        for (const entry of this.emojiMap) {
            if (lowercased.includes(entry.Trigger.toLowerCase())) {
                return entry.Emoji;
            }
        }
        return '🏆';
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = `Zuletzt aktualisiert: ${timeString}`;
    }

    setupEventListeners() {
        const chartPeriod = document.getElementById('chartPeriod');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => {
                this.updateChart();
            });
        }

        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    filterResults(searchTerm) {
        if (!searchTerm) {
            this.updateLeaderboard();
            this.updateRecentResults();
            return;
        }

        const filtered = this.data.leaderboard.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.getElementById('leaderboardContent');
        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Teams gefunden</div>';
            return;
        }

        container.innerHTML = filtered.map((team, index) => {
            const rankClass = team.rank === 1 ? 'gold' : team.rank === 2 ? 'silver' : team.rank === 3 ? 'bronze' : 'other';

            return `
                <div class="leaderboard-item">
                    <div class="rank ${rankClass}">${team.rank}</div>
                    <div class="team-info">
                        <div class="team-name" title="${team.name}">${team.name}</div>
                        <div class="team-stats">${team.events} Wettbewerbe</div>
                    </div>
                    <div class="points">${team.totalPoints}</div>
                </div>
            `;
        }).join('');
    }

    startAutoRefresh() {
        setInterval(() => {
            location.reload();
        }, 10000);
    }

    showError() {
        const errorMessage = `
            <div class="error-message">
                <h3>⚠️ Verbindungsproblem</h3>
                <p>Daten können nicht geladen werden. Überprüfen Sie die .json Dateien und den Server.</p>
                <button onclick="location.reload()">Seite neu laden</button>
            </div>
        `;

        document.getElementById('leaderboardContent').innerHTML = errorMessage;
        document.getElementById('recentResults').innerHTML = errorMessage;
        document.getElementById('barChart').innerHTML = errorMessage;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new OlympiadeDashboard();
});

function reloadwebsite() {
    location.reload();
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
