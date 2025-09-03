document.addEventListener('DOMContentLoaded', () => {
    const abaLogin = document.getElementById('aba-login');
    const abaCadastro = document.getElementById('aba-cadastro');
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');

    if (abaLogin) {
        abaLogin.addEventListener('click', () => {
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
