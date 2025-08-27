globalThis.auth = {}
globalThis.auth.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZWp6Z2x2cXNpeWR5Y3ZpdnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDgzOTQsImV4cCI6MjA1NzgyNDM5NH0.32ClzsWEgc_XdqXD4d8i7_AO4SOIjKjzQCPb_SjJBoU";
globalThis.auth.SUPABASE_URL = "https://xwejzglvqsiydycvivys.supabase.co/";

globalThis.supabase = window.supabase.createClient(globalThis.auth.SUPABASE_URL, globalThis.auth.SUPABASE_ANON_KEY);

// Funções auxiliares para UI (usadas na página de login)
const showLoginForm = () => {
    const loginContainer = document.getElementById('login-container');
    const userInfoContainer = document.getElementById('user-info-container');
    if (loginContainer && userInfoContainer) {
        loginContainer.classList.remove('hidden');
        userInfoContainer.classList.add('hidden');
    }
};

// Listener central de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    const currentPage = window.location.pathname;
    // A página de login é a raiz ou /index.html
    const isLoginPage = currentPage === '/' || currentPage.endsWith('/index.html');
    const user = session?.user;

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (user) {
            // Usuário está logado.
            if (isLoginPage) {
                // Se estiver na página de login, redireciona para /myrooms.
                window.location.href = '/painel';
            }
            // Se estiver em outra página (ex: /myrooms), não faz nada.
        } else {
            // Usuário não está logado.
            if (!isLoginPage) {
                // Se não estiver na página de login, redireciona para lá.
                window.location.href = '/';
            } else {
                // Se já está na página de login, mostra o formulário.
                showLoginForm();
            }
        }
    } else if (event === 'SIGNED_OUT') {
        // Usuário deslogou.
        if (!isLoginPage) {
            // Se não estiver na página de login, redireciona para lá.
            window.location.href = '/';
        } else {
            // Se já está na página de login, mostra o formulário.
            showLoginForm();
        }
    }
});


// Funções globais para serem usadas pelos botões no HTML
globalThis.auth.handleLogin = async (provider) => {
    const button = document.getElementById(`google-login-button`);
    if(button) {
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        button.disabled = true;
        if (buttonText) buttonText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    }

    const { error } = await globalThis.supabase.auth.signInWithOAuth({ provider: 'google' });

    if (error) {
        console.error(`Error logging in with ${provider}:`, error);
        if(button) {
            const buttonText = button.querySelector('.button-text');
            const spinner = button.querySelector('.spinner');
            button.disabled = false;
            if (buttonText) buttonText.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    }
};

globalThis.auth.handleLogout = async () => {
    await globalThis.supabase.auth.signOut();
};
