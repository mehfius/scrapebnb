globalThis.auth = {};
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

/*         let currentUser = null;
        const checkRooms = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            currentUser = user;
            const { data: rooms, error } = await supabase.from('users_rooms').select('room::text, url').eq('user_id', currentUser.id);    
            console.log(rooms)    
            window.location.href = '/wizard/myrooms'
        }
        checkRooms(); */

supabase.auth.onAuthStateChange((event, session) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage === '/' || currentPage.endsWith('/index.html');
    const user = session?.user;

    const handleRedirect = (targetPath) => {
        if (window.location.pathname !== targetPath) {
            window.location.href = targetPath;
        }
    };

    if (user) {
        if (isLoginPage) {
            handleRedirect('/painel');
        }
    } else {
        if (!isLoginPage) {
            handleRedirect('/');
        } else {
            showLoginForm();
        }
    }
});

globalThis.auth.handleLogin = async (provider) => {
    const button = document.getElementById(`google-login-button`);
    if (button) {
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        button.disabled = true;
        if (buttonText) buttonText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    }

    const { error } = await globalThis.supabase.auth.signInWithOAuth({ provider: 'google' });

    if (error) {
        console.error(`Error logging in with ${provider}:`, error);
        if (button) {
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