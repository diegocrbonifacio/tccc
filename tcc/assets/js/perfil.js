document.addEventListener('DOMContentLoaded', () => {
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

    const uploadInput = document.getElementById('upload-input');
    const profilePic = document.getElementById('profile-pic');

    async function carregarPerfil() {
        try {
            const savedImage = localStorage.getItem('profileImage');
            if (savedImage) {
                profilePic.src = savedImage;
            }

            const response = await fetch('../assets/data/perfil_db.json');
            if (!response.ok) throw new Error('Não foi possível carregar os dados do perfil.');
            
            const perfil = await response.json();
            
            if (!savedImage && perfil.fotoUrl) {
                profilePic.src = perfil.fotoUrl;
            }

            profilePic.alt = `Foto de ${perfil.nome}`;
            document.getElementById('profile-name').textContent = perfil.nome;
            document.getElementById('profile-email').textContent = perfil.email;
            document.getElementById('profile-height').textContent = perfil.altura;
            document.getElementById('profile-weight').textContent = perfil.peso;
            document.getElementById('profile-age').textContent = perfil.idade;
            document.getElementById('profile-member-since').textContent = perfil.membroDesde;
            document.title = `Perfil de ${perfil.nome}`;

        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            document.getElementById('profile-name').textContent = "Erro ao carregar perfil";
        }
    }

    if(uploadInput) {
        uploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDataUrl = e.target.result;
                profilePic.src = imageDataUrl;
                localStorage.setItem('profileImage', imageDataUrl);
            };
            reader.readAsDataURL(file);
        });
    }

    carregarPerfil();
});
