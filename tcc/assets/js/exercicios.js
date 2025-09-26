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

    // --- Detalhes do Treino ---
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
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            tituloTreinoEl.textContent = 'Erro ao carregar o treino.';
        }
    }


    // --- Botão de concluir treino ---
    if (completeWorkoutBtn) {
        completeWorkoutBtn.addEventListener('click', () => {
            if (!treinoId) return;
            let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            userProgress[treinoId] = 100;
            localStorage.setItem('userProgress', JSON.stringify(userProgress));

            if (modal) modal.style.display = 'flex';
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
            window.location.href = 'dashboard.html';
        });
    }

    carregarDetalhesDoTreino();
});
