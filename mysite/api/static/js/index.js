
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

                // Sync bouton toit selon l'angle réel du servo
                const toitBtn = document.getElementById('toitBtn');
                if (toitBtn) {
                    const isOpen = lastData.servo >= TOIT_OPEN_ANGLE;
                    toitBtn.textContent = isOpen ? 'Fermer' : 'Ouvrir';
                    toitBtn.value = isOpen ? 'toit_0' : 'toit_1';
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

        document.addEventListener('DOMContentLoaded', () => {
            refreshData();
            startAutoRefresh();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && autoRefreshEnabled) refreshData();
        });