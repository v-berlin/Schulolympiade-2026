// Authentifizierung
function isAuthenticated() {
    return !!sessionStorage.getItem('authToken');
}

function logout() {
    sessionStorage.removeItem('authToken');
    showLogin();
    document.getElementById('loginForm').reset();
}

function checkAuthentication() {
    if (isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Datenmanagement (ohne Demo-Modus, mit echtem Löschen)
class DataManager {
    constructor() {
        this.data = [];
        this.currentEditIndex = -1;
        this.dataFile = '/data/results.json';
    }

    async loadData() {
        try {
            const token = sessionStorage.getItem('authToken') || '';
            const response = await fetch(this.dataFile + '?t=' + Date.now(), {
                headers: {
                    'Authorization': token
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const jsonData = await response.json();
            if (!Array.isArray(jsonData)) {
                throw new Error('JSON muss ein Array sein');
            }
            for (let item of jsonData) {
                if (!item.Team || !item.Disziplin || typeof item.Punkte !== 'number' ||
                    typeof item.Platz !== 'number' || !item.Uhr) {
                    throw new Error('Ungültige Datenstruktur in JSON');
                }
            }
            this.data = jsonData;
            console.log(`✅ ${jsonData.length} Einträge aus ${this.dataFile} geladen`);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Daten:', error);
            this.data = [];
            return false;
        }
    }

    getData() {
        return [...this.data];
    }

    async updateEntry(index, newData) {
        if (index >= 0 && index < this.data.length) {
            this.data[index] = { ...newData };
            return await this.saveToServer();
        }
        return false;
    }

    async deleteEntry(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            return await this.saveToServer();
        }
        return false;
    }

    async saveToServer() {
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': sessionStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(this.data)
            });
            if (!response.ok) throw new Error('Fehler beim Speichern!');
            showNotification('Daten gespeichert!', 'success');
            return true;
        } catch (e) {
            showNotification('Fehler beim Speichern!', 'error');
            return false;
        }
    }

    async reloadData() {
        const success = await this.loadData();
        if (success) {
            showNotification('Daten erfolgreich neu geladen!', 'success');
        } else {
            showNotification('Fehler beim Neuladen der Daten!', 'error');
        }
        return success;
    }

    getStats() {
        const teams = new Set(this.data.map(item => item.Team)).size;
        const disciplines = new Set(this.data.map(item => item.Disziplin)).size;
        const avgPoints = this.data.length > 0 ?
            Math.round(this.data.reduce((sum, item) => sum + item.Punkte, 0) / this.data.length) : 0;
        const lastUpdate = this.data.length > 0 ?
            this.data[this.data.length - 1].Uhr : '--:--';
        return { teams, disciplines, avgPoints, lastUpdate };
    }
}

// Globale Instanzen
// const auth = new SecureAuth();   // <-- ENTFERNEN!
const dataManager = new DataManager();

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.querySelector('.btn.btn-secondary[onclick="reloadData()"]').addEventListener('click', reloadData);
});

function checkAuthentication() {
    if (isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
}

function logout() {
    sessionStorage.removeItem('authToken');
    showLogin();
    document.getElementById('loginForm').reset();
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    loadDashboardData();
}

async function loadDashboardData() {
    document.getElementById('dataTableBody').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="loading">
                            <div class="spinner"></div>
                            Lade Daten aus ./data/results.json...
                        </div>
                    </td>
                </tr>
            `;
    await dataManager.loadData();
    updateDashboard();
}

async function handleLogin(e) {
    e.preventDefault();
    const loginBtn = document.querySelector('.btn-primary');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    loginText.style.display = 'none';
    loginSpinner.style.display = 'flex';
    loginBtn.disabled = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('authToken', data.token);
            showDashboard();
        } else {
            alert('Ungültige Anmeldedaten!');
            loginBtn.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => { loginBtn.style.animation = ''; }, 500);
        }
    } catch {
        alert('Server nicht erreichbar!');
    }
    loginText.style.display = 'block';
    loginSpinner.style.display = 'none';
    loginBtn.disabled = false;
}

function logout() {
    sessionStorage.removeItem('authToken');
    showLogin();
    document.getElementById('loginForm').reset();
}

function updateDashboard() {
    updateTable();
}


function updateTable() {
    const tbody = document.getElementById('dataTableBody');
    const data = dataManager.getData();
    tbody.innerHTML = '';
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td><strong>${item.Team}</strong></td>
                    <td>${item.Disziplin}</td>
                    <td><strong>${item.Punkte}</strong></td>
                    <td>
                        <span class="place-badge place-${item.Platz <= 3 ? item.Platz : 'other'}">
                            ${item.Platz}
                        </span>
                    </td>
                    <td>${item.Uhr}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-edit" onclick="editEntry(${index})" title="Bearbeiten">
                                ✏️
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteEntry(${index})" title="Löschen">
                                🗑️
                            </button>
                        </div>
                    </td>
                `;
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        tbody.appendChild(row);
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

window.editEntry = function (index) {
    const data = dataManager.getData();
    const item = data[index];
    dataManager.currentEditIndex = index;
    document.getElementById('editTeam').value = item.Team;
    document.getElementById('editDisziplin').value = item.Disziplin;
    document.getElementById('editPunkte').value = item.Punkte;
    document.getElementById('editPlatz').value = item.Platz;
    document.getElementById('editUhr').value = item.Uhr;
    document.getElementById('editModal').style.display = 'block';
};

window.deleteEntry = async function (index) {
    const data = dataManager.getData();
    const item = data[index];
    if (confirm(`Eintrag "${item.Team} - ${item.Disziplin}" wirklich löschen?`)) {
        const ok = await dataManager.deleteEntry(index);
        if (ok) {
            updateDashboard();
            showNotification('Eintrag erfolgreich gelöscht!', 'success');
        } else {
            showNotification('Fehler beim Löschen!', 'error');
        }
    }
};

async function handleEditSubmit(e) {
    e.preventDefault();
    const newData = {
        Team: document.getElementById('editTeam').value,
        Disziplin: document.getElementById('editDisziplin').value,
        Punkte: parseInt(document.getElementById('editPunkte').value),
        Platz: parseInt(document.getElementById('editPlatz').value),
        Uhr: document.getElementById('editUhr').value
    };
    const ok = await dataManager.updateEntry(dataManager.currentEditIndex, newData);
    if (ok) {
        closeModal();
        updateDashboard();
        showNotification('Eintrag erfolgreich aktualisiert!', 'success');
    } else {
        showNotification('Fehler beim Aktualisieren!', 'error');
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    dataManager.currentEditIndex = -1;
    document.getElementById('editForm').reset();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
                <div class="notification-content">
                    <span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span>
                    ${message}
                </div>
            `;
    const bgColor = type === 'success' ? 'var(--success)' :
        type === 'warning' ? 'var(--warning)' : 'var(--danger)';
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: var(--shadow);
                z-index: 2000;
                transform: translateX(400px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: var(--blur);
                max-width: 400px;
            `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, type === 'warning' ? 5000 : 3000);
}

// Modal und Shortcuts wie gehabt...

// Neu laden Button (liest Datei neu ein) - OHNE Spinner!
async function reloadData(event) {
    if (event) event.preventDefault();
    let btn = event ? event.currentTarget : document.querySelector('.btn.btn-secondary[onclick="reloadData()"]');
    if (!(btn instanceof HTMLButtonElement)) btn = btn.closest('button');
    btn.disabled = true;
    try {
        const success = await dataManager.reloadData();
        if (success) {
            updateDashboard();
        }
    } catch (e) {
        showNotification('Fehler beim Neuladen!', 'error');
    } finally {
        btn.disabled = false;
    }
}
