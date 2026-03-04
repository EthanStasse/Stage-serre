const TOIT_CLOSED_ANGLE = 110;
const TOIT_OPEN_ANGLE = 180;

let autoRefreshEnabled = true;
let refreshInterval = 2000;
let refreshTimer = null;

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('fr-FR');
}

async function refreshData() {
    try {
        const lastResponse = await fetch('/api/last/');
        if (!lastResponse.ok) throw new Error('Erreur API');
        const lastData = await lastResponse.json();

        updateCard('tempCard', lastData.temp.toFixed(1), '°C');
        updateCard('humCard', lastData.hum.toFixed(1), '%');
        updateCard('solCard', lastData.sol, '%');
        updateCard('lumiereCard', lastData.lumière, 'Lux');
        updateCard('servoCard', lastData.servo, '°');
        updateCard('periodeCard', lastData.periode, '');
        updateCard('pompeCard', lastData.pompe, '');
        updateCard('ledCard', lastData.led, '');
        if (lastData.pompe_lock == 0 || lastData.pompe_lock == 600) {
            updateCard('lockCard', 'Not Locked');
        } else {
            updateCard('lockCard', 'Locked : ', lastData.pompe_lock, 's');
        }

        const logsContent = document.getElementById('logsContent');
        if (logsContent && lastData.logs) {
            if (lastData.logs.length) {
                logsContent.innerHTML = '<ul>' +
                    lastData.logs.map(function(l) { return '<li>' + l + '</li>'; }).join('') +
                    '</ul>';
            } else {
                logsContent.innerHTML = '<em>Aucune donnée</em>';
            }
        }

        const toitBtn = document.getElementById('toitBtn');
        if (toitBtn) {
            const isOpen = lastData.servo >= TOIT_OPEN_ANGLE;
            toitBtn.textContent = isOpen ? 'Fermer' : 'Ouvrir';
            toitBtn.value = isOpen ? 'toit_0' : 'toit_1';
        }

        const ledBtn = document.getElementById('ledBtn');
        if (ledBtn) {
            const isOn = lastData.led === 'ON';
            ledBtn.textContent = isOn ? 'Éteindre' : 'Allumer';
            ledBtn.dataset.action = isOn ? 'off' : 'on';
        }

        const ledIndicator = document.querySelector('.status-indicator');
        const ledCard = document.getElementById('ledCard');
        if (lastData.led && lastData.led === 'ON') {
            ledIndicator.style.backgroundColor = '#4CAF50';
            ledCard.classList.add('active');
            ledCard.classList.remove('inactive');
        } else {
            ledIndicator.style.backgroundColor = '#999';
            ledCard.classList.remove('active');
            ledCard.classList.add('inactive');
        }

        document.getElementById('errorMessage').style.display = 'none';
        updateLastUpdate();

    } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        document.getElementById('errorMessage').textContent = "Erreur de connexion à l'API: " + error.message;
        document.getElementById('errorMessage').style.display = 'block';
    }
}

function updateCard(cardId, value, unit) {
    const card = document.getElementById(cardId);
    const valueElement = card.querySelector('.card-value');
    valueElement.textContent = value + (unit ? ' ' + unit : '');

    card.classList.remove('warning', 'danger');
    if (cardId === 'tempCard' && parseFloat(value) > 30) {
        card.classList.add('danger');
    } else if (cardId === 'humCard' && parseFloat(value) > 80) {
        card.classList.add('warning');
    }
}

function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(function() {
        if (autoRefreshEnabled) refreshData();
    }, refreshInterval);
}

function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

async function sendToitCommand(action) {
    try {
        var csrftoken = getCookie('csrftoken');
        var resp = await fetch('/api/toit/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken || '' },
            body: JSON.stringify({ action: action })
        });
        if (!resp.ok) {
            var err = await resp.json().catch(function() { return { error: resp.statusText }; });
            throw new Error(err.error || resp.statusText);
        }
        var toitBtn = document.getElementById('toitBtn');
        if (toitBtn) {
            toitBtn.textContent = action === 'open' ? 'Fermer' : 'Ouvrir';
            toitBtn.value = action === 'open' ? 'toit_0' : 'toit_1';
        }
    } catch (e) {
        var em = document.getElementById('errorMessage');
        if (em) { em.textContent = 'Erreur commande toit: ' + e.message; em.style.display = 'block'; }
    }
}

async function sendLedCommand(action) {
    try {
        var csrftoken = getCookie('csrftoken');
        var resp = await fetch('/api/led/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken || '' },
            body: JSON.stringify({ action: action })
        });
        if (!resp.ok) {
            var err = await resp.json().catch(function() { return { error: resp.statusText }; });
            throw new Error(err.error || resp.statusText);
        }
        var ledBtn = document.getElementById('ledBtn');
        if (ledBtn) {
            ledBtn.textContent = action === 'on' ? 'Éteindre' : 'Allumer';
            ledBtn.dataset.action = action === 'on' ? 'off' : 'on';
        }
    } catch (e) {
        var em = document.getElementById('errorMessage');
        if (em) { em.textContent = 'Erreur commande LED: ' + e.message; em.style.display = 'block'; }
    }
}

// JS-driven toggle switch — works on all browsers
function initToggle() {
    var switchEl = document.getElementById('modeSwitch');
    var checkbox = document.getElementById('modeCheckbox');
    if (!switchEl || !checkbox) return;

    function applyState() {
        if (checkbox.checked) {
            switchEl.classList.add('is-checked');
        } else {
            switchEl.classList.remove('is-checked');
        }
    }

    // use click on the label instead of change on input for better compatibility
    switchEl.addEventListener('click', function(e) {
        // toggle manually since we intercept the click
        checkbox.checked = !checkbox.checked;
        applyState();
        e.preventDefault();
    });

    applyState(); // set initial state
}

document.addEventListener('DOMContentLoaded', function() {
    refreshData();
    startAutoRefresh();
    initToggle();

    var toitBtn = document.getElementById('toitBtn');
    if (toitBtn) {
        toitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var val = toitBtn.value || '';
            if (val === 'toit_1') sendToitCommand('open');
            else if (val === 'toit_0') sendToitCommand('close');
            else {
                var text = (toitBtn.textContent || '').trim().toLowerCase();
                sendToitCommand(text.indexOf('ouvrir') >= 0 ? 'open' : 'close');
            }
        });
    }

    var ledBtn = document.getElementById('ledBtn');
    if (ledBtn) {
        ledBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var action = ledBtn.dataset.action || '';
            if (action === 'on' || action === 'off') sendLedCommand(action);
            else {
                var text = (ledBtn.textContent || '').trim().toLowerCase();
                sendLedCommand(text.indexOf('allumer') >= 0 ? 'on' : 'off');
            }
        });
    }

    var deconnexionBtn = document.getElementById('deconnexionBtn');
    if (deconnexionBtn) {
        deconnexionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/logout/';
        });
    }

    var refreshLogsBtn = document.getElementById('refreshLogsBtn');
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshData();
        });
    }
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && autoRefreshEnabled) refreshData();
});