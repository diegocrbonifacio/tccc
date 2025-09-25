document.addEventListener('DOMContentLoaded', () => {
    // Código de alternância de tema e obtenção de sessão (mantido do seu original)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const userNameElement = document.getElementById('user-name');

    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        return { usuario, access_token };
    }

    const sessaoUsuario = obterSessao();

    if (userNameElement && sessaoUsuario.usuario) {
        userNameElement.textContent = `Olá, ${sessaoUsuario.usuario.nome}`;
    }

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

    // --- Nova Lógica para Meus Treinos ---

    function renderizarCardsTreinosInscritos(listaDeTreinos) {
        const container = document.getElementById('card-container');
        if (!container) return;

        container.innerHTML = ''; // Limpa o conteúdo para evitar duplicação

        if (listaDeTreinos.length === 0) {
            container.innerHTML = '<p>Você ainda não está inscrito em nenhum treino.</p>';
            return;
        }

        listaDeTreinos.forEach(treino => {
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

    async function carregarTreinosDoUsuario() {
        const container = document.getElementById('card-container');
        if (!container) return;

        // O ID do usuário deve ser obtido da sessão
        const { usuario, access_token } = obterSessao();
        const userId = usuario?.id_usuario;

        if (!userId || !access_token) {
            container.innerHTML = '<p>Faça login para ver seus treinos.</p>';
            return;
        }

        try {
            // Supondo que sua API tenha um endpoint para buscar treinos por ID do usuário
            // Ex: http://127.0.0.1:8000/treinos/listar_treinos_por_usuario/1/
            const res = await fetch(`http://127.0.0.1:8000/treinos/listar_treinos_por_usuario/${userId}/`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!res.ok) throw new Error('Falha ao buscar os treinos do usuário');

            const data = await res.json();
            const listaDeTreinos = data.result;

            renderizarCardsTreinosInscritos(listaDeTreinos);

        } catch (error) {
            console.error('Erro ao carregar os treinos:', error);
            container.innerHTML = '<p>Não foi possível carregar seus treinos. Tente novamente mais tarde.</p>';
        }
    }

    carregarTreinosDoUsuario();
});