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

        window.App.showScreen('screen-main-menu');
        window.App.showNotification(`Welcome back, ${username}!`, "success");

        if (window.Progress) window.Progress.loadUserData();
        if (window.Map) window.Map.updateUI();
    },

    logout() {
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
                window.App.currentUser = JSON.parse(userStr);
                window.App.showScreen('screen-main-menu');
                if (window.Progress) window.Progress.loadUserData();
                if (window.Map) window.Map.updateUI();
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

    completeSession() {
        const user = window.App.currentUser;
        if (!user) return;

        const today = new Date().toDateString();

        if (user.lastActivityDate !== today) {
            user.lastActivityDate = today;
            user.dailyProgress = 0;
        }

        const todayStr = new Date().toDateString();
        user.sessionHistory = user.sessionHistory || [];
        user.sessionHistory.push({
            dateStr: todayStr,
            timestamp: new Date().getTime(),
            durationMins: 10
        });

        if (user.dailyProgress >= 1) {
            window.App.showNotification("Extra session completed! Checked in Progress Report.", "success");
            window.App.showScreen('screen-map');
            this.saveUser();
            return;
        }

        user.dailyProgress = 1;
        user.streak += 1;
        
        window.App.showNotification(`Great job! Times completed: ${user.streak}/30`, "success");

        setTimeout(() => {
            window.App.showNotification("Please take an eye break and rest your eyes.", "warning");
        }, 3000);

        if (user.streak >= 30 && !user.unlockedStages.includes(2)) {
            user.unlockedStages.push(2);
            window.App.showNotification("🎉 CONGRATULATIONS! Stage 2 Unlocked! 🎉", "success");
            if (window.Map) window.Map.animateUnlockStage(2);
        }
        
        if (user.streak >= 60 && !user.unlockedStages.includes(3)) {
            user.unlockedStages.push(3);
            window.App.showNotification("🎉 CONGRATULATIONS! Stage 3 Unlocked! 🎉", "success");
            if (window.Map) window.Map.animateUnlockStage(3);
        }
        window.App.showScreen('screen-map');

        this.saveUser();
        
        if (window.Map) {
            window.Map.animateStep(user.streak - 1, user.streak);
        }
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

const Map = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const node1 = document.getElementById('node-stage1');
        const node2 = document.getElementById('node-stage2');
        const node3 = document.getElementById('node-stage3');

        node1.addEventListener('click', () => {
            this.moveToStage(1);
        });

        node2.addEventListener('click', () => {
            const user = window.App.currentUser;
            if (user && user.unlockedStages.includes(2)) {
                this.moveToStage(2);
            } else {
                this.pwdTargetStage = 2;
                document.getElementById('password-modal').classList.remove('hidden');
                document.getElementById('admin-password').value = '';
            }
        });

        node3.addEventListener('click', () => {
            const user = window.App.currentUser;
            if (user && user.unlockedStages.includes(3)) {
                this.moveToStage(3);
            } else {
                this.pwdTargetStage = 3;
                document.getElementById('password-modal').classList.remove('hidden');
                document.getElementById('admin-password').value = '';
            }
        });

        document.getElementById('btn-cancel-pwd').addEventListener('click', () => {
            document.getElementById('password-modal').classList.add('hidden');
        });

        document.getElementById('btn-submit-pwd').addEventListener('click', () => {
            const rawPwd = document.getElementById('admin-password').value;
            const pwd = rawPwd.trim().toLowerCase();
            const user = window.App.currentUser;
            
            if (this.pwdTargetStage === 2) {
                if (pwd === 'orthoptics') {
                    document.getElementById('password-modal').classList.add('hidden');
                    window.App.showNotification("Admin Override Successful! Stage 2 Unlocked.", "success");
                    
                    if (!user.unlockedStages.includes(2)) user.unlockedStages.push(2);
                    
                    const oldStreak = user.streak;
                    user.streak = 30;
                    user.sessionHistory = []; // Wipe corrupted backfill
                    if (window.Progress) window.Progress.saveUser();
                    
                    this.animateUnlockStage(2);
                    this.moveToStage(2, oldStreak / 60);
                } else {
                    window.App.showNotification("Incorrect Password.", "warning");
                }
            } else if (this.pwdTargetStage === 3) {
                if (pwd === 'orthoptics 123' || pwd === 'orthoptics123') {
                    document.getElementById('password-modal').classList.add('hidden');
                    window.App.showNotification("Admin Override Successful! Stage 3 Unlocked.", "success");
                    
                    if (!user.unlockedStages.includes(2)) user.unlockedStages.push(2);
                    if (!user.unlockedStages.includes(3)) user.unlockedStages.push(3);
                    
                    const oldStreak = user.streak;
                    user.streak = 60;
                    user.sessionHistory = []; // Wipe corrupted backfill
                    if (window.Progress) window.Progress.saveUser();
                    
                    this.animateUnlockStage(2);
                    this.animateUnlockStage(3);
                    this.moveToStage(3, oldStreak / 60);
                } else {
                    window.App.showNotification("Incorrect Password.", "warning");
                }
            }
        });
    },

    updateUI() {
        const user = window.App.currentUser;
        if (!user) return;

        const node2 = document.getElementById('node-stage2');
        const avatar = document.getElementById('player-avatar');

        if (user.animal) {
            avatar.src = `avatar_${user.animal}.png`;
        }

        if (user.unlockedStages.includes(2)) {
            node2.classList.remove('locked');
            const lock = node2.querySelector('.lock-overlay');
            if (lock) lock.style.display = 'none';
        } else {
            node2.classList.add('locked');
            const lock = node2.querySelector('.lock-overlay');
            if (lock) lock.style.display = 'flex';
        }

        const node3 = document.getElementById('node-stage3');
        if (user.unlockedStages.includes(3)) {
            node3.classList.remove('locked');
            const lock = node3.querySelector('.lock-overlay');
            if (lock) lock.style.display = 'none';
        } else {
            node3.classList.add('locked');
            const lock = node3.querySelector('.lock-overlay');
            if (lock) lock.style.display = 'flex';
        }

        let ratio = Math.min(user.streak / 60, 1);
        
        // If roaming, place avatar at the target node
        if (user.currentMapNode === 1) ratio = 0;
        if (user.currentMapNode === 2 && user.unlockedStages.includes(2)) ratio = 0.5;
        if (user.currentMapNode === 3 && user.unlockedStages.includes(3)) ratio = 1;

        const pos = this.getPointCSS(ratio);
        avatar.style.transition = 'none';
        avatar.style.left = pos.left;
        avatar.style.top = pos.top;
        avatar.style.transform = 'translate(-50%, -50%)';
    },

    moveToStage(stageNum, overrideStartRatio = null) {
        const avatar = document.getElementById('player-avatar');
        const user = window.App.currentUser;
        
        let targetRatio = 0;
        if (stageNum === 1) targetRatio = 0;
        else if (stageNum === 2) targetRatio = 0.5;
        else if (stageNum === 3) targetRatio = 1;

        let currentRatio = 0;
        if (overrideStartRatio !== null) {
            currentRatio = overrideStartRatio;
        } else {
            currentRatio = Math.min(user.streak / 60, 1);
            if (user.currentMapNode === 1) currentRatio = 0;
            if (user.currentMapNode === 2 && user.unlockedStages.includes(2)) currentRatio = 0.5;
            if (user.currentMapNode === 3 && user.unlockedStages.includes(3)) currentRatio = 1;
        }

        // If the avatar is acting as a progress tracker on the path (Stage 2/3 locked),
        // we shouldn't animate it back to Stage 1 to start the game, just start the game instantly.
        if ((stageNum === 1 && currentRatio > 0 && currentRatio < 0.5) || 
            (stageNum === 2 && currentRatio > 0.5 && currentRatio < 1)) {
            setTimeout(() => {
                if (window.Game) window.Game.startStage(stageNum);
            }, 500);
            return;
        }

        if (currentRatio === targetRatio) {
            setTimeout(() => {
                if (window.Game) window.Game.startStage(stageNum);
            }, 500);
            return;
        }

        const duration = 2000;
        const start = performance.now();
        avatar.style.transition = 'none';

        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            const animatedRatio = currentRatio + (targetRatio - currentRatio) * ease;
            const pos = this.getPointCSS(animatedRatio);
            
            avatar.style.left = pos.left;
            avatar.style.top = pos.top;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setTimeout(() => {
                    if (window.Game) window.Game.startStage(stageNum);
                }, 500);
            }
        };
        requestAnimationFrame(step);
    },

    getPointCSS(ratio) {
        let pathId = 'path-line-1';
        let localRatio = ratio * 2; // maps 0-0.5 to 0-1
        
        if (ratio > 0.5) {
            pathId = 'path-line-2';
            localRatio = (ratio - 0.5) * 2; // maps 0.5-1 to 0-1
        }
        
        const path = document.getElementById(pathId);
        if (!path) return { left: '50%', top: '50%' };
        
        const pathLength = path.getTotalLength();
        const pt = path.getPointAtLength(localRatio * pathLength);
        
        return {
            left: `${pt.x}%`,
            top: `${pt.y / 2}%`
        };
    },

    animateStep(oldStreak, newStreak) {
        const user = window.App.currentUser;
        if (user && user.unlockedStages.includes(3) && oldStreak >= 60) {
            return; // Once fully unlocked, the avatar roams freely and stops step animations.
        }

        const avatar = document.getElementById('player-avatar');
        const duration = 2000;
        const start = performance.now();

        const oldRatio = Math.min(oldStreak / 60, 1);
        const newRatio = Math.min(newStreak / 60, 1);

        avatar.style.transition = 'none';

        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            const currentRatio = oldRatio + (newRatio - oldRatio) * ease;
            const pos = this.getPointCSS(currentRatio);
            
            avatar.style.left = pos.left;
            avatar.style.top = pos.top;
            avatar.style.transform = 'translate(-50%, -50%)';

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    },

    animateUnlockStage(stageNum) {
        const node = document.getElementById(`node-stage${stageNum}`);
        if (!node) return;
        node.classList.remove('locked');
        const lock = node.querySelector('.lock-overlay');
        if (lock) lock.style.display = 'none';

        node.style.transform = 'scale(1.3) translate(-50%, calc(-50% - 15px))';
        setTimeout(() => {
            node.style.transform = 'translate(-50%, calc(-50% - 15px))';
        }, 500);
    }
};

const Game = {
    canvas: null,
    ctx: null,
    animationId: null,
    isPlaying: false,
    timerInterval: null,
    timeLeft: 600,
    currentStage: 1,
    imageObj: null,
    particles: [],
    
    stageImages: {
        1: ['stage 1/Stage 1D.png', 'stage 1/Stage 1E.png', 'stage 1/stage 1A.png', 'stage 1/stage 1B.png', 'stage 1/stage 1C.png'],
        2: ['stage 2/stage 2A.png', 'stage 2/stage 2B.png', 'stage 2/stage 2C.png', 'stage 2/stage 2D.png', 'stage 2/stage 2E.png'],
        3: ['stage 3/Stage 3C.png', 'stage 3/stage 3A.png', 'stage 3/stage 3B.png', 'stage 3/stage 3D.png', 'stage 3/stage 3E.png']
    },
    currentImageIndex: 0,
    hasStartedCurrentSession: false,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying || (this.timeLeft > 0 && this.timeLeft < 600)) {
                this.pauseTimer();
            }
        });
    },

    handleOrientationChange() {
        // Allow a slight delay for the browser to update window.orientation
        setTimeout(() => {
            if (window.orientation === 0 || window.orientation === 180) {
                // Portrait mode detected
                if (this.isPlaying) {
                    this.pauseTimer();
                    document.getElementById('btn-toggle-timer').innerText = "Resume Exercise";
                    window.App.showNotification("Exercise paused. Please rotate to landscape mode.", "warning");
                }
            }
            this.resizeCanvas();
        }, 300);
    },

    bindEvents() {
        document.getElementById('btn-back-map').addEventListener('click', () => {
            this.stopGame();
            window.App.showScreen('screen-map');
        });

        document.getElementById('btn-toggle-timer').addEventListener('click', (e) => {
            if (this.isPlaying) {
                this.pauseTimer();
                e.target.innerText = "Resume Exercise";
            } else {
                this.startTimer();
                e.target.innerText = "Pause Exercise";
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
            window.App.showScreen('screen-map');
        });

        document.getElementById('btn-img-prev').addEventListener('click', () => {
            if (this.hasStartedCurrentSession) {
                window.App.showNotification("Cannot change picture after starting the timer.", "warning");
                return;
            }
            const images = this.stageImages[this.currentStage];
            this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
            this.loadImage(this.currentStage);
        });

        document.getElementById('btn-img-next').addEventListener('click', () => {
            if (this.hasStartedCurrentSession) {
                window.App.showNotification("Cannot change picture after starting the timer.", "warning");
                return;
            }
            const images = this.stageImages[this.currentStage];
            this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
            this.loadImage(this.currentStage);
        });
    },

    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    },

    updateNavButtonsVisibility() {
        const prevBtn = document.getElementById('btn-img-prev');
        const nextBtn = document.getElementById('btn-img-next');
        if (this.hasStartedCurrentSession) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    },

    startStage(stageNum) {
        this.currentStage = stageNum;
        this.currentImageIndex = 0; // Reset image to first one when entering a stage
        this.hasStartedCurrentSession = false;
        
        const user = window.App.currentUser;

        if (user) {
            user.currentMapNode = stageNum;
            if (window.Progress) window.Progress.saveUser();
        }

        // Migrate legacy single session if present
        if (user && user.savedSession) {
            user.savedSessions = user.savedSessions || {};
            user.savedSessions[1] = user.savedSession;
            delete user.savedSession;
        }

        if (user && user.savedSessions && user.savedSessions[stageNum]) {
            const saved = user.savedSessions[stageNum];
            const now = new Date().getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            if (now - saved.timestamp < twelveHours) {
                this.timeLeft = saved.timeLeft;
                window.App.showNotification(`Resuming saved Stage ${stageNum} session!`, "success");
            } else {
                // Log the expired session so they still get credit for their time!
                let durationMins = Math.round((600 - saved.timeLeft) / 60);
                if (durationMins < 1) durationMins = 1; // Minimum 1 minute
                
                if (!user.sessionHistory) user.sessionHistory = [];
                user.sessionHistory.push({
                    dateStr: new Date(saved.timestamp).toDateString(),
                    timestamp: saved.timestamp,
                    durationMins: durationMins
                });

                this.timeLeft = 600;
                window.App.showNotification("Saved session expired (>12 hours). Time logged to Progress Report!", "warning");
            }
            delete user.savedSessions[stageNum];
            if (window.Progress) window.Progress.saveUser();
        } else {
            this.timeLeft = 600; // 10 minutes default
        }
        
        this.updateTimerDisplay();

        document.getElementById('current-stage-title').innerText = `Stage ${stageNum}`;
        document.getElementById('btn-toggle-timer').innerText = "Start Exercise";

        this.loadImage(stageNum);

        // Particles removed as requested

        window.App.showScreen('screen-game');
        this.resizeCanvas();
        this.startGameLoop();
    },

    loadImage(stageNum) {
        this.imageObj = new Image();
        this.imageObj.onerror = () => {
            console.warn(`Could not load stage ${stageNum} image. Using fallback rendering.`);
            this.imageObj = null;
        };
        const images = this.stageImages[stageNum] || this.stageImages[1];
        this.imageObj.src = images[this.currentImageIndex];
    },

    startGameLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const loop = () => {
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.imageObj && this.imageObj.complete && this.imageObj.naturalWidth > 0) {
            const imgRatio = this.imageObj.width / this.imageObj.height;
            const canvasRatio = this.canvas.width / this.canvas.height;
            let drawWidth, drawHeight, x, y;

            if (canvasRatio > imgRatio) {
                drawHeight = this.canvas.height * 0.90;
                drawWidth = drawHeight * imgRatio;
            } else {
                drawWidth = this.canvas.width * 0.90;
                drawHeight = drawWidth / imgRatio;
            }
            x = (this.canvas.width - drawWidth) / 2;
            y = (this.canvas.height - drawHeight) / 2;

            this.ctx.drawImage(this.imageObj, x, y, drawWidth, drawHeight);
        } else {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Stereogram Image ${this.currentStage} Loading...`, this.canvas.width / 2, this.canvas.height / 2);
        }
    },

    startTimer() {
        this.isPlaying = true;
        this.hasStartedCurrentSession = true;
        this.updateNavButtonsVisibility();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.onSessionComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isPlaying = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const user = window.App.currentUser;
        if (user && this.timeLeft > 0 && this.timeLeft < 600) {
            user.savedSessions = user.savedSessions || {};
            user.savedSessions[this.currentStage] = {
                timeLeft: this.timeLeft,
                timestamp: new Date().getTime()
            };
            if (window.Progress) window.Progress.saveUser();
        }
    },

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        document.getElementById('timer-display').innerText =
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        this.updateNavButtonsVisibility();
    },

    onSessionComplete() {
        this.pauseTimer();
        const user = window.App.currentUser;
        if (user && user.savedSessions) {
            delete user.savedSessions[this.currentStage];
            if (window.Progress) window.Progress.saveUser();
        }
        window.Progress.completeSession();
    },

    stopGame() {
        this.pauseTimer();
        this.isPlaying = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
};

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
        Auth.checkSession();
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
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

        this.notificationTimeout = setTimeout(() => {
            notif.classList.add('hidden');
        }, 4000);
    }
};

const ProgressReport = {
    currentDate: new Date(),

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('btn-progress').addEventListener('click', () => {
            window.App.showScreen('screen-progress');
            this.render();
        });

        document.getElementById('btn-back-map-from-progress').addEventListener('click', () => {
            window.App.showScreen('screen-map');
        });

        document.getElementById('tab-calendar').addEventListener('click', () => {
            this.switchTab('calendar');
        });
        document.getElementById('tab-summary').addEventListener('click', () => {
            this.switchTab('summary');
        });

        document.getElementById('btn-prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.renderSummary();
        });
        document.getElementById('btn-next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.renderSummary();
        });
    },

    switchTab(tab) {
        document.getElementById('tab-calendar').classList.toggle('active', tab === 'calendar');
        document.getElementById('tab-summary').classList.toggle('active', tab === 'summary');
        
        document.getElementById('view-calendar').classList.toggle('hidden', tab !== 'calendar');
        document.getElementById('view-summary').classList.toggle('hidden', tab !== 'summary');
        document.getElementById('view-calendar').classList.toggle('active', tab === 'calendar');
        document.getElementById('view-summary').classList.toggle('active', tab === 'summary');

        if (tab === 'summary') {
            this.renderSummary();
        } else {
            this.renderCalendar();
        }
    },

    render() {
        this.currentDate = new Date();
        this.renderCalendar();
        this.renderSummary();
    },

    getSessions() {
        const user = window.App.currentUser;
        if (!user) return [];
        
        if (!user.sessionHistory) {
            user.sessionHistory = [];
        }

        // Legacy backfill removed to prevent password override from filling the calendar.
        // The progress report will now only record when actually used.

        return user.sessionHistory;
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;

        const grid = document.querySelector('.calendar-grid');
        Array.from(grid.children).forEach(child => {
            if (!child.classList.contains('day-name')) {
                grid.removeChild(child);
            }
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        const sessions = this.getSessions();
        const sessionsByDate = {};
        sessions.forEach(s => {
            const dStr = new Date(s.timestamp).toDateString();
            if (!sessionsByDate[dStr]) sessionsByDate[dStr] = [];
            sessionsByDate[dStr].push(s);
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.innerText = i;

            const iterDate = new Date(year, month, i);
            const dStr = iterDate.toDateString();

            if (sessionsByDate[dStr] && sessionsByDate[dStr].length > 0) {
                dayDiv.classList.add('active-day');
            }

            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
                dayDiv.classList.add('selected');
                this.showDayDetails(iterDate, sessionsByDate[dStr] || []);
            });

            grid.appendChild(dayDiv);
        }

        document.getElementById('calendar-day-details').classList.add('hidden');
    },

    showDayDetails(date, daySessions) {
        document.getElementById('calendar-day-details').classList.remove('hidden');
        document.getElementById('detail-date').innerText = date.toDateString();
        document.getElementById('detail-times').innerText = daySessions.length;
        
        let totalMins = daySessions.reduce((sum, s) => sum + (s.durationMins || 10), 0);
        document.getElementById('detail-duration').innerText = `${totalMins} min`;
    },

    renderSummary() {
        const sessions = this.getSessions();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[month];
        
        let monthCount = 0;
        let totalMins = 0;

        sessions.forEach(s => {
            const d = new Date(s.timestamp);
            if (d.getMonth() === month && d.getFullYear() === year) {
                monthCount++;
                totalMins += (s.durationMins || 10);
            }
        });

        // 4.33 weeks in a month on average
        const avgWeekly = (monthCount / 4.33).toFixed(1);
        const avgDuration = monthCount > 0 ? Math.round(totalMins / monthCount) : 0;

        document.getElementById('title-stat-month').innerText = `Times Done For The Month Of ${monthName}`;
        document.getElementById('stat-month').innerText = monthCount;

        document.getElementById('title-stat-week').innerText = `Average Times Done Per Week For ${monthName}`;
        
        let displayWeekly = avgWeekly.replace('.0', '');
        let percentCompliance = Math.round((parseFloat(avgWeekly) / 7) * 100);
        document.getElementById('stat-week').innerText = `${displayWeekly} (${percentCompliance}%)`;

        document.getElementById('title-stat-duration').innerText = `Average Duration For ${monthName}`;
        document.getElementById('stat-freq').innerText = `${avgDuration} mins`;
    }
};

const Menu = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('btn-menu-instructions').addEventListener('click', () => {
            window.App.showScreen('screen-instructions');
        });

        document.getElementById('btn-menu-start').addEventListener('click', () => {
            window.App.showScreen('screen-map');
        });

        document.getElementById('btn-back-main-menu').addEventListener('click', () => {
            window.App.showScreen('screen-main-menu');
        });

        document.getElementById('btn-back-main-menu-from-map').addEventListener('click', () => {
            window.App.showScreen('screen-main-menu');
        });
    }
};

window.App = App;
window.ProgressReport = ProgressReport;
window.Menu = Menu;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
    ProgressReport.init();
    Menu.init();
});
