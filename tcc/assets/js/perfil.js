document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const profilePic = document.getElementById('profile-pic');

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

    // --- Sessão ---
    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const access_token = localStorage.getItem('access_token');
        const refresh_token = localStorage.getItem('refresh_token');
        return { usuario, access_token, refresh_token };
    }

    // --- Renovar token ---
    async function renovarToken(refresh_token) {
        try {
            const response = await fetch('http://127.0.0.1:8000/usuarios/refresh_token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token })
            });
            const data = await response.json();
            if (data.result && data.result.access) {
                localStorage.setItem('access_token', data.result.access);
                return data.result.access;
            }
            return null;
        } catch (err) {
            console.error('Erro ao renovar token:', err);
            return null;
        }
    }

    // --- Request com token e renovação automática ---
    async function requestComToken(url, options = {}) {
        let { access_token, refresh_token } = obterSessao();
        if (!access_token || !refresh_token) throw new Error('Token não encontrado');

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        let response = await fetch(url, options);
        let data = await response.json().catch(() => ({}));

        // Se token expirou, tenta renovar
        if (response.status === 401 || data?.error?.toLowerCase().includes('token')) {
            const novoAccess = await renovarToken(refresh_token);
            if (!novoAccess) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = 'login.html';
                throw new Error('Token inválido ou expirado');
            }
            options.headers['Authorization'] = `Bearer ${novoAccess}`;
            response = await fetch(url, options);
            data = await response.json().catch(() => ({}));
        }

        return { response, data };
    }

    // --- Calcular idade ---
    function calcularIdade(dataNascimento) {
        if (!dataNascimento) return '- -';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
        return idade;
    }

    // --- Carregar dados do usuário ---
    async function carregarPerfil() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) {
            console.error('Usuário não encontrado no localStorage.');
            return;
        }

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = usuario.nome || '- -';

        const emailEl = document.getElementById('profile-email');
        if (emailEl) emailEl.textContent = usuario.email || '- -';

        const ageEl = document.getElementById('profile-age');
        if (ageEl) ageEl.textContent = calcularIdade(usuario.data_nascimento);

        document.title = `Perfil de ${usuario.nome || ''}`;

        if (profilePic) {
            profilePic.alt = `Foto de ${usuario.nome || ''}`;
        }

        // Histórico do usuário para peso e altura
        try {
            const { response, data } = await requestComToken('http://127.0.0.1:8000/usuarios/listar_historico_usuario/');
            const weightEl = document.getElementById('profile-weight');
            const heightEl = document.getElementById('profile-height');

            let peso = '- -';
            let altura = '- -';

            if (response.ok && data && Array.isArray(data.result) && data.result.length > 0) {
                const ultimoHistorico = data.result[data.result.length - 1];
                peso = ultimoHistorico.usuario_peso ?? '- -';
                altura = ultimoHistorico.usuario_altura ?? '- -';
            }

            if (weightEl) weightEl.textContent = peso;
            if (heightEl) heightEl.textContent = altura;
        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
            const weightEl = document.getElementById('profile-weight');
            const heightEl = document.getElementById('profile-height');
            if (weightEl) weightEl.textContent = '- -';
            if (heightEl) heightEl.textContent = '- -';
        }
    }

    carregarPerfil();
});
