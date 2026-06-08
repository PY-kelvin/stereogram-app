// js/progress.js
export const Progress = {
    loadUserData() {
        this.updateUI();
    },

    saveUser() {
        if (!window.App.currentUser) return;
        const email = window.App.currentUser.email;
        localStorage.setItem(`user_${email}`, JSON.stringify(window.App.currentUser));
    },

    completeSession() {
        const user = window.App.currentUser;
        if (!user) return;

        const today = new Date().toDateString();
        
        // Check if already completed today
        if (user.lastSessionDate === today) {
            window.App.showNotification("You've already completed today's exercise. Come back tomorrow!", "success");
            return;
        }

        // Update streak
        user.lastSessionDate = today;
        user.streak += 1;
        
        window.App.showNotification(`Great job! Daily streak: ${user.streak}/7`, "success");

        // Unlock Stage 2 if streak reaches 7
        if (user.streak >= 7 && !user.unlockedStages.includes(2)) {
            user.unlockedStages.push(2);
            window.App.showNotification("🎉 CONGRATULATIONS! Stage 2 Unlocked! 🎉", "success");
            if (window.Map) window.Map.animateUnlockStage2();
        }

        this.saveUser();
        this.updateUI();
    },

    updateUI() {
        const user = window.App.currentUser;
        if (!user) return;
        
        const streakCounter = document.getElementById('streak-counter');
        if (streakCounter) {
            streakCounter.innerText = `🔥 Days: ${user.streak}/7`;
        }
    }
};
