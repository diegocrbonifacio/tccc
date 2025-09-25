document.addEventListener('DOMContentLoaded', () => {
    const abaLogin = document.getElementById('aba-login');
    const abaCadastro = document.getElementById('aba-cadastro');
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    const msgErro = document.getElementById('msg-error');

    function salvarSessao({ usuario, access_token, refresh_token }) {
        if (usuario) localStorage.setItem("usuario", JSON.stringify(usuario));
        if (access_token) localStorage.setItem("access_token", access_token);
        if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    }

    function obterSessao() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const access_token = localStorage.getItem("access_token");
        const refresh_token = localStorage.getItem("refresh_token");
        return { usuario, access_token, refresh_token };
    }

    function limparSessao() {
        localStorage.removeItem("usuario");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    }


    if (formLogin) {
        msgErro.textContent = null
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // evita reload da página

            const dados = Object.fromEntries(new FormData(formLogin).entries());

            console.log(JSON.stringify(dados));

            try {
                const response = await fetch("http://127.0.0.1:8000/usuarios/login/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dados)
                });

                const data = await response.json();
                console.log("Resposta da API:", data);

                if (data.result && data.result.tokens) {
                    salvarSessao({
                        usuario: data.result.usuario,
                        access_token: data.result.tokens.access,
                        refresh_token: data.result.tokens.refresh
                    });
                } else {
                    msgErro.textContent = data.error;
                }
            } catch (err) {
                console.error(err);
                msgErro.textContent = "Erro ao conectar com o servidor"
            }
        });
    }

    if (abaLogin) {
        abaLogin.addEventListener('click', () => {
            msgErro.textContent = null
            ativarAba(abaLogin, formLogin);
        });
    }

    if (abaCadastro) {
        abaCadastro.addEventListener('click', () => {
            ativarAba(abaCadastro, formCadastro);
        });
    }

    function ativarAba(abaAtiva, formMostrar) {
        document.getElementById('aba-login').classList.remove('ativo');
        document.getElementById('aba-cadastro').classList.remove('ativo');
        abaAtiva.classList.add('ativo');

        document.getElementById('form-login').classList.remove('ativo-formulario');
        document.getElementById('form-cadastro').classList.remove('ativo-formulario');
        formMostrar.classList.add('ativo-formulario');
    }

    const botaoTema = document.getElementById('botao-tema');
    const iconeTema = document.getElementById('icone-tema');
    const body = document.body;

    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (iconeTema) iconeTema.innerHTML = '&#x1F319;';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            if (iconeTema) iconeTema.innerHTML = '&#x2600;&#xFE0F;';
            localStorage.setItem('theme', 'light');
        }
    }

    const temaSalvo = localStorage.getItem('theme');
    setTheme(temaSalvo || 'light');

    if (botaoTema) {
        botaoTema.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }
});
