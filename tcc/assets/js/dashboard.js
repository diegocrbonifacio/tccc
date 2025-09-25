document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const userNameElement = document.getElementById('user-name');

    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    sessaoUsuario = obterSessao();

    if (userNameElement) userNameElement.textContent = `Olá, ${sessaoUsuario.usuario.nome}`;

    async function requestComToken(url, options = {}) {
        const sessao = obterSessao(); // pega access e refresh do localStorage
        let access_token = sessao?.access_token;
        const refresh_token = sessao?.refresh_token;

        if (!access_token || !refresh_token) {
            throw new Error("Token não encontrado");
        }

        // aplica o access token no header
        options.headers = {
            ...options.headers,
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        };

        // primeira tentativa
        let response = await fetch(url, options);
        let data = await response.json().catch(() => ({}));

        // verifica se deu erro de token
        if (response.status === 401 || data?.error?.includes("token")) {
            // tenta renovar
            const novoAccess = await renovarToken(refresh_token);

            if (!novoAccess) {
                throw new Error("Token inválido ou expirado");
            }

            // atualiza o header e tenta de novo
            options.headers["Authorization"] = `Bearer ${novoAccess}`;
            response = await fetch(url, options);
            data = await response.json().catch(() => ({}));
        }

        return { response, data };
    }

    async function renovarToken(refresh_token) {
        try {
            const response = await fetch("http://127.0.0.1:8000/usuarios/refresh_token/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token })
            });

            const data = await response.json();

            if (data.result && data.result.access) {
                const novoAccess = data.result.access;
                localStorage.setItem("access_token", novoAccess);
                return novoAccess;
            }
            return null;
        } catch (err) {
            console.error("Erro ao renovar token:", err);
            return null;
        }
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

    function renderizarCards(listaDeTreinos, dadosDeProgresso) {
        const container = document.getElementById('card-container');
        if (!container) return;
        container.innerHTML = '';

        listaDeTreinos.forEach(treino => {
            const progresso = dadosDeProgresso[treino.id_treino] || 0;

            const card = document.createElement('div');
            card.className = 'treino-card';
            card.innerHTML = `
            <img src="${treino.url_imagem_treino}" alt="${treino.nome_treino}" class="card-image"/>
            <div class="card-content">
                <h2>${treino.nome_treino}</h2>
                <p>${treino.descricao_treino}</p>
                <a href="exercicios.html?id=${treino.id_treino}" class="card-link">Ver Treino</a>
                <button class="btn-inscrever card-link" style="background: green; width: 100%; color: white; padding: 10px; border: none; border-radius: 5px;">Inscrever-se no treino</button>
            </div>
        `;

            container.appendChild(card);

            // adiciona evento ao botão
            const btnInscrever = card.querySelector('.btn-inscrever');
            btnInscrever.addEventListener('click', async () => {
                try {
                    const data = {
                        treino_id: treino.id_treino,
                        data: new Date().toISOString().split('T')[0] // pega a data atual no formato YYYY-MM-DD
                    };

                    const { response, data: respData } = await requestComToken(
                        'http://127.0.0.1:8000/usuarios/inscrever_usuario_treino/',
                        {
                            method: 'POST',
                            body: JSON.stringify(data)
                        }
                    );

                    if (response.ok && respData.result) {
                        alert(`Inscrição realizada com sucesso no treino: ${treino.nome_treino}`);
                        // atualiza o progresso localmente se quiser
                        const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
                        userProgress[treino.id_treino] = 0;
                        localStorage.setItem('userProgress', JSON.stringify(userProgress));
                    } else {
                        alert(`Erro ao se inscrever no treino: ${respData.error || 'Desconhecido'}`);
                    }
                } catch (err) {
                    alert(`Erro de autenticação ou token: ${err.message}`);
                }
            });
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
