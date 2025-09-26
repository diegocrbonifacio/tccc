document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const userNameElement = document.getElementById('user-name');

    // ==========================================================
    // FUNÇÃO PARA NOTIFICAÇÕES PERSONALIZADAS (5 segundos de duração)
    // ==========================================================
    function mostrarNotificacao(mensagem, tipo = 'sucesso') {
        // 1. Cria ou obtém o contêiner no body
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        // 2. Cria a notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notification ${tipo}`; // Adiciona classe 'sucesso' ou 'erro'
        notificacao.textContent = mensagem;
        
        // 3. Adiciona ao contêiner
        container.appendChild(notificacao);

        // 4. Remove a notificação após 5 segundos (5000 ms)
        setTimeout(() => {
            notificacao.classList.add('hide'); // Adiciona classe para iniciar a animação de saída (CSS)
            
            // Espera a transição de CSS terminar para remover o elemento
            notificacao.addEventListener('transitionend', () => {
                notificacao.remove();
                // Limpa o contêiner se estiver vazio (opcional)
                if (container.children.length === 0) {
                    container.remove();
                }
            });
        }, 5000); // 5000 milissegundos
    }
    // ==========================================================

    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    let sessaoUsuario = obterSessao();

    if (userNameElement && sessaoUsuario.usuario && sessaoUsuario.usuario.nome) {
        userNameElement.textContent = `Olá, ${sessaoUsuario.usuario.nome}`;
    }

    async function requestComToken(url, options = {}) {
        const sessao = obterSessao();
        let access_token = sessao?.access_token;
        const refresh_token = sessao?.refresh_token;

        if (!access_token || !refresh_token) {
            mostrarNotificacao("Token de acesso não encontrado. Faça login novamente.", 'erro');
            throw new Error("Token não encontrado");
        }

        options.headers = {
            ...options.headers,
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        };

        let response = await fetch(url, options);
        let data = await response.json().catch(() => ({}));

        if (response.status === 401 || data?.error?.includes("token")) {
            const novoAccess = await renovarToken(refresh_token);

            if (!novoAccess) {
                mostrarNotificacao("Sessão expirada. Redirecionando para o login...", 'erro');
                throw new Error("Token inválido ou expirado");
            }

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

    // ==========================================================
    // FUNÇÃO renderizarCards ATUALIZADA
    // ==========================================================
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

            const btnInscrever = card.querySelector('.btn-inscrever');
            btnInscrever.addEventListener('click', async () => {
                // Desabilita o botão para evitar cliques duplicados
                btnInscrever.disabled = true; 
                btnInscrever.textContent = 'Inscrevendo...';

                try {
                    const data = {
                        treino_id: treino.id_treino,
                        data: new Date().toISOString().split('T')[0]
                    };

                    const { response, data: respData } = await requestComToken(
                        'http://127.0.0.1:8000/usuarios/inscrever_usuario_treino/',
                        {
                            method: 'POST',
                            body: JSON.stringify(data)
                        }
                    );

                    if (response.ok && respData.result) {
                        // Notificação de SUCESSO PERSONALIZADA
                        mostrarNotificacao(`Parabéns! Você se inscreveu no treino: ${treino.nome_treino} 🎉`, 'sucesso');
                        
                        const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
                        userProgress[treino.id_treino] = 0;
                        localStorage.setItem('userProgress', JSON.stringify(userProgress));
                        
                        btnInscrever.textContent = 'Inscrito!'; 
                    } else {
                        // Notificação de ERRO PERSONALIZADA (Retorna erro do backend)
                        const erroMsg = respData.error || 'Erro desconhecido ao se inscrever.';
                        mostrarNotificacao(`Ops! Não foi possível se inscrever no treino ${treino.nome_treino}: ${erroMsg} 😟`, 'erro');
                        btnInscrever.textContent = 'Inscrever-se no treino';
                    }
                } catch (err) {
                    // Notificação de ERRO DE REQUISIÇÃO
                    mostrarNotificacao(`Erro de conexão ou autenticação: ${err.message}.`, 'erro');
                    btnInscrever.textContent = 'Inscrever-se no treino';
                } finally {
                    // Reabilita o botão
                    btnInscrever.disabled = false; 
                }
            });
        });
    }
    // ==========================================================

    async function carregarTreinos() {
        try {
            const resTreinos = await fetch('http://127.0.0.1:8000/treinos/listar_treinos/');
            if (!resTreinos.ok) throw new Error('Falha ao buscar treinos');

            const data = await resTreinos.json();
            const listaDeTreinos = data.result.treinos;

            const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            const finalProgress = listaDeTreinos.reduce((acc, treino) => {
                acc[treino.id_treino] = userProgress[treino.id_treino] || 0;
                return acc;
            }, {});

            renderizarCards(listaDeTreinos, finalProgress);
        } catch (error) {
            console.error('Falha ao carregar os treinos:', error);
            const container = document.getElementById('card-container');
            if(container) container.innerHTML = '<p>Erro ao carregar os treinos. Verifique a conexão com a API.</p>';
        }
    }

    carregarTreinos();
});