globalThis.auth = {}
globalThis.auth.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZWp6Z2x2cXNpeWR5Y3ZpdnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDgzOTQsImV4cCI6MjA1NzgyNDM5NH0.32ClzsWEgc_XdqXD4d8i7_AO4SOIjKjzQCPb_SjJBoU";
globalThis.auth.SUPABASE_URL = "https://xwejzglvqsiydycvivys.supabase.co/";

globalThis.supabase = window.supabase.createClient(globalThis.auth.SUPABASE_URL, globalThis.auth.SUPABASE_ANON_KEY);

const showLoginForm = () => {
    const loginContainer = document.getElementById('login-container');
    const userInfoContainer = document.getElementById('user-info-container');
    if (loginContainer && userInfoContainer) {
        loginContainer.classList.remove('hidden');
        userInfoContainer.classList.add('hidden');
    }
};

supabase.auth.onAuthStateChange(async (event, session) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage === '/' || currentPage.endsWith('/index.html');
    const isWizardPage = currentPage.startsWith('/wizard');
    const user = session?.user;
  
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
       
        if (user) {
         
            const { data: userRooms, error } = await supabase
                .from('users_rooms')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);
         console.log(userRooms.length)
            if (error) {
                console.error('Error checking user rooms:', error);
                // Se der erro, e estiver na pág de login, vai pro painel. Senão, fica onde está.
                if (isLoginPage) window.location.href = '/painel';
            } else if (userRooms && userRooms.length === 0) {
                // Usuário logado, mas SEM salas.
                // Se ele NÃO estiver já no wizard, redireciona para lá.
                if (!isWizardPage) {
                    window.location.href = '/wizard/myrooms';
                }
            } else {
                // Usuário logado e COM salas.
                // Se ele estiver na página de login, redireciona para o painel.
                if (isLoginPage) {
                    window.location.href = '/painel';
                }
            }
        } else {
        
            // Usuário não está logado.
            // Se não estiver na pág de login, redireciona para lá.
            if (!isLoginPage) {
                window.location.href = '/';
            } else {
                showLoginForm();
            }
        }
    } else if (event === 'SIGNED_OUT') {
        if (!isLoginPage) {
            window.location.href = '/';
        } else {
            showLoginForm();
        }
    }
});


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