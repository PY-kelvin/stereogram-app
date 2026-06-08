// js/map.js
export const Map = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const node1 = document.getElementById('node-stage1');
        const node2 = document.getElementById('node-stage2');

        node1.addEventListener('click', () => {
            this.moveToStage(1);
        });

        node2.addEventListener('click', () => {
            const user = window.App.currentUser;
            if (user && user.unlockedStages.includes(2)) {
                this.moveToStage(2);
            } else {
                window.App.showNotification("Stage 2 is locked! Complete 7 days to unlock.", "warning");
            }
        });
    },

    updateUI() {
        const user = window.App.currentUser;
        if (!user) return;

        const node2 = document.getElementById('node-stage2');
        const avatar = document.getElementById('player-avatar');

        if (user.unlockedStages.includes(2)) {
            node2.classList.remove('locked');
            node2.querySelector('.node-icon').innerText = '😼'; // Unlocked cat
            
            // Move avatar to stage 2 if they are selecting it, or default to 1
            // For now just keep avatar at 1 until they click 2
        } else {
            node2.classList.add('locked');
            node2.querySelector('.node-icon').innerText = '🔒';
        }
        
        // Reset avatar position
        avatar.style.top = '50px';
        avatar.style.transform = 'translate(-50%, 20px)';
    },

    moveToStage(stageNum) {
        const avatar = document.getElementById('player-avatar');
        
        if (stageNum === 1) {
            avatar.style.top = '50px';
            setTimeout(() => {
                if (window.Game) window.Game.startStage(1);
            }, 1000); // Wait for animal movement animation
        } else if (stageNum === 2) {
            avatar.style.top = 'calc(100% - 110px)'; // Move to bottom stage
            setTimeout(() => {
                if (window.Game) window.Game.startStage(2);
            }, 1000); // Wait for animal movement animation
        }
    },

    animateUnlockStage2() {
        const node2 = document.getElementById('node-stage2');
        node2.classList.remove('locked');
        node2.querySelector('.node-icon').innerText = '😼';
        
        // Little bounce animation
        node2.style.transform = 'scale(1.3)';
        setTimeout(() => {
            node2.style.transform = 'scale(1)';
        }, 500);
    }
};
