document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO MODO ESCURO (EXISTENTE) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

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

    // --- LÓGICA PARA CARREGAR DETALHES E MARCAR COMO CONCLUÍDO ---
    const params = new URLSearchParams(window.location.search);
    const treinoId = params.get('id');
    const tituloTreinoEl = document.getElementById('titulo-treino');
    const listaExerciciosEl = document.getElementById('lista-exercicios');
    const completeWorkoutBtn = document.getElementById('complete-workout-btn'); //substituir para viva em movimento
    
    
    // Elementos do Modal
    const modal = document.getElementById('completion-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    async function carregarDetalhesDoTreino() {
        if (!treinoId) {
            tituloTreinoEl.textContent = 'Treino não encontrado!';
            if(completeWorkoutBtn) completeWorkoutBtn.style.display = 'none';
            return;
        }
        try {
            const [resTreinos, resExercicios] = await Promise.all([
                fetch('../assets/data/treinos.json'), 
                fetch('../assets/data/exercicios_db.json')
            ]);
            const listaDeTreinos = await resTreinos.json();
            const dbDeExercicios = await resExercicios.json();
            const treinoInfo = listaDeTreinos.find(t => t.id == treinoId);
            const exerciciosDoTreino = dbDeExercicios[treinoId];
            if (!treinoInfo || !exerciciosDoTreino) {
                tituloTreinoEl.textContent = 'Detalhes do treino não encontrados!';
                return;
            }
            tituloTreinoEl.textContent = treinoInfo.titulo;
            document.title = treinoInfo.titulo;
            listaExerciciosEl.innerHTML = '';
            exerciciosDoTreino.forEach(exercicio => {
                const exercicioCard = document.createElement('div');
                exercicioCard.className = 'treino-card';
                exercicioCard.innerHTML = `<h2>${exercicio.nome}</h2><p>${exercicio.series} séries de ${exercicio.repeticoes} repetições</p>`;
                listaExerciciosEl.appendChild(exercicioCard);
            });
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            tituloTreinoEl.textContent = 'Erro ao carregar o treino.';
        }
    }

    // Evento para o botão de concluir treino
    if (completeWorkoutBtn) {
        completeWorkoutBtn.addEventListener('click', () => {
            if (!treinoId) return;

            let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
            userProgress[treinoId] = 100;
            localStorage.setItem('userProgress', JSON.stringify(userProgress));

            // Mostra o modal em vez do alert
            if(modal) modal.style.display = 'flex';
        });
    }

    // Evento para fechar o modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if(modal) modal.style.display = 'none';
            // Redireciona para o dashboard após fechar o modal
            window.location.href = 'dashboard.html';
        });
    }

    carregarDetalhesDoTreino();
});
