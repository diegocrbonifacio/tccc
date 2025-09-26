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

    setTheme(localStorage.getItem('theme') || 'light');
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
        });
    }

    // --- Função para fazer requisição com atualização de token ---
    async function requestComToken(url, options = {}) {
        let { access_token, refresh_token } = obterSessao();

        if (!access_token || !refresh_token) {
            throw new Error("Token não encontrado");
        }

        options.headers = {
            ...options.headers,
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        };

        let response = await fetch(url, options);
        let data = await response.json().catch(() => ({}));

        if (response.status === 401 || (data.error && data.error.toLowerCase().includes("token"))) {
            // renovar token
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

    function formatarDataBR(dataISO) {
        if (!dataISO) return '';
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // --- Renderização dos treinos ---
    function renderizarCardsTreinosInscritos(listaDeTreinos, progressoUsuario = {}) {
        const container = document.getElementById('card-container');
        if (!container) return;
        container.innerHTML = '';

        if (!listaDeTreinos || listaDeTreinos.length === 0) {
            container.innerHTML = '<p>Você ainda não está inscrito em nenhum treino.</p>';
            return;
        }

        listaDeTreinos.forEach(treino => {
            // Calcula a porcentagem de progresso
            const totalExercicios = treino.exercicios?.length || 0;
            const exerciciosConcluidos = progressoUsuario[treino.id_treino_usuario] || 0;
            const porcentagem = totalExercicios ? Math.round((exerciciosConcluidos / totalExercicios) * 100) : 0;

            const cardHTML = `
            <div class="treino-card">
                <img src="${treino.url_imagem_treino}" alt="${treino.nome_treino}" class="card-image"/>
                <div class="card-content">
                    <h2>${treino.nome_treino}</h2>
                    <p>${treino.descricao_treino}</p>
                    <p>Data: ${formatarDataBR(treino.data)}</p>

                    <!-- Barra de progresso -->
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${porcentagem}%;"></div>
                    </div>
                    <p>${porcentagem}% concluído</p>

                    <a href="meusexercicios.html?id=${treino.id_treino_usuario}" class="card-link">Ver Treino</a>
                </div>
            </div>
        `;
            container.innerHTML += cardHTML;
        });
    }

    // --- Carregar treinos do usuário usando token ---
    async function carregarTreinosDoUsuario() {
        const container = document.getElementById('card-container');
        if (!container) return;

        try {
            const { response, data } = await requestComToken("http://127.0.0.1:8000/usuarios/treinos_usuario/");
            if (!response.ok) throw new Error('Falha ao buscar os treinos do usuário');

            const listaDeTreinos = data.result?.treinos || [];

            // Filtrar apenas treinos pendentes
            const treinosPendentes = listaDeTreinos.filter(t => !t.treinou);

            // Se não houver treinos pendentes, exibe a mensagem
            if (treinosPendentes.length === 0) {
                container.innerHTML = '<p>Você ainda não está inscrito em nenhum treino.</p>';
                return;
            }

            // Buscar exercícios de cada treino pendente
            const treinosComExercicios = await Promise.all(
                treinosPendentes.map(async treino => {
                    const { data: dataEx } = await requestComToken(
                        `http://127.0.0.1:8000/usuarios/exercicios_treino_usuario/${treino.id_treino_usuario}/`
                    );
                    return { treino, exercicios: dataEx.result?.exercicios || [] };
                })
            );

            // Renderizar apenas treinos pendentes
            container.innerHTML = ''; // limpa container
            treinosComExercicios.forEach(({ treino, exercicios }) => {
                const totalExercicios = exercicios.length;
                const exerciciosConcluidos = exercicios.filter(e => e.concluido).length;
                const porcentagem = totalExercicios ? Math.round((exerciciosConcluidos / totalExercicios) * 100) : 0;

                const cardHTML = `
                <div class="treino-card">
                    <img src="${treino.url_imagem_treino}" alt="${treino.nome_treino}" class="card-image"/>
                    <div class="card-content">
                        <h2>${treino.nome_treino}</h2>
                        <p>${treino.descricao_treino}</p>
                        <p>Data: ${formatarDataBR(treino.data)}</p>

                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${porcentagem}%;"></div>
                        </div>
                        <p>${porcentagem}% concluído</p>

                        <a href="meusexercicios.html?id=${treino.id_treino_usuario}" class="card-link">Ver Treino</a>
                    </div>
                </div>
            `;

                container.innerHTML += cardHTML;
            });

        } catch (error) {
            console.error('Erro ao carregar os treinos:', error);
            container.innerHTML = '<p>Não foi possível carregar seus treinos. Tente novamente mais tarde.</p>';
        }
    }

    carregarTreinosDoUsuario();
});
