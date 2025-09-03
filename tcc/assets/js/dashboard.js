document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = 'Olá, Ana';

    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if(themeIcon) themeIcon.innerHTML = '&#x1F319;';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            if(themeIcon) themeIcon.innerHTML = '&#x2600;&#xFE0F;';
            localStorage.setItem('theme', 'light');
        }
    }
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme || 'light');
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    function renderizarCards(listaDeTreinos, dadosDeProgresso) {
        const container = document.getElementById('card-container');
        if (!container) return;
        container.innerHTML = '';

        listaDeTreinos.forEach(treino => {
            const progresso = dadosDeProgresso[treino.id] || 0;
            const cardHTML = `
                <div class="treino-card">
                    <div>
                        <h2>${treino.titulo}</h2>
                        <p>${treino.descricao}</p>
                    </div>
                    <div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${progresso}%;"></div>
                        </div>
                        <p class="progress-text">${progresso}% concluído</p>
                        <a href="${treino.link}" class="card-link">Ver Treino</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    async function carregarTreinos() {
        try {
            const [resTreinos, resProgressoDefault] = await Promise.all([
                fetch('../assets/data/treinos.json'),
                fetch('../assets/data/progresso_db.json')
            ]);

            const listaDeTreinos = await resTreinos.json();
            const defaultProgress = await resProgressoDefault.json();

            const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            const finalProgress = { ...defaultProgress, ...userProgress };
            
            renderizarCards(listaDeTreinos, finalProgress);

        } catch (error) {
            console.error('Falha ao carregar os treinos:', error);
            const container = document.getElementById('card-container');
            if(container) container.innerHTML = '<p>Erro ao carregar os treinos.</p>';
        }
    }

    carregarTreinos();
});
