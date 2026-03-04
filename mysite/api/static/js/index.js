
        const TOIT_CLOSED_ANGLE = 110; // servo fermé
        const TOIT_OPEN_ANGLE = 180;   // servo ouvert

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
                if (lastData.pompe_lock == 0) {
                    updateCard('lockCard', 'Not Locked');
                } else {
                    updateCard('lockCard','Locked : ', lastData.pompe_lock, 's');
                }

                // update log card content if logs were returned
                const logsContent = document.getElementById('logsContent');
                if (logsContent && lastData.logs) {
                    if (lastData.logs.length) {
                        logsContent.innerHTML = '<ul>' +
                            lastData.logs.map(l => `<li>${l}</li>`).join('') +
                            '</ul>';
                    } else {
                        logsContent.innerHTML = '<em>Aucune donnée</em>';
                    }
                }

                // Sync bouton toit selon l'angle réel du servo
                const toitBtn = document.getElementById('toitBtn');
                if (toitBtn) {
                    const isOpen = lastData.servo >= TOIT_OPEN_ANGLE;
                    toitBtn.textContent = isOpen ? 'Fermer' : 'Ouvrir';
                    toitBtn.value = isOpen ? 'toit_0' : 'toit_1';
                }

                // Sync LED button
                const ledBtn = document.getElementById('ledBtn');
                if (ledBtn) {
                    const isOn = lastData.led === 'ON';
                    ledBtn.textContent = isOn ? 'Éteindre' : 'Allumer';
                    ledBtn.value = isOn ? 'led_off' : 'led_on';
                }


                // Indicateur LED
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

                // Animation
                document.querySelectorAll('.card').forEach(card => {
                    card.style.animation = 'none';
                    setTimeout(() => {
                        card.style.animation = 'pulse 0.5s ease-in-out';
                    }, 10);
                });

                document.getElementById('errorMessage').style.display = 'none';
                updateLastUpdate();

            } catch (error) {
                console.error('Erreur lors du rafraîchissement:', error);
                document.getElementById('errorMessage').textContent = 'Erreur de connexion à l\'API: ' + error.message;
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
            refreshTimer = setInterval(() => {
                if (autoRefreshEnabled) refreshData();
            }, refreshInterval);
        }

        // read CSRF token from cookies
        function getCookie(name) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        // send open/close command to API
        async function sendToitCommand(action) {
            try {
                const csrftoken = getCookie('csrftoken');
                const resp = await fetch('/api/toit/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken || ''
                    },
                    body: JSON.stringify({ action })
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({ error: resp.statusText }));
                    throw new Error(err.error || resp.statusText);
                }

                console.log('[Toit] command queued:', action);
                const toitBtn = document.getElementById('toitBtn');
                if (toitBtn) {
                    if (action === 'open') {
                        toitBtn.textContent = 'Fermer';
                        toitBtn.value = 'toit_0';
                    } else {
                        toitBtn.textContent = 'Ouvrir';
                        toitBtn.value = 'toit_1';
                    }
                }
            } catch (e) {
                console.error('[Toit] failed to send command:', e);
                const em = document.getElementById('errorMessage');
                if (em) {
                    em.textContent = 'Erreur en envoyant la commande toit: ' + e.message;
                    em.style.display = 'block';
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            refreshData();
            startAutoRefresh();

            const toitBtn = document.getElementById('toitBtn');
            if (toitBtn) {
                toitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = toitBtn.value || '';
                    if (val === 'toit_1') sendToitCommand('open');
                    else if (val === 'toit_0') sendToitCommand('close');
                    else {
                        const text = (toitBtn.textContent || '').trim().toLowerCase();
                        if (text.includes('ouvrir')) sendToitCommand('open');
                        else sendToitCommand('close');
                    }
                });
            }

            // add refresh logs button handler
            const refreshLogsBtn = document.getElementById('refreshLogsBtn');
            if (refreshLogsBtn) {
                refreshLogsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    refreshData();
                });
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && autoRefreshEnabled) refreshData();
        });