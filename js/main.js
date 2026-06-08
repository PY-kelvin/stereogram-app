// js/main.js
import { Auth } from './auth.js';
import { Progress } from './progress.js';
import { Map } from './map.js';
import { Game } from './game.js';

window.Auth = Auth;
window.Progress = Progress;
window.Map = Map;
window.Game = Game;

const App = {
    currentUser: null,
    notificationTimeout: null,

    init() {
        Auth.init();
        Map.init();
        Game.init();
        
        // Initial check
        Auth.checkSession();
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Handle specifics
        if (screenId === 'screen-game') {
            Game.resizeCanvas();
        }
    },

    showNotification(message, type = "success") {
        const notif = document.getElementById('notification');
        const notifMsg = document.getElementById('notification-message');
        
        notifMsg.innerText = message;
        notif.className = `notification ${type}`;
        notif.classList.remove('hidden');

        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        
        // Hide after 4 seconds
        this.notificationTimeout = setTimeout(() => {
            notif.classList.add('hidden');
        }, 4000);
    }
};

window.App = App;

// Bootstrap app on load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
