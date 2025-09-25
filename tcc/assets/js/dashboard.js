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
            const progresso = dadosDeProgresso[treino.id_treino] || 0;

            const cardHTML = `
                <div class="treino-card">
                    <img src="${treino.url_imagem_treino}" alt="${treino.nome_treino}" class="card-image"/>
                    <div class="card-content">
                        <h2>${treino.nome_treino}</h2>
                        <p>${treino.descricao_treino}</p>
                        <a href="exercicios.html?id=${treino.id_treino}" class="card-link">Ver Treino</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    async function carregarTreinos() {
        try {
            const resTreinos = await fetch('http://127.0.0.1:8000/treinos/listar_treinos/');
            if (!resTreinos.ok) throw new Error('Falha ao buscar treinos');

            const data = await resTreinos.json();
            const listaDeTreinos = data.result.treinos;

            // Carrega progresso do usuário
            const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            const finalProgress = listaDeTreinos.reduce((acc, treino) => {
                acc[treino.id_treino] = userProgress[treino.id_treino] || 0;
                return acc;
            }, {});

            renderizarCards(listaDeTreinos, finalProgress);
        } catch (error) {
            console.error('Falha ao carregar os treinos:', error);
            const container = document.getElementById('card-container');
            if(container) container.innerHTML = '<p>Erro ao carregar os treinos.</p>';
        }
    }

    carregarTreinos();
});
