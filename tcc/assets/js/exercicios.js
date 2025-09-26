document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    const tituloTreinoEl = document.getElementById('titulo-treino');
    const listaExerciciosEl = document.getElementById('lista-exercicios');
    const completeWorkoutBtn = document.getElementById('complete-workout-btn');
    const modal = document.getElementById('completion-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- Tema ---
    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (themeIcon) themeIcon.innerHTML = '&#x1F319;';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.innerHTML = '&#x2600;&#xFE0F;';
            localStorage.setItem('theme', 'light');
        }
    }
    setTheme(localStorage.getItem('theme') || 'light');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
        });
    }

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

    // --- Sessão ---
    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    async function requestComToken(url, options = {}) {
        let { access_token, refresh_token } = obterSessao();
        if (!access_token || !refresh_token) throw new Error("Token não encontrado");

        options.headers = {
            ...options.headers,
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        };

        let response = await fetch(url, options);
        let data = await response.json().catch(() => ({}));

        if (response.status === 401 || data?.error?.toLowerCase()?.includes("token")) {
            const novoAccess = await renovarToken(refresh_token);
            if (!novoAccess) throw new Error("Token inválido ou expirado");

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
                localStorage.setItem("access_token", data.result.access);
                return data.result.access;
            }
            return null;
        } catch (err) {
            console.error("Erro ao renovar token:", err);
            return null;
        }
    }

    // --- Carregar detalhes do treino ---
    const params = new URLSearchParams(window.location.search);
    const treinoId = params.get('id');

    async function carregarDetalhesDoTreino() {
        if (!treinoId) {
            tituloTreinoEl.textContent = 'Treino não encontrado!';
            if (completeWorkoutBtn) completeWorkoutBtn.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/treinos/listar_treino_exercicios/${treinoId}/`);
            const data = await res.json();

            if (!data.result) {
                tituloTreinoEl.textContent = 'Detalhes do treino não encontrados!';
                mostrarNotificacao('Detalhes do treino não foram encontrados.', 'erro');
                return;
            }

            const treino = data.result;
            tituloTreinoEl.textContent = treino.nome_treino;
            document.title = treino.nome_treino;

            listaExerciciosEl.innerHTML = '';
            treino.exercicios.forEach(exercicio => {
                const exercicioCard = document.createElement('div');
                exercicioCard.className = 'treino-card';
                exercicioCard.innerHTML = `
                <h2>${exercicio.nome_exercicio}</h2>
                <p>${exercicio.series} séries de ${exercicio.repeticoes} repetições</p>
                <p>${exercicio.descricao_exercicio}</p>
                ${exercicio.video_exercicio ? `<a href="${exercicio.video_exercicio}" target="_blank" style="color: #4a69bd; font-weight: bold">Assistir vídeo</a>` : ''}
            `;
                listaExerciciosEl.appendChild(exercicioCard);
            });

            const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            if (userProgress[treinoId]) {
                completeWorkoutBtn.style.display = 'none';
            } else {
                completeWorkoutBtn.style.display = 'flex';
                completeWorkoutBtn.style.justifyContent = 'center';
                completeWorkoutBtn.style.textAlign = 'center';
            }

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            tituloTreinoEl.textContent = 'Erro ao carregar o treino.';
            mostrarNotificacao(`Erro ao carregar o treino: ${error.message}`, 'erro');
        }
    }

// --- Registrar usuário no treino ---
    if (completeWorkoutBtn) {
        completeWorkoutBtn.addEventListener('click', async () => {
            completeWorkoutBtn.disabled = true;
            completeWorkoutBtn.textContent = 'Registrando...';

            try {
                const payload = { treino_id: treinoId, data: new Date().toISOString().split('T')[0] };
                const { response, data } = await requestComToken(
                    'http://127.0.0.1:8000/usuarios/inscrever_usuario_treino/',
                    { method: 'POST', body: JSON.stringify(payload) }
                );

                if (response.ok && data.result) {
                    const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
                    userProgress[treinoId] = 0;
                    localStorage.setItem('userProgress', JSON.stringify(userProgress));
                    mostrarNotificacao('Inscrição realizada com sucesso!', 'sucesso');
                    completeWorkoutBtn.style.display = 'none';
                } else {
                    mostrarNotificacao(`Erro: ${data.error || 'Não foi possível se inscrever'}`, 'erro');
                    completeWorkoutBtn.disabled = false;
                    completeWorkoutBtn.textContent = 'Registrar-se no treino';
                }
            } catch (err) {
                mostrarNotificacao(`Erro de conexão: ${err.message}`, 'erro');
                completeWorkoutBtn.disabled = false;
                completeWorkoutBtn.textContent = 'Registrar-se no treino';
            }
        });
    }

    // --- Modal ---
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
            window.location.href = 'dashboard.html';
        });
    }

    carregarDetalhesDoTreino();
});
