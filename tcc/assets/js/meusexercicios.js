document.addEventListener('DOMContentLoaded', () => {
    const tituloTreinoEl = document.getElementById('titulo-treino');
    const listaExerciciosEl = document.getElementById('lista-exercicios');
    const modal = document.getElementById('completion-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- Barra de progresso ---
    function atualizarBarraProgresso(total, concluidos) {
        const porcentagem = total ? Math.round((concluidos / total) * 100) : 0;

        let barra = document.getElementById('barra-progresso');
        if (!barra) {
            barra = document.createElement('div');
            barra.id = 'barra-progresso';
            barra.className = 'progress-bar-container';
            barra.innerHTML = '<div class="progress-bar"></div><p class="progress-text"></p>';
            document.querySelector('.main-content').prepend(barra);
        }

        barra.querySelector('.progress-bar').style.width = `${porcentagem}%`;
        barra.querySelector('.progress-text').textContent = `${porcentagem}% concluído`;
    }

    // --- Sessão ---
    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    // --- Request com atualização de token ---
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

        if (response.status === 401 || (data.error && data.error.toLowerCase().includes("token"))) {
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

    // --- Botão para concluir exercícios restantes ---
    function renderizarBotaoConcluir(exercicios) {
        let botaoConcluir = document.getElementById('btn-concluir-treino');
        if (botaoConcluir) botaoConcluir.remove();

        const total = exercicios.length;
        const concluidos = exercicios.filter(e => e.concluido).length;

        if (concluidos < total) {
            botaoConcluir = document.createElement('button');
            botaoConcluir.id = 'btn-concluir-treino';
            botaoConcluir.className = 'cta-button';
            botaoConcluir.textContent = 'Marcar treino como concluído';
            document.querySelector('.main-content').appendChild(botaoConcluir);

            botaoConcluir.addEventListener('click', async () => {
                exercicios.forEach(e => e.concluido = true);
                document.querySelectorAll('.exercicio-checkbox').forEach(cb => cb.checked = true);
                atualizarBarraProgresso(total, total);

                // Chamada opcional para API para atualizar todos como concluídos
                // await requestComToken(`{{base_url}}/usuarios/concluir_treino/${treinoUsuarioId}/`, { method: 'POST' });

                modal.style.display = 'flex';
                renderizarBotaoConcluir(exercicios);
            });
        }
    }

    // --- Carregar detalhes do treino ---
    async function carregarDetalhesDoTreino() {
        const treinoUsuarioId = new URLSearchParams(window.location.search).get('id');

        if (!treinoUsuarioId) {
            tituloTreinoEl.textContent = 'Treino não encontrado!';
            return;
        }

        try {
            const { response, data } = await requestComToken(`http://127.0.0.1:8000/usuarios/exercicios_treino_usuario/${treinoUsuarioId}/`);
            if (!response.ok || !data.result) {
                tituloTreinoEl.textContent = 'Detalhes do treino não encontrados!';
                return;
            }

            const treino = data.result;
            tituloTreinoEl.textContent = treino.treino;
            document.title = treino.treino;

            listaExerciciosEl.innerHTML = '';
            treino.exercicios.forEach(exercicio => {
                const exercicioCard = document.createElement('div');
                exercicioCard.className = 'treino-card';

                // Se já concluído, mostra "Concluído", senão botão
                const botaoOuStatus = exercicio.concluido
                    ? `<p style="font-weight: bold; color: green;">Concluído</p>`
                    : `<button class="card-link btn-concluir-exercicio" style="background: green">Marcar como concluído</button>`;

                exercicioCard.innerHTML = `
                    <h2>${exercicio.nome_exercicio}</h2>
                    <p>${exercicio.series} séries de ${exercicio.repeticoes} repetições</p>
                    <p>${exercicio.descricao_exercicio}</p>
                    ${exercicio.video_exercicio ? `<a href="${exercicio.video_exercicio}" target="_blank" style="color: #4a69bd; font-weight: bold">Assistir vídeo</a>` : ''}
                    ${botaoOuStatus}
    `;

                listaExerciciosEl.appendChild(exercicioCard);

                // Se existe botão, adiciona o evento de marcar como concluído
                if (!exercicio.concluido) {
                    const btn = exercicioCard.querySelector('.btn-concluir-exercicio');
                    btn.addEventListener('click', () => {
                        exercicio.concluido = true;
                        atualizarBarraProgresso(treino.exercicios.length, treino.exercicios.filter(e => e.concluido).length);
                        // Substitui o botão pelo texto "Concluído"
                        btn.replaceWith(document.createElement('p'));
                        btn.parentElement.querySelector('p').textContent = 'Concluído';
                        btn.parentElement.querySelector('p').style.fontWeight = 'bold';
                        btn.parentElement.querySelector('p').style.color = 'green';
                    });
                }
            });

            atualizarBarraProgresso(treino.exercicios.length, treino.exercicios.filter(e => e.concluido).length);
            renderizarBotaoConcluir(treino.exercicios);

            // Eventos de checkboxes individuais
            document.querySelectorAll('.exercicio-checkbox').forEach(cb => {
                cb.addEventListener('change', () => {
                    const idExercicio = parseInt(cb.dataset.id);
                    const exercicio = treino.exercicios.find(e => e.id_exercicio === idExercicio);
                    exercicio.concluido = cb.checked;

                    atualizarBarraProgresso(treino.exercicios.length, treino.exercicios.filter(e => e.concluido).length);
                    renderizarBotaoConcluir(treino.exercicios);
                });
            });

        } catch (err) {
            console.error('Erro ao carregar detalhes do treino:', err);
            tituloTreinoEl.textContent = 'Erro ao carregar o treino.';
        }
    }

    carregarDetalhesDoTreino();

    // --- Modal ---
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            window.location.href = 'meustreinos.html';
        });
    }
});
