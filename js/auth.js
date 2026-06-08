// js/auth.js
export const Auth = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const loginTab = document.getElementById('tab-login');
        const regTab = document.getElementById('tab-register');
        const loginForm = document.getElementById('form-login');
        const regForm = document.getElementById('form-register');

        // Tab Switching
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            regTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            regForm.classList.add('hidden');
        });

        regTab.addEventListener('click', () => {
            regTab.classList.add('active');
            loginTab.classList.remove('active');
            regForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });

        // Form Submissions
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            this.register(email, password);
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            this.login(email, password);
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            this.logout();
        });
    },

    register(email, password) {
        // Simple validation
        if (localStorage.getItem(`user_${email}`)) {
            window.App.showNotification("Email already registered!", "warning");
            return;
        }

        const userData = {
            email: email,
            password: password, // In a real app, hash this!
            streak: 0,
            lastSessionDate: null,
            unlockedStages: [1] // Stage 1 is always unlocked
        };

        localStorage.setItem(`user_${email}`, JSON.stringify(userData));
        window.App.showNotification("Registration successful! Logging in...", "success");
        this.login(email, password);
    },

    login(email, password) {
        const userStr = localStorage.getItem(`user_${email}`);
        if (!userStr) {
            window.App.showNotification("User not found!", "warning");
            return;
        }

        const user = JSON.parse(userStr);
        if (user.password !== password) {
            window.App.showNotification("Incorrect password!", "warning");
            return;
        }

        // Login success
        localStorage.setItem('currentUser', email);
        window.App.currentUser = user;
        
        // Ensure user obj is up to date with new fields if we add any
        if(!user.unlockedStages) user.unlockedStages = [1];
        if(user.streak === undefined) user.streak = 0;

        window.App.showScreen('screen-map');
        window.App.showNotification(`Welcome back, ${email.split('@')[0]}!`, "success");
        
        // Notify Progress module
        if (window.Progress) window.Progress.loadUserData();
        if (window.Map) window.Map.updateUI();
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.App.currentUser = null;
        window.App.showScreen('screen-auth');
        
        // Reset forms
        document.getElementById('form-login').reset();
        document.getElementById('form-register').reset();
    },

    checkSession() {
        const email = localStorage.getItem('currentUser');
        if (email) {
            const userStr = localStorage.getItem(`user_${email}`);
            if (userStr) {
                window.App.currentUser = JSON.parse(userStr);
                window.App.showScreen('screen-map');
                if (window.Progress) window.Progress.loadUserData();
                if (window.Map) window.Map.updateUI();
                return true;
            }
        }
        window.App.showScreen('screen-auth');
        return false;
    }
};
