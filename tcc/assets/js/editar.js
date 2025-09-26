document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const form = document.getElementById('edit-profile-form');
    const nameInput = document.getElementById('edit-name');
    const emailInput = document.getElementById('edit-email');
    const heightInput = document.getElementById('edit-height');
    const weightInput = document.getElementById('edit-weight');

    // --- Tema ---
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
            const isDark = body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    // --- Sessão ---
    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    function salvarSessao({ access_token }) {
        if (access_token) localStorage.setItem("access_token", access_token);
    }

    // --- Renovar token ---
    async function renovarToken(refresh_token) {
        try {
            const response = await fetch("http://127.0.0.1:8000/usuarios/refresh_token/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token })
            });
            const data = await response.json();
            if (data.result && data.result.access) {
                salvarSessao({ access_token: data.result.access });
                return data.result.access;
            }
            return null;
        } catch(err) {
            console.error("Erro ao renovar token:", err);
            return null;
        }
    }

    // --- Request com token + renovação ---
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
            if (!novoAccess) {
                alert("Sessão expirada. Faça login novamente.");
                window.location.href = "login.html";
                throw new Error("Token inválido ou expirado");
            }

            options.headers["Authorization"] = `Bearer ${novoAccess}`;
            response = await fetch(url, options);
            data = await response.json().catch(() => ({}));
        }

        return { response, data };
    }

    // --- Calcular idade ---
    function calcularIdade(dataNascimento) {
        if (!dataNascimento) return '';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
        return idade;
    }

    // --- Carregar dados do usuário e preencher formulário ---
    async function carregarDados() {
        const { usuario } = obterSessao();
        if (!usuario) return;

        // Campos básicos
        nameInput.value = usuario.nome || '';
        emailInput.value = usuario.email || '';

        // Buscar histórico para preencher peso e altura
        try {
            const { response, data } = await requestComToken("http://127.0.0.1:8000/usuarios/listar_historico_usuario/");
            if (response.ok && data && Array.isArray(data.result) && data.result.length > 0) {
                const ultimoHistorico = data.result[data.result.length - 1];
                weightInput.value = ultimoHistorico.usuario_peso || '';
                heightInput.value = ultimoHistorico.usuario_altura || '';
            } else {
                weightInput.value = '';
                heightInput.value = '';
            }
        } catch(err) {
            console.error("Erro ao buscar histórico:", err);
            weightInput.value = '';
            heightInput.value = '';
        }
    }

    carregarDados();

    // --- Enviar atualização ---
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { usuario } = obterSessao();
            if (!usuario) return;

            const payload = {
                usuario_peso: parseFloat(weightInput.value) || 0,
                usuario_altura: parseFloat(heightInput.value) || 0,
                data: new Date().toISOString().split('T')[0],
                circunferencias: []
            };

            try {
                const { response, data } = await requestComToken("http://127.0.0.1:8000/usuarios/registrar_historico_usuario/", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert("Perfil atualizado com sucesso!");
                    window.location.href = "perfil.html";
                } else {
                    alert(data.error || "Erro ao atualizar perfil");
                }
            } catch(err) {
                console.error(err);
                alert("Erro ao conectar com o servidor");
            }
        });
    }
});
