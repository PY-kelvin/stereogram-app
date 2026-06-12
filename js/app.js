// Global variable to store the install prompt event
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome from showing the automatic mini-infobar
    e.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredPrompt = e;
    
    // Reveal our custom install buttons
    document.querySelectorAll('.btn-install-app').forEach(btn => {
        btn.classList.remove('hidden');
    });
});

// We need to wait for DOM to load before attaching click listeners to the buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-install-app').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (window.deferredPrompt) {
                // Show the native browser install prompt
                window.deferredPrompt.prompt();
                // Wait for the user to respond
                const { outcome } = await window.deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                // We've used the prompt, throw it away
                window.deferredPrompt = null;
                // Hide the buttons since it's installing!
                document.querySelectorAll('.btn-install-app').forEach(b => b.classList.add('hidden'));
            }
        });
    });
});

const Auth = {
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

        // Welcome Screen Start
        const btnWelcomeStart = document.getElementById('btn-welcome-start');
        if (btnWelcomeStart) {
            btnWelcomeStart.addEventListener('click', () => {
                // Play audio on tap
                const audio = document.getElementById('bgm-audio');
                if (audio && audio.paused) {
                    audio.play().catch(e => console.log('Audio autoplay blocked', e));
                }
                
                window.App.showScreen('screen-main-menu');
                if (window.Progress) window.Progress.loadUserData();
            });
        }

        // Form Submissions
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const animal = document.querySelector('input[name="animal"]:checked').value;
            this.register(username, password, animal);
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            this.login(username, password);
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            this.logout();
        });
        
        const btnLogoutMain = document.getElementById('btn-logout-main');
        if (btnLogoutMain) {
            btnLogoutMain.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    register(username, password, animal = 'cat') {
        if (localStorage.getItem(`user_${username}`)) {
            window.App.showNotification("Username already registered!", "warning");
            return;
        }

        const userData = {
            username: username,
            password: password,
            animal: animal,
            streak: 0,
            lastActivityDate: null,
            dailyProgress: 0,
            savedSession: null,
            unlockedStages: [1]
        };

        localStorage.setItem(`user_${username}`, JSON.stringify(userData));
        window.App.showNotification("Registration successful! Logging in...", "success");
        this.login(username, password);
    },

    login(username, password) {
        const userStr = localStorage.getItem(`user_${username}`);
        if (!userStr) {
            window.App.showNotification("User not found!", "warning");
            return;
        }

        const user = JSON.parse(userStr);
        if (user.password !== password) {
            window.App.showNotification("Incorrect password!", "warning");
            return;
        }

        localStorage.setItem('currentUser', username);
        window.App.currentUser = user;

        if (!user.unlockedStages) user.unlockedStages = [1];
        if (user.streak === undefined) user.streak = 0;
        if (!user.animal) user.animal = 'cat';
        if (user.dailyProgress === undefined) user.dailyProgress = 0;
        if (user.lastActivityDate === undefined) user.lastActivityDate = user.lastSessionDate || null;

        

        // Start BGM ONLY on successful login
        const audio = document.getElementById('bgm-audio');
        if (audio && audio.paused) {
            audio.play().catch(e => console.log('Audio autoplay blocked', e));
        }

        window.App.showScreen('screen-main-menu');
        window.App.showNotification(`Welcome back, ${username}!`, "success");

        if (window.Progress) window.Progress.loadUserData();
    },

    logout() {
        // Pause BGM on logout
        const audio = document.getElementById('bgm-audio');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        localStorage.removeItem('currentUser');
        window.App.currentUser = null;
        window.App.showScreen('screen-auth');
        document.getElementById('form-login').reset();
        document.getElementById('form-register').reset();
    },

    checkSession() {
        const username = localStorage.getItem('currentUser');
        if (username) {
            const userStr = localStorage.getItem(`user_${username}`);
            if (userStr) {
                const user = JSON.parse(userStr);
                
                

                window.App.currentUser = user;
                window.App.showScreen('screen-welcome');
                return true;
            }
        }
        window.App.showScreen('screen-auth');
        return false;
    }
};

const Progress = {
    loadUserData() {
        this.updateUI();
    },

    saveUser() {
        if (!window.App.currentUser) return;
        const username = window.App.currentUser.username;
        localStorage.setItem(`user_${username}`, JSON.stringify(window.App.currentUser));
    },

    recordPlayCount(stageNum) {
        try {
            const user = window.App.currentUser;
            if (!user) return;

            const today = new Date().toDateString();

            if (user.lastActivityDate !== today) {
                user.lastActivityDate = today;
                user.dailyProgress = 0;
                user.stageDailyProgress = { 1: 0, 2: 0, 3: 0 };
            }

            user.stagePlays = user.stagePlays || { 1: user.streak || 0, 2: 0, 3: 0 };
            user.stageDailyProgress = user.stageDailyProgress || { 1: 0, 2: 0, 3: 0 };

            let isExtraSession = false;

            if (user.stageDailyProgress[stageNum] >= 1) {
                isExtraSession = true; // Already played this stage today
            } else {
                user.stageDailyProgress[stageNum] = 1;
                user.stagePlays[stageNum] += 1;
            }

            if (user.dailyProgress >= 1) {
                isExtraSession = true; // For global map streak purposes
            } else {
                user.dailyProgress = 1;
                user.streak += 1;
            }

            this.saveUser();
            this.updateUI();
            
            if (window.Map) {
                window.Map.updateUI();
            }
        } catch (err) {
            alert("Error in recordPlayCount: " + err.message);
            console.error(err);
        }
    },

    recordTimeSpent(durationMins, stageNum) {
        const user = window.App.currentUser;
        if (!user || durationMins <= 0) return;
        
        const todayStr = new Date().toDateString();
        user.sessionHistory = user.sessionHistory || [];
        user.sessionHistory.push({
            dateStr: todayStr,
            timestamp: new Date().getTime(),
            durationMins: durationMins,
            stageNum: stageNum || 1
        });
        
        this.saveUser();
        this.updateUI();
    },

    updateUI() {
        const user = window.App.currentUser;
        if (!user) return;

        const streakCounter = document.getElementById('streak-counter');
        if (streakCounter) {
            const today = new Date().toDateString();
            let progressStr = "(0/1 today)";
            if (user.lastActivityDate === today && user.dailyProgress >= 1) {
                progressStr = "(Done today!)";
            }
            streakCounter.innerText = `🔥 Times: ${user.streak}/30 ${progressStr}`;
        }
    }
};

const Map = {');
const mapEndStr = '};\n\nconst Game = {');
const gameEndStr = 'window.App = App;';
const gameEnd = appCode.indexOf(gameEndStr);

if (gameStart === -1 || gameEnd === -1) {
    console.error('Game object not found.');
    process.exit(1);
}

const newGameCode = \`const Game = {
    canvas: null,
    ctx: null,
    animationId: null,
    isPlaying: false,
    timerInterval: null,
    timeLeft: 600,
    currentStageNode: '1A', // E.g., '1A', '1B', '2A', etc.
    currentImageIndex: 0,
    hasStartedCurrentSession: false,
    uiTimeout: null,
    
    stageImages: {
        '1A': ['stage 1/stage 1A.png?v=4', 'stage 1/stage 1B.png?v=4', 'stage 1/stage 1C.png?v=4'],
        '1B': ['stage 1/Stage 1D.png?v=4', 'stage 1/Stage 1E.png?v=4'],
        '2A': ['stage 2/stage 2A.png?v=2', 'stage 2/stage 2B.png?v=2', 'stage 2/stage 2C.png?v=2'],
        '2B': ['stage 2/stage 2D.png?v=2', 'stage 2/stage 2E.png?v=2'],
        '3A': ['stage 3/Stage 3C.png?v=2', 'stage 3/Stage 3A.png?v=2', 'stage 3/Stage 3B.png?v=2'],
        '3B': ['stage 3/Stage 3D.png?v=2', 'stage 3/Stage 3E.png?v=2']
    },

    stageRatios: {
        '1A': {
            'stage 1/stage 1A.png?v=4': 0.3778,
            'stage 1/stage 1B.png?v=4': 0.3878,
            'stage 1/stage 1C.png?v=4': 0.3856,
        },
        '1B': {
            'stage 1/Stage 1D.png?v=4': 0.3691,
            'stage 1/Stage 1E.png?v=4': 0.3578,
        },
        '2A': {
            'stage 2/stage 2A.png?v=2': 0.5185,
            'stage 2/stage 2B.png?v=2': 0.5587,
            'stage 2/stage 2C.png?v=2': 0.5620,
        },
        '2B': {
            'stage 2/stage 2D.png?v=2': 0.5385,
            'stage 2/stage 2E.png?v=2': 0.5826,
        },
        '3A': {
            'stage 3/stage 3A.png?v=2': 0.6257,
            'stage 3/stage 3B.png?v=2': 0.6309,
            'stage 3/Stage 3C.png?v=2': 0.5906,
        },
        '3B': {
            'stage 3/stage 3D.png?v=2': 0.5910,
            'stage 3/stage 3E.png?v=2': 0.6259,
        }
    },

    init() {
        this.currentStageNode = '1A';
        this.currentImageIndex = 0;
        this.bindEvents();
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying || (this.timeLeft > 0 && this.timeLeft < 600)) {
                this.pauseTimer();
            }
        });
    },

    bindEvents() {
        document.getElementById('btn-back-map').addEventListener('click', () => {
            this.stopGame();
            window.App.showMapScreen();
        });

        // UI Auto-Hide
        const resetUI = () => this.resetUITimer();
        document.getElementById('screen-game').addEventListener('click', resetUI);
        document.getElementById('screen-game').addEventListener('touchstart', resetUI);
        document.getElementById('screen-game').addEventListener('mousemove', resetUI);
        
        document.getElementById('btn-toggle-timer').addEventListener('click', (e) => {
            if (this.isPlaying) {
                this.pauseTimer();
                e.target.innerText = "▶";
            } else {
                this.startTimer();
                if (this.isPlaying) {
                    e.target.innerText = "⏸";
                }
            }
        });

        document.getElementById('btn-save-rest').addEventListener('click', () => {
            if (!this.isPlaying && this.timeLeft === 600) {
                window.App.showNotification("You haven't started yet!", "warning");
                return;
            }
            this.pauseTimer();
            const user = window.App.currentUser;
            user.savedSession = {
                timeLeft: this.timeLeft,
                timestamp: new Date().getTime()
            };
            if (window.Progress) window.Progress.saveUser();
            window.App.showNotification("Progress saved! You can resume within 12 hours.", "success");
            this.stopGame();
            window.App.showMapScreen();
        });

        document.getElementById('btn-img-prev').addEventListener('click', () => {
            if (this.hasStartedCurrentSession) {
                window.App.showNotification("Cannot change picture after starting the timer.", "warning");
                return;
            }
            const images = this.stageImages[this.currentStageNode];
            let maxCount = images.length;
            this.currentImageIndex = (this.currentImageIndex - 1 + maxCount) % maxCount;
            this.loadImage(this.currentStageNode);
        });

        document.getElementById('btn-img-next').addEventListener('click', () => {
            if (this.hasStartedCurrentSession) {
                window.App.showNotification("Cannot change picture after starting the timer.", "warning");
                return;
            }
            const images = this.stageImages[this.currentStageNode];
            let maxCount = images.length;
            this.currentImageIndex = (this.currentImageIndex + 1) % maxCount;
            this.loadImage(this.currentStageNode);
        });
    },

    startStage(nodeName) {
        this.currentStageNode = nodeName;
        this.currentImageIndex = 0;
        document.getElementById('current-stage-title').innerText = "Stage " + nodeName;
        this.timeLeft = 600;
        this.hasStartedCurrentSession = false;

        const user = window.App.currentUser;
        if (user && user.savedSession) {
            const now = new Date().getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            if (now - user.savedSession.timestamp < twelveHours) {
                this.timeLeft = user.savedSession.timeLeft;
                window.App.showNotification("Resumed from previous save!", "success");
            }
            delete user.savedSession;
            if (window.Progress) window.Progress.saveUser();
        }

        this.updateTimerDisplay();
        this.loadImage(nodeName);
        window.App.showScreen('screen-game');
    },

    loadImage(nodeName) {
        const images = this.stageImages[nodeName] || this.stageImages['1A'];
        const imgPath = images[this.currentImageIndex];
        const gameImageEl = document.getElementById('game-image');
        
        gameImageEl.src = imgPath;

        let cmValue = 4.0;
        if (nodeName.startsWith('2')) cmValue = 5.0;
        if (nodeName.startsWith('3')) cmValue = 6.0;

        const ratios = this.stageRatios[nodeName];
        if (ratios && ratios[imgPath]) {
            const ratio = ratios[imgPath];
            const ppcm = window.App.pixelsPerCm || 37.795;
            const targetWidthPx = (cmValue * ppcm) / ratio;
            gameImageEl.style.width = targetWidthPx + 'px';
            gameImageEl.style.height = 'auto';
            gameImageEl.style.maxWidth = 'none';
            gameImageEl.style.maxHeight = 'none';
            gameImageEl.style.objectFit = 'fill';
        } else {
            gameImageEl.style.width = '';
            gameImageEl.style.height = '';
            gameImageEl.style.maxWidth = '';
            gameImageEl.style.maxHeight = '';
            gameImageEl.style.objectFit = '';
        }
    },

    stopGame() {
        this.pauseTimer();
        this.isPlaying = false;
        document.getElementById('screen-game').classList.remove('focus-mode');
    },

    startTimer() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.hasStartedCurrentSession = true;
        document.getElementById('screen-game').classList.add('focus-mode');
        this.resetUITimer();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.pauseTimer();
                this.completeSession();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        document.getElementById('screen-game').classList.remove('focus-mode');
        document.getElementById('btn-toggle-timer').innerText = "▶";
    },

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        document.getElementById('timer-display').innerText = 
            \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
    },

    resetUITimer() {
        const uis = document.querySelectorAll('.game-ui');
        uis.forEach(ui => ui.style.opacity = '1');
        
        if (this.uiTimeout) clearTimeout(this.uiTimeout);
        
        if (this.isPlaying) {
            this.uiTimeout = setTimeout(() => {
                uis.forEach(ui => ui.style.opacity = '0');
            }, 3000);
        }
    },

    completeSession() {
        window.App.showNotification("Session Complete! Great Job!", "success");
        this.stopGame();

        const user = window.App.currentUser;
        if (!user) return;

        const now = new Date();
        const dateStr = now.toDateString();

        user.sessionHistory = user.sessionHistory || [];
        const lastSession = user.sessionHistory[user.sessionHistory.length - 1];

        user.sessionHistory.push({
            dateStr: dateStr,
            timestamp: now.getTime(),
            durationMins: 10,
            stage: this.currentStageNode
        });

        // Add streak logic (max 1 per day)
        if (!alreadyDoneToday) {
            user.streak = (user.streak || 0) + 1;
        }

        if (window.Progress) window.Progress.saveUser();
        window.App.showMapScreen();
    },

    resizeCanvas() {
        // Unused in current logic
    }
};

\n\n\`

window.App = App;
window.ProgressReport = ProgressReport;
window.Menu = Menu;

const Confetti = {
    particles: [],
    canvas: null,
    ctx: null,
    animationId: null,
    colors: ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#a06cd5', '#ff9f1c'],

    start() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        this.particles = [];
        for (let i = 0; i < 150; i++) {
            this.particles.push(this.createParticle());
        }

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.update();
    },

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        window.removeEventListener('resize', this.resize.bind(this));
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight,
            size: Math.random() * 10 + 5,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        };
    },

    update() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let p of this.particles) {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            if (p.y > this.canvas.height) {
                p.y = -20;
                p.x = Math.random() * this.canvas.width;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        }

        this.animationId = requestAnimationFrame(this.update.bind(this));
    }
};
window.Confetti = Confetti;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
    ProgressReport.init();
    Menu.init();

    const btnCloseReward = document.getElementById('btn-close-reward');
    if (btnCloseReward) {
        btnCloseReward.addEventListener('click', () => {
            document.getElementById('reward-modal').classList.add('hidden');
            window.Confetti.stop();
            window.App.showMapScreen();
        });
    }
});
