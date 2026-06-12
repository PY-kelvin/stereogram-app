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

        const loginUsernameInput = document.getElementById('login-username');
        const loginCaseHint = document.getElementById('login-case-hint');
        if (loginUsernameInput && loginCaseHint) {
            loginUsernameInput.addEventListener('input', (e) => {
                if (e.target.value.trim().length > 0) {
                    loginCaseHint.style.display = 'block';
                } else {
                    loginCaseHint.style.display = 'none';
                }
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                this.logout();
            });
        }
        
        const btnLogoutMain = document.getElementById('btn-logout-main');
        if (btnLogoutMain) {
            btnLogoutMain.addEventListener('click', () => {
                this.logout();
            });
        }

        document.querySelectorAll('.btn-logout-map').forEach(btn => {
            btn.addEventListener('click', () => {
                this.logout();
            });
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

    checkSession(isStartup = false) {
        const username = localStorage.getItem('currentUser');
        if (username) {
            const userStr = localStorage.getItem(`user_${username}`);
            if (userStr) {
                const user = JSON.parse(userStr);
                
                // Recalibrate stagePlays based strictly on true history
                user.stagePlays = { 1: 0, 2: 0, 3: 0 };
                if (user.sessionHistory) {
                    const daysPlayed = { 1: new Set(), 2: new Set(), 3: new Set() };
                    user.sessionHistory.forEach(s => {
                        const sNum = s.stageNum || 1;
                        if (daysPlayed[sNum]) {
                            daysPlayed[sNum].add(s.dateStr);
                        }
                    });
                    user.stagePlays[1] = daysPlayed[1].size;
                    user.stagePlays[2] = daysPlayed[2].size;
                    user.stagePlays[3] = daysPlayed[3].size;
                }

                if (user.passwords && user.passwords.length > 0) {
                    let maxLevel = 0;
                    const pwdMap = [
                        { level: 7, pwd: 'orthoptics' },
                        { level: 14, pwd: 'orthoptics 1' },
                        { level: 21, pwd: 'orthoptics 2' },
                        { level: 28, pwd: 'orthoptics 3' },
                        { level: 35, pwd: 'orthoptics 4' },
                        { level: 42, pwd: 'orthoptics 5' }
                    ];
                    for (let p of pwdMap) {
                        if (user.passwords.includes(p.pwd) && p.level > maxLevel) {
                            maxLevel = p.level;
                        }
                    }
                    user.streak = Math.max(user.streak || 0, maxLevel);
                }
                
                window.App.currentUser = user;
                
                // Check for interrupted session (max 2 hours old)
                if (isStartup && user.savedSession) {
                    const now = new Date().getTime();
                    const ageHours = (now - user.savedSession.timestamp) / (1000 * 60 * 60);
                    if (ageHours < 2) {
                        // Restore it
                        window.Game.currentStageNode = user.savedSession.stageNode;
                        window.Game.timeLeft = user.savedSession.timeLeft;
                        window.Game.sessionStartLeft = user.savedSession.sessionStartLeft;
                        window.Game.hasStartedCurrentSession = true;
                        
                        window.Game.loadImage(window.Game.currentStageNode);
                        window.Game.updateTimerDisplay();
                        
                        window.App.showScreen('screen-game');
                        
                        // Delete saved session so it doesn't loop forever
                        user.savedSession = null;
                        if (window.Progress) window.Progress.saveUser();
                        return true;
                    }
                }
                
                const authScreen = document.getElementById('screen-auth');
                if (isStartup || (authScreen && authScreen.classList.contains('active'))) {
                    window.App.showScreen('screen-welcome');
                }
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

            user.stagePlays = user.stagePlays || { 1: 0, 2: 0, 3: 0 };
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

        // Removed total streak counter as requested
    }
};

const Map = {
    isAnimating: false,
    pwdTargetStage: 0,
    pendingNodeClick: null,
    pendingExitClick: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Back buttons for 3 maps
        const btnMenu1 = document.getElementById('btn-back-main-menu-from-map-1');
        if (btnMenu1) {
            btnMenu1.addEventListener('click', () => {
                window.App.showScreen('screen-main-menu');
            });
        }
        const btnMenu2 = document.getElementById('btn-back-main-menu-from-map-2');
        if (btnMenu2) {
            btnMenu2.addEventListener('click', () => {
                window.App.showScreen('screen-main-menu');
            });
        }
        const btnMenu3 = document.getElementById('btn-back-main-menu-from-map-3');
        if (btnMenu3) {
            btnMenu3.addEventListener('click', () => {
                window.App.showScreen('screen-main-menu');
            });
        }
        
        const btnBackL1 = document.getElementById('btn-back-level1');
        if (btnBackL1) {
            btnBackL1.addEventListener('click', () => {
                if (window.Map && window.Map.travelBackward) {
                    window.Map.travelBackward(2);
                } else {
                    window.App.showScreen('screen-map-1');
                }
            });
        }

        const btnBackL2 = document.getElementById('btn-back-level2');
        if (btnBackL2) {
            btnBackL2.addEventListener('click', () => {
                if (window.Map && window.Map.travelBackward) {
                    window.Map.travelBackward(3);
                } else {
                    window.App.showScreen('screen-map-2');
                }
            });
        }

        // Progress buttons
        document.querySelectorAll('.btn-progress').forEach(btn => {
            btn.addEventListener('click', () => {
                window.App.showScreen('screen-progress');
                if (window.ProgressReport) window.ProgressReport.render();
            });
        });



        // Stage clicks
        document.getElementById('node-1a').addEventListener('click', () => this.handleNodeClick('1A', 1, 0));
        document.getElementById('node-1b').addEventListener('click', () => this.handleNodeClick('1B', 1, 7));
        document.getElementById('node-2a').addEventListener('click', () => this.handleNodeClick('2A', 2, 14));
        document.getElementById('node-2b').addEventListener('click', () => this.handleNodeClick('2B', 2, 21));
        document.getElementById('node-3a').addEventListener('click', () => this.handleNodeClick('3A', 3, 28));
        document.getElementById('node-3b').addEventListener('click', () => this.handleNodeClick('3B', 3, 35));

        // Exits
        document.getElementById('node-exit1').addEventListener('click', () => this.handleExitClick(1));
        document.getElementById('node-exit2').addEventListener('click', () => this.handleExitClick(2));
        document.getElementById('node-exit3').addEventListener('click', () => this.handleExitClick(3));

        document.getElementById('btn-cancel-pwd').addEventListener('click', () => {
            document.getElementById('password-modal').classList.add('hidden');
        });

        document.getElementById('btn-submit-pwd').addEventListener('click', () => {
            const rawPwd = document.getElementById('admin-password').value;
            const pwd = rawPwd.trim().toLowerCase();
            const user = window.App.currentUser;
            
            // Fast forwards
            if (pwd === 'orthoptics') {
                this.fastForward(7, "orthoptics");
            } else if (pwd === 'orthoptics 1') {
                this.triggerCinematicTransition(1, 2, 'bus', 14, "orthoptics 1");
            } else if (pwd === 'orthoptics 2') {
                this.fastForward(21, "orthoptics 2");
            } else if (pwd === 'orthoptics 3') {
                this.triggerCinematicTransition(2, 3, 'taxi', 28, "orthoptics 3");
            } else if (pwd === 'test20') {
                window.runSimulation();
                document.getElementById('password-modal').classList.add('hidden');
            } else if (pwd === 'orthoptics 4') {
                this.fastForward(35, "orthoptics 4");
            } else if (pwd === 'orthoptics 5') {
                this.fastForward(42, "orthoptics 5");
            } else {
                window.App.showNotification("Incorrect Password.", "warning");
            }
        });
    },
    
    async handleNodeClick(nodeName, level, reqStreak) {
        if (this.isAnimating) return;
        const user = window.App.currentUser;
        if (!user || !user.stagePlays) return;

        if (nodeName.endsWith('B') && user.stagePlays[level] < 7 && !this.hasPasswordBypass(reqStreak)) {
            // Need password for 1B, 2B, 3B if not enough counts
            this.pwdTargetStage = level;
            this.pendingNodeClick = { nodeName, level, reqStreak };
            this.pendingExitClick = null;
            const pwdMsg = document.querySelector('#password-modal p');
            if (pwdMsg) pwdMsg.innerText = `Enter password to unlock Stage ${nodeName}.`;
            document.getElementById('password-modal').classList.remove('hidden');
            document.getElementById('admin-password').value = '';
            return;
        }

        let oldNodeName = user.lastVisitedNode ? user.lastVisitedNode[level] : null;
        let oldC = user.stagePlays[level] || 0;
        if (oldNodeName === level + 'A') oldC = 0;
        if (oldNodeName === level + 'B') oldC = 7;
        if (oldNodeName === 'exit' + level) oldC = 14;

        let newC = nodeName.endsWith('A') ? 0 : 7;
        
        if (!user.lastVisitedNode) user.lastVisitedNode = {};
        user.lastVisitedNode[level] = nodeName;
        if (window.Progress) window.Progress.saveUser();
        
        await this.animateAvatarProgress(level, oldC, newC);
        window.Game.startStage(nodeName);
    },
    
    async handleExitClick(exitNum) {
        if (this.isAnimating) return;
        const user = window.App.currentUser;
        let reqStreak = exitNum * 14; 
        
        if (!this.hasPasswordBypass(reqStreak) && !(exitNum === 3 && window.App.currentUser.stagePlays && window.App.currentUser.stagePlays[3] >= 14)) {
            this.pwdTargetStage = exitNum;
            this.pendingExitClick = exitNum;
            this.pendingNodeClick = null;
            const pwdMsg = document.querySelector('#password-modal p');
            let nextMap = exitNum + 1;
            if (pwdMsg) pwdMsg.innerText = `Enter password to unlock Stage ${nextMap}.`;
            document.getElementById('password-modal').classList.remove('hidden');
            document.getElementById('admin-password').value = '';
            return;
        }

        let oldNodeName = user.lastVisitedNode ? user.lastVisitedNode[exitNum] : null;
        let oldC = user.stagePlays[exitNum] || 0;
        if (oldNodeName === exitNum + 'A') oldC = 0;
        if (oldNodeName === exitNum + 'B') oldC = 7;
        if (oldNodeName === 'exit' + exitNum) oldC = 14;

        let newC = 14;
        
        if (!user.lastVisitedNode) user.lastVisitedNode = {};
        user.lastVisitedNode[exitNum] = 'exit' + exitNum;
        if (window.Progress) window.Progress.saveUser();
        
        await this.animateAvatarProgress(exitNum, oldC, newC);

        if (exitNum === 3) {
            this.showFinalGoalHug();
        } else {
            this.travelForward(exitNum);
        }
    },

    showFinalGoalHug() {
        const modal = document.getElementById('final-goal-modal');
        const userAvatar = window.App.currentUser.avatar || 'avatar_cat.png';
        const partners = [
            'reward_capybara.png', 'reward_chicken.png', 'reward_cow.png', 
            'reward_duck.png', 'reward_farmers.png', 'reward_hamster.png', 
            'reward_horse.png', 'reward_penguin.png', 'reward_squirrel.png'
        ];
        // Pick a random partner
        const randomPartner = partners[Math.floor(Math.random() * partners.length)];
        
        const avatarImg = document.getElementById('hug-avatar');
        const partnerImg = document.getElementById('hug-partner');
        const hearts = document.getElementById('hug-hearts');
        
        avatarImg.src = userAvatar;
        partnerImg.src = randomPartner;
        
        // Reset positions
        avatarImg.style.transform = 'translateX(0) scale(1)';
        partnerImg.style.transform = 'translateX(0) scale(1)';
        avatarImg.style.left = '10%';
        partnerImg.style.right = '10%';
        hearts.style.opacity = '0';
        hearts.style.transform = 'translateY(10px)';
        
        modal.classList.remove('hidden');
        if (window.Confetti) window.Confetti.start();
        
        // Animate hug after a small delay
        setTimeout(() => {
            // Move them to center
            avatarImg.style.left = '35%';
            partnerImg.style.right = '35%';
            
            // Wait for movement, then "hug"
            setTimeout(() => {
                avatarImg.style.transform = 'scale(1.1) rotate(5deg)';
                partnerImg.style.transform = 'scale(1.1) rotate(-5deg)';
                
                // Show hearts
                hearts.style.transition = 'all 0.5s ease';
                hearts.style.opacity = '1';
                hearts.style.transform = 'translateY(-20px)';
            }, 1000);
        }, 300);
    },

    hasPasswordBypass(reqStreak) {
        const user = window.App.currentUser;
        user.passwords = user.passwords || [];
        
        const pwdMap = [
            { level: 7, pwd: 'orthoptics' },
            { level: 14, pwd: 'orthoptics 1' },
            { level: 21, pwd: 'orthoptics 2' },
            { level: 28, pwd: 'orthoptics 3' },
            { level: 35, pwd: 'orthoptics 4' },
            { level: 42, pwd: 'orthoptics 5' }
        ];

        let maxLevel = 0;
        for (let p of pwdMap) {
            if (user.passwords.includes(p.pwd) && p.level > maxLevel) {
                maxLevel = p.level;
            }
        }
        
        return maxLevel >= reqStreak;
    },

    async fastForward(targetStreak, pwdName) {
        const user = window.App.currentUser;
        if (!user) return;
        
        user.passwords = user.passwords || [];
        if (!user.passwords.includes(pwdName)) {
            user.passwords.push(pwdName);
        }

        // Sync stagePlays
        if (!user.stagePlays) user.stagePlays = { 1: 0, 2: 0, 3: 0 };
        user.streak = Math.max(user.streak || 0, targetStreak);
        
        if (window.Progress) window.Progress.saveUser();
        window.App.showNotification("Password Accepted!", "success");
        document.getElementById('password-modal').classList.add('hidden');
        this.updateUI();

        if (this.pendingNodeClick) {
            let p = this.pendingNodeClick;
            this.pendingNodeClick = null;
            await this.handleNodeClick(p.nodeName, p.level, p.reqStreak);
        } else if (this.pendingExitClick !== null) {
            let e = this.pendingExitClick;
            this.pendingExitClick = null;
            await this.handleExitClick(e);
        }
    },

    async triggerCinematicTransition(fromMap, toMap, vehicleType, targetStreak, pwdName) {
        const user = window.App.currentUser;
        user.passwords = user.passwords || [];
        if (!user.passwords.includes(pwdName)) {
            user.passwords.push(pwdName);
        }
        
        // Sync stagePlays
        if (!user.stagePlays) user.stagePlays = { 1: 0, 2: 0, 3: 0 };
        user.streak = Math.max(user.streak || 0, targetStreak);

        if (window.Progress) window.Progress.saveUser();
        document.getElementById('password-modal').classList.add('hidden');
        this.updateUI();
        
        if (this.pendingExitClick === fromMap) {
            let e = this.pendingExitClick;
            this.pendingExitClick = null;
            await this.handleExitClick(e);
        } else {
            this.travelForward(fromMap);
        }
    },

    async travelForward(fromLevel) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const user = window.App.currentUser;
        if (!user.lastVisitedNode) user.lastVisitedNode = {};
        user.lastVisitedNode[fromLevel + 1] = (fromLevel + 1) + 'A';
        if (window.Progress) window.Progress.saveUser();
        
        await this.shrinkAvatar(fromLevel);
        
        // Hide target avatar BEFORE showing screen
        const targetAv = document.getElementById('player-avatar-' + (fromLevel + 1));
        if (targetAv) {
            targetAv.style.transition = 'none';
            targetAv.style.transform = 'translate(-50%, -50%) scale(0)';
        }
        
        window.App.showScreen('screen-map-' + (fromLevel + 1));
        
        // Wait for layout to catch up, then position avatar BEFORE it grows
        await new Promise(r => requestAnimationFrame(r));
        this.positionAvatar();
        
        await this.growAvatar(fromLevel + 1);
        this.isAnimating = false;
        this.updateUI();
    },

    async travelBackward(fromLevel) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const user = window.App.currentUser;
        if (!user.lastVisitedNode) user.lastVisitedNode = {};
        
        // Find current position to animate backwards
        let currentNode = user.lastVisitedNode[fromLevel];
        let currentPlays = 0;
        if (currentNode) {
            currentNode = currentNode.toLowerCase();
            if (currentNode.endsWith('b')) currentPlays = 7;
            else if (currentNode.startsWith('exit')) currentPlays = 14;
        } else {
            currentPlays = user.stagePlays[fromLevel] || 0;
            if (currentPlays > 14) currentPlays = 14;
        }
        
        // Animate backwards if not already at 0
        if (currentPlays > 0) {
            let duration = Math.max(1000, currentPlays * 150); // Speed up slightly for backwards
            await this.animatePathProgress(fromLevel, currentPlays, 0, duration);
            user.lastVisitedNode[fromLevel] = fromLevel + 'A';
        }

        user.lastVisitedNode[fromLevel - 1] = 'exit' + (fromLevel - 1);
        if (window.Progress) window.Progress.saveUser();
        
        await this.shrinkAvatar(fromLevel);
        
        // Hide target avatar BEFORE showing screen
        const targetAv = document.getElementById('player-avatar-' + (fromLevel - 1));
        if (targetAv) {
            targetAv.style.transition = 'none';
            targetAv.style.transform = 'translate(-50%, -50%) scale(0)';
        }
        
        window.App.showScreen('screen-map-' + (fromLevel - 1));
        
        // Wait for layout to catch up, then position avatar BEFORE it grows
        await new Promise(r => requestAnimationFrame(r));
        this.positionAvatar();
        
        await this.growAvatar(fromLevel - 1);
        this.isAnimating = false;
        this.updateUI();
    },

    updateUI() {
        if (this.isAnimating) return;        const user = window.App.currentUser;
        if (!user) return;
        
        if (!user.stagePlays) user.stagePlays = { 1: 0, 2: 0, 3: 0 };
        const p1 = user.stagePlays[1];
        const p2 = user.stagePlays[2];
        const p3 = user.stagePlays[3];

        document.getElementById('streak-counter-1').innerText = "⭐ Counts: " + p1;
        document.getElementById('streak-counter-2').innerText = "⭐ Counts: " + p2;
        document.getElementById('streak-counter-3').innerText = "⭐ Counts: " + p3;

        // Set Avatars
        if (user.animal) {
            document.querySelectorAll('.avatar-img').forEach(img => {
                img.src = 'avatar_' + user.animal + '.png';
            });
        }

        // --- Locks ---
        document.querySelectorAll('.stage-node').forEach(node => {
            if (node.id !== 'node-1a' && node.id !== 'node-2a' && node.id !== 'node-3a') {
                node.classList.add('locked');
                let lock = node.querySelector('.lock-overlay');
                if (lock) lock.style.display = 'block';
            }
        });

        // Unlock 1B
        if (p1 >= 7 || this.hasPasswordBypass(7)) {
            document.getElementById('node-1b').classList.remove('locked');
            const l = document.getElementById('node-1b').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }

        // Unlock Exit 1
        if (this.hasPasswordBypass(14)) {
            document.getElementById('node-exit1').classList.remove('locked');
            const l = document.getElementById('node-exit1').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }

        // Unlock 2B
        if (p2 >= 7 || this.hasPasswordBypass(21)) {
            document.getElementById('node-2b').classList.remove('locked');
            const l = document.getElementById('node-2b').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }

        // Unlock Exit 2
        if (this.hasPasswordBypass(28)) {
            document.getElementById('node-exit2').classList.remove('locked');
            const l = document.getElementById('node-exit2').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }
        
        // Unlock 3B
        if (p3 >= 7 || this.hasPasswordBypass(35)) {
            document.getElementById('node-3b').classList.remove('locked');
            const l = document.getElementById('node-3b').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }

        // Unlock Exit 3
        if (p3 >= 14 || this.hasPasswordBypass(42)) {
            document.getElementById('node-exit3').classList.remove('locked');
            const l = document.getElementById('node-exit3').querySelector('.lock-overlay');
            if (l) l.style.display = 'none';
        }

        // Use setTimeout to ensure browser layout is calculated before asking for SVG coordinates
        setTimeout(() => {
            this.positionAvatar();
        }, 50);
    },
    
    getMapPosition(counts) {
        let ratio = 0; // 0 to 1 for the 2 paths
        
        if (counts < 7) {
            ratio = (counts / 7) * 0.5; // Path a
        } else if (counts < 14) {
            ratio = 0.5 + ((counts - 7) / 7) * 0.5; // Path b
        } else {
            ratio = 1; // End
        }
        return ratio;
    },

    positionAvatar(mapOverride = null, countsOverride = null) {
        const user = window.App.currentUser;
        if (!user || !user.stagePlays) return;
        
        [1, 2, 3].forEach(l => {
            const av = document.getElementById('player-avatar-' + l);
            if (!av) return;
            
            // Only hide avatars for locked maps
            if (l === 2 && !this.hasPasswordBypass(14)) {
                av.style.opacity = '0';
                return;
            }
            if (l === 3 && !this.hasPasswordBypass(28)) {
                av.style.opacity = '0';
                return;
            }

            // Preserve existing scale if possible
            let currentScale = 'scale(1)';
            if (av.style.transform && av.style.transform.includes('scale')) {
                let match = av.style.transform.match(/scale\([^)]+\)/);
                if (match) currentScale = match[0];
            }
            av.style.opacity = '1';
            av.style.transform = `translate(-50%, -50%) ${currentScale}`;

            let counts = user.stagePlays[l];
            if (mapOverride === l && countsOverride !== null) counts = countsOverride;

            const mapContent = av.closest('.map-content');
            if (!mapContent) return;
            const contentRect = mapContent.getBoundingClientRect();
            if (contentRect.width === 0 || contentRect.height === 0) {
                // Map is hidden, don't update position
                return;
            }

            let ratio = this.getMapPosition(counts);
            let pathId = ratio < 0.5 ? 'path-line-' + l : 'path-line-' + l + 'b';
            let localR = ratio < 0.5 ? ratio * 2 : (ratio - 0.5) * 2;
            if (ratio === 1) { pathId = 'path-line-' + l + 'b'; localR = 1; }
            
            const path = document.getElementById(pathId);
            if (path) {
                try {
                    const pt = path.getPointAtLength(localR * path.getTotalLength());
                    const svgRect = path.closest('svg').getBoundingClientRect();
                    const scaleX = svgRect.width / 100;
                    const scaleY = svgRect.height / 100;
                    const dx = svgRect.left - contentRect.left;
                    const dy = svgRect.top - contentRect.top;
                    av.style.left = (pt.x * scaleX + dx) + 'px';
                    av.style.top = (pt.y * scaleY + dy) + 'px';
                } catch(e) {}
            }
        });
    },

    shrinkAvatar(lvl) {
        return new Promise(resolve => {
            const av = document.getElementById('player-avatar-' + lvl);
            if (!av) return resolve();
            av.style.transition = 'transform 1s ease-in';
            av.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => {
                av.style.transition = 'none';
                resolve();
            }, 1000);
        });
    },

    growAvatar(lvl) {
        return new Promise(resolve => {
            const av = document.getElementById('player-avatar-' + lvl);
            if (!av) return resolve();
            av.style.transition = 'none';
            av.style.transform = 'translate(-50%, -50%) scale(0)';
            // force reflow
            void av.offsetHeight;
            av.style.transition = 'transform 1s ease-out';
            av.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(() => {
                av.style.transition = 'none';
                resolve();
            }, 1000);
        });
    },

    animatePathProgress(mapNum, startC, endC, durationMs) {
        return new Promise(resolve => {
            if (startC === endC) return resolve();
            const startTime = performance.now();
            const step = (timestamp) => {
                let elapsed = timestamp - startTime;
                let progress = Math.min(elapsed / durationMs, 1);
                let currentC = startC + (endC - startC) * progress;
                this.positionAvatar(mapNum, currentC);
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    },

    async animateAvatarProgress(mapNum, oldC, newC) {
        this.isAnimating = true;
        const av = document.getElementById('player-avatar-' + mapNum);
        if (av) av.style.transition = 'none'; // Ensure no CSS transition interference
        console.log(`[v152] Animating map ${mapNum} from counts ${oldC} to ${newC} along SVG curve`);
        let duration = Math.max(1000, Math.abs(newC - oldC) * 300);
        await this.animatePathProgress(mapNum, oldC, newC, duration);
        this.isAnimating = false;
        
        // Wait 1 frame for CSS layout to catch up if we just switched screens
        await new Promise(r => requestAnimationFrame(r));
        this.positionAvatar(); // ensure exact final position
    },

    animateStep(oldStreak, newStreak) {
        // Obsolete
        this.updateUI();
    }
};

const Game = {
    canvas: null,
    ctx: null,
    animationId: null,
    isPlaying: false,
    timerInterval: null,
    timeLeft: 600,
    sessionStartLeft: 600,
    currentStageNode: '1A',
    currentImageIndex: 0,
    hasStartedCurrentSession: false,
    uiTimeout: null,
    
    stageImages: {
        '1A': ['stage 1/stage 1A.png?v=4', 'stage 1/stage 1B.png?v=4', 'stage 1/stage 1C.png?v=4'],
        '1B': ['stage 1/Stage 1D.png?v=4', 'stage 1/Stage 1E.png?v=4'],
        '2A': ['stage 2/stage 2A.png?v=2', 'stage 2/stage 2B.png?v=2', 'stage 2/stage 2C.png?v=2'],
        '2B': ['stage 2/stage 2D.png?v=2', 'stage 2/stage 2E.png?v=2'],
        '3A': ['stage 3/Stage 3C.png?v=2', 'stage 3/stage 3A.png?v=2', 'stage 3/stage 3B.png?v=2'],
        '3B': ['stage 3/stage 3D.png?v=2', 'stage 3/stage 3E.png?v=2']
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
                const user = window.App.currentUser;
                if (user) {
                    user.savedSession = {
                        timeLeft: this.timeLeft,
                        timestamp: new Date().getTime()
                    };
                    if (window.Progress) window.Progress.saveUser();
                }
            }
        });
    },

    bindEvents() {
        document.getElementById('btn-back-map').addEventListener('click', () => {
            if (this.isPlaying || (this.timeLeft > 0 && this.timeLeft < 600)) {
                this.pauseTimer();
                const user = window.App.currentUser;
                if (user) {
                    user.savedSession = {
                        timeLeft: this.timeLeft,
                        timestamp: new Date().getTime()
                    };
                    if (window.Progress) window.Progress.saveUser();
                }
            }
            this.stopGame();
            let specificMap = null;
            if (this.currentStageNode) {
                if (this.currentStageNode.startsWith('1')) specificMap = 1;
                else if (this.currentStageNode.startsWith('2')) specificMap = 2;
                else if (this.currentStageNode.startsWith('3')) specificMap = 3;
            }
            window.App.showMapScreen(specificMap);
        });

        const resetUI = () => this.resetUITimer();
        document.getElementById('screen-game').addEventListener('click', resetUI);
        document.getElementById('screen-game').addEventListener('touchstart', resetUI);
        document.getElementById('screen-game').addEventListener('mousemove', resetUI);
        
        document.getElementById('btn-toggle-timer').addEventListener('click', (e) => {
            if (this.isPlaying) {
                this.pauseTimer();
                e.target.innerText = "▶";
                e.target.title = "Resume Exercise";
            } else {
                this.startTimer();
                if (this.isPlaying) {
                    e.target.innerText = "⏸";
                    e.target.title = "Pause Exercise";
                }
            }
        });

        document.getElementById('btn-img-prev').addEventListener('click', () => {
            const images = this.stageImages[this.currentStageNode];
            let maxCount = images.length;
            this.currentImageIndex = (this.currentImageIndex - 1 + maxCount) % maxCount;
            this.loadImage(this.currentStageNode);
        });

        document.getElementById('btn-img-next').addEventListener('click', () => {
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
        this.sessionStartLeft = 600;
        this.hasStartedCurrentSession = false;

        const user = window.App.currentUser;
        if (user && user.savedSession) {
            const now = new Date().getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            if (now - user.savedSession.timestamp < twelveHours) {
                this.timeLeft = user.savedSession.timeLeft;
                this.sessionStartLeft = this.timeLeft;
                window.App.showNotification("Resumed from previous save!", "success");
            }
            delete user.savedSession;
            if (window.Progress) window.Progress.saveUser();
        }

        this.updateTimerDisplay();
        this.loadImage(nodeName);
        
        const btnToggle = document.getElementById('btn-toggle-timer');
        if (btnToggle) {
            btnToggle.innerText = "⏸";
            btnToggle.title = "Pause Exercise";
        }
        
        // Auto-start the timer upon entering the stage
        this.startTimer();
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
        this.hasStartedCurrentSession = false;
        document.getElementById('screen-game').classList.remove('focus-mode');
    },

    startTimer() {
        if (this.isPlaying) return;
        
        // Only mark session started if this is a fresh resume or start
        if (!this.isPlaying) {
            this.hasStartedCurrentSession = true;
        }
        
        this.isPlaying = true;
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
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        document.getElementById('screen-game').classList.remove('focus-mode');
        const btnToggle = document.getElementById('btn-toggle-timer');
        if (btnToggle) {
            btnToggle.innerText = "▶";
            btnToggle.title = "Resume Exercise";
        }

        // Log duration when paused or stopped
        if (this.hasStartedCurrentSession) {
            const elapsedSecs = this.sessionStartLeft - this.timeLeft;
            const spentMins = elapsedSecs / 60;
            
            if (spentMins > 0) {
                const user = window.App.currentUser;
                if (user) {
                    let stageNum = this.currentStageNode ? parseInt(this.currentStageNode[0]) : 1;
                    user.sessionHistory = user.sessionHistory || [];
                    user.sessionHistory.push({
                        dateStr: new Date().toDateString(),
                        timestamp: new Date().getTime(),
                        durationMins: spentMins,
                        stageNum: stageNum
                    });
                    if (window.Progress) window.Progress.saveUser();
                }
            }
            // Reset start time so if they resume, we only track the new segment
            this.sessionStartLeft = this.timeLeft;
        }
    },

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        document.getElementById('timer-display').innerText = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

        // Initialize structures
        if (!user.stagePlays) user.stagePlays = { 1: 0, 2: 0, 3: 0 };
        if (!user.stageDailyProgress) user.stageDailyProgress = { 1: 0, 2: 0, 3: 0 };

        // Reset daily progress if new day
        if (user.lastActivityDate !== dateStr) {
            user.stageDailyProgress = { 1: 0, 2: 0, 3: 0 };
            user.lastActivityDate = dateStr;
            user.dailyProgress = 0;
        }

        let stageNum = 1;
        if (this.currentStageNode) {
            if (this.currentStageNode.startsWith('2')) stageNum = 2;
            if (this.currentStageNode.startsWith('3')) stageNum = 3;
        }

        let oldPlays = user.stagePlays[stageNum];
        let newPlays = oldPlays;

        if (user.stageDailyProgress[stageNum] === 0) {
            user.stageDailyProgress[stageNum] = 1;
            user.stagePlays[stageNum] += 1;
            user.dailyProgress = 1;
            newPlays = user.stagePlays[stageNum];
        }

        if (window.Progress) window.Progress.saveUser();
        
        let specificMap = null;
        if (this.currentStageNode) {
            if (this.currentStageNode.startsWith('1')) specificMap = 1;
            else if (this.currentStageNode.startsWith('2')) specificMap = 2;
            else if (this.currentStageNode.startsWith('3')) specificMap = 3;
        }
        window.App.pendingRewardMap = specificMap;
        
        const rewardAnimals = [
            'reward_capybara.png', 'reward_chicken.png', 'reward_cow.png',
            'reward_duck.png', 'reward_farmers.png', 'reward_hamster.png',
            'reward_horse.png', 'reward_penguin.png', 'reward_squirrel.png'
        ];
        const randomAnimal = rewardAnimals[Math.floor(Math.random() * rewardAnimals.length)];
        const rewardImg = document.getElementById('reward-animal');
        if (rewardImg) rewardImg.src = randomAnimal;
        
        document.getElementById('reward-modal').classList.remove('hidden');
        if (window.Confetti) window.Confetti.start();
        
        if (window.Map) {
            if (oldPlays < newPlays) {
                window.App.pendingAnimation = { stageNum, oldPlays, newPlays };
            } else {
                window.Map.updateUI();
            }
        }
    },

    resizeCanvas() {
    }
};

window.Map = Map;
window.Game = Game;

const LOCAL_STORAGE_KEY = 'stereogram_app_data';

const distContent = `
<p><strong>Purpose:</strong> To improve relaxation of your eyes (ie. Divergence).</p>
<ol style="margin-left: 20px; font-size: 1.1rem; line-height: 1.6;">
    <li>Hold the card with the images facing you at arm's length at eye level.<br><br></li>
    <li>Focus on a central object in the distance (at least 3m away) just above the card (or looking through the transparent card) while being aware of the images on your card.<br><br></li>
    <li>Concentrate on this distant object until you are aware of a third fused (merged) image in the centre of the two images on your card. It is very important at this stage of the exercise NOT to look directly at the card or the exercise will not work - look continuously at the distant object.<br><br></li>
    <li>You may notice 4 images at times - you can adjust the distance of the card slightly until you see the fused image.<br><br></li>
    <li>4 images should become 3 images with the middle (fused) image appearing complete.<br><br></li>
    <li>Once the middle image appears, try to keep the third image in focus for <u>10 seconds</u>. Do NOT look at the middle complete image as it will disappear immediately if you do. If the third image disappears, stop counting and refocus to get the third image to appear again.<br><br></li>
    <li>Repeat.<br><br></li>
</ol>
<p><strong>Frequency:</strong> Perform for 10 to 15 minutes a day. This can be broken up into 2 or 3 sessions.</p>
<div style="background: #fff3cd; padding: 15px; border-radius: 10px; border-left: 5px solid #ffc107; margin-top: 20px;">
    <strong>At the end of your exercise session</strong> it is important to relax your eyes by looking out of a window at a faraway object OR by closing your eyes for a few minutes. <strong>Do not proceed to do near work immediately.</strong>
</div>
`;

const nearContent = `
<p><strong>Purpose:</strong> To improve control of your eyes and encourage convergence.</p>
<ol style="margin-left: 20px; font-size: 1.1rem; line-height: 1.6;">
    <li>Hold the card with the images facing you at arm's length at eye level.<br><br></li>
    <li>Place a pen in front of the card and in between the two images.<br><br></li>
    <li>Keep looking at the pen constantly. It is very important at this stage of the exercise NOT to look directly at the card or the exercise will not work - look continuously at the pen.<br><br></li>
    <li>Whilst looking at the pen you should be aware of both the images becoming double, therefore you should see 4 images.<br><br></li>
    <li>4 images should become 3 images with the middle (fused) image appearing complete.<br><br></li>
    <li>Once the middle image appears, stop moving the pen and try to keep the third image in focus for <u>10 seconds</u>. Do NOT look at the middle complete image as it will disappear immediately if you do. If the third image disappears, stop counting and refocus to get the third image to appear again.<br><br></li>
    <li>Repeat.<br><br></li>
</ol>
<p><strong>Frequency:</strong> Perform for 10 to 15 minutes a day. This can be broken up into 2 or 3 sessions.</p>
<div style="background: #fff3cd; padding: 15px; border-radius: 10px; border-left: 5px solid #ffc107; margin-top: 20px;">
    <strong>At the end of your exercise session</strong> it is important to relax your eyes by looking out of a window at a faraway object OR by closing your eyes for a few minutes. <strong>Do not proceed to do near work immediately.</strong>
</div>
`;

const App = {
    currentUser: null,
    notificationTimeout: null,
    pixelsPerCm: 37.795,

    init() {
        const savedPpcm = localStorage.getItem('stereogram_calibration_ppcm');
        if (savedPpcm) {
            this.pixelsPerCm = parseFloat(savedPpcm);
        }
        
        Auth.init();
        Map.init();
        Game.init();
        Auth.checkSession(true);

        const handlePause = () => {
            const audio = document.getElementById('bgm-audio');
            if (audio && !audio.paused) {
                audio.pause();
                window.App.bgmWasPlaying = true;
            }
            
            if (window.Game && window.Game.isPlaying) {
                window.Game.pauseTimer();
                const btn = document.getElementById('btn-toggle-timer');
                if (btn) {
                    btn.innerText = "▶ ";
                    btn.title = "Resume Exercise";
                }
                window.Game.wasAutoPausedByVisibility = true;
            }
            
            if (window.Game && window.Game.hasStartedCurrentSession) {
                const user = window.App.currentUser;
                if (user && window.Game.timeLeft > 0 && window.Game.timeLeft < 600) {
                    user.savedSession = {
                        stageNode: window.Game.currentStageNode,
                        timeLeft: window.Game.timeLeft,
                        sessionStartLeft: window.Game.sessionStartLeft,
                        timestamp: new Date().getTime()
                    };
                    if (window.Progress) window.Progress.saveUser();
                }
            }
        };

        const handleResume = () => {
            const audio = document.getElementById('bgm-audio');
            if (window.App.bgmWasPlaying && audio && audio.paused) {
                audio.play().catch(e => console.log('Audio resume blocked', e));
                window.App.bgmWasPlaying = false;
            }
            
            if (window.Game && window.Game.wasAutoPausedByVisibility) {
                window.Game.startTimer();
                const btn = document.getElementById('btn-toggle-timer');
                if (btn) {
                    btn.innerText = "⏸";
                    btn.title = "Pause Exercise";
                }
                window.Game.wasAutoPausedByVisibility = false;
            }
        };

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) handlePause();
            else handleResume();
        });
        window.addEventListener("pagehide", handlePause);
        window.addEventListener("pageshow", handleResume);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'screen-game') {
            Game.resizeCanvas();
        }
    },

    async showMapScreen(specificMap = null) {
        const user = this.currentUser || {};
        let targetMap = 1;
        
        const hasBypass = (req) => {
            if (!user.passwords) return false;
            if (req === 7 && user.passwords.includes('orthoptics')) return true;
            if (req === 14 && user.passwords.includes('orthoptics 1')) return true;
            if (req === 21 && user.passwords.includes('orthoptics 2')) return true;
            if (req === 28 && user.passwords.includes('orthoptics 3')) return true;
            if (req === 35 && user.passwords.includes('orthoptics 4')) return true;
            if (req === 42 && user.passwords.includes('orthoptics 5')) return true;
            return false;
        };

        if (specificMap !== null) {
            targetMap = specificMap;
        } else {
            if (!hasBypass(14)) {
                targetMap = 1;
            } else if (!hasBypass(28)) {
                targetMap = 2;
            } else {
                targetMap = 3;
            }
        }

        this.showScreen('screen-map-' + targetMap);
        
        if (window.Map) {
            await new Promise(r => setTimeout(r, 50));
            window.Map.updateUI();
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
        const btnProgress = document.getElementById('btn-progress');
        if (btnProgress) {
            btnProgress.addEventListener('click', () => {
                window.App.showScreen('screen-progress');
                this.render();
            });
        }

        document.getElementById('btn-back-map-from-progress').addEventListener('click', () => {
            window.App.showMapScreen();
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
        
        let totalMins = daySessions.reduce((sum, s) => sum + (s.durationMins || 10), 0);
        document.getElementById('detail-duration').innerText = `${totalMins.toFixed(1)} mins`;

        let s1 = daySessions.filter(s => (s.stageNum || 1) === 1).reduce((sum, s) => sum + (s.durationMins || 10), 0);
        let s2 = daySessions.filter(s => s.stageNum === 2).reduce((sum, s) => sum + (s.durationMins || 10), 0);
        let s3 = daySessions.filter(s => s.stageNum === 3).reduce((sum, s) => sum + (s.durationMins || 10), 0);

        document.getElementById('detail-duration-s1').innerText = `${s1.toFixed(1)} mins`;
        document.getElementById('detail-duration-s2').innerText = `${s2.toFixed(1)} mins`;
        document.getElementById('detail-duration-s3').innerText = `${s3.toFixed(1)} mins`;
    },

    renderSummary() {
        const sessions = this.getSessions();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[month];
        
        let totalMins = 0;
        const uniqueDays = new Set();

        sessions.forEach(s => {
            const d = new Date(s.timestamp);
            if (d.getMonth() === month && d.getFullYear() === year) {
                uniqueDays.add(d.toDateString());
                totalMins += (s.durationMins || 10);
            }
        });

        const monthCount = uniqueDays.size;
        const avgDuration = monthCount > 0 ? (totalMins / monthCount).toFixed(1) : "0.0";

        document.getElementById('title-stat-month').innerText = `Total number of days done in the month of ${monthName}`;
        document.getElementById('stat-month').innerText = monthCount;

        document.getElementById('title-stat-duration').innerText = `Average Duration`;
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
            window.App.showMapScreen();
        });

        document.getElementById('btn-back-main-menu').addEventListener('click', () => {
            window.App.showScreen('screen-main-menu');
        });

        const btnBackMap = document.getElementById('btn-back-main-menu-from-map');
        if (btnBackMap) {
            btnBackMap.addEventListener('click', () => {
                window.App.showScreen('screen-main-menu');
            });
        }

        document.getElementById('btn-inst-dist').addEventListener('click', () => {
            document.getElementById('written-inst-title').innerText = "Cat Stereogram Exercise (Distance)";
            document.getElementById('written-inst-content').innerHTML = distContent;
            window.App.showScreen('screen-written-instruction');
        });

        document.getElementById('btn-inst-near').addEventListener('click', () => {
            document.getElementById('written-inst-title').innerText = "Cat Stereogram Exercise (Near)";
            document.getElementById('written-inst-content').innerHTML = nearContent;
            window.App.showScreen('screen-written-instruction');
        });

        document.getElementById('btn-back-instructions').addEventListener('click', () => {
            window.App.showScreen('screen-instructions');
        });

        const btnCalibrate = document.getElementById('btn-menu-calibrate');
        if (btnCalibrate) {
            btnCalibrate.addEventListener('click', () => {
                window.App.showScreen('screen-calibration');
                // Show instructions modal
                const calModal = document.getElementById('calibration-modal');
                if (calModal) calModal.classList.remove('hidden');
                
                const card = document.getElementById('calibration-card');
                window.App.currentCalibrationWidth = 8.56 * window.App.pixelsPerCm;
                card.style.width = window.App.currentCalibrationWidth + 'px';
            });
        }
        
        const btnAlarm = document.getElementById('btn-menu-alarm');
        const alarmModal = document.getElementById('alarm-modal');
        if (btnAlarm && alarmModal) {
            btnAlarm.addEventListener('click', () => {
                alarmModal.classList.remove('hidden');
            });
            
            document.getElementById('btn-cancel-alarm').addEventListener('click', () => {
                alarmModal.classList.add('hidden');
            });

            document.getElementById('btn-confirm-alarm').addEventListener('click', () => {
                const timeVal = document.getElementById('alarm-time').value; // "HH:MM"
                const freqVal = document.getElementById('alarm-freq').value; // "DAILY" etc
                const textVal = document.getElementById('alarm-text').value || "Eye Gym Exercise";
                
                const now = new Date();
                const [hours, minutes] = timeVal.split(':');
                
                let alarmDate = new Date();
                alarmDate.setHours(parseInt(hours, 10));
                alarmDate.setMinutes(parseInt(minutes, 10));
                alarmDate.setSeconds(0);
                
                // If the selected time is strictly in the past for today, schedule for tomorrow
                if (alarmDate <= now) {
                    alarmDate.setDate(alarmDate.getDate() + 1);
                }
                
                const formatICSDate = (date) => {
                    const pad = (n) => n < 10 ? '0' + n : n;
                    return date.getUTCFullYear() + 
                           pad(date.getUTCMonth() + 1) + 
                           pad(date.getUTCDate()) + 'T' + 
                           pad(date.getUTCHours()) + 
                           pad(date.getUTCMinutes()) + 
                           pad(date.getUTCSeconds()) + 'Z';
                };
                
                const rruleLine = freqVal === "ONCE" ? "" : `\nRRULE:FREQ=${freqVal}`;
                
                const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SNEC//Eye Gym Exercise//EN
BEGIN:VEVENT
UID:${now.getTime()}@eyegym.app
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(alarmDate)}${rruleLine}
SUMMARY:Eye Gym Exercise
DESCRIPTION:${textVal}
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
                
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'Eye_Gym_Reminder.ics';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alarmModal.classList.add('hidden');
                window.App.showNotification("Calendar reminder file generated! Please open it to add to your calendar.", "success");
            });
        }
        
        const btnCloseCalModal = document.getElementById('btn-close-calibration-modal');
        if (btnCloseCalModal) {
            btnCloseCalModal.addEventListener('click', () => {
                document.getElementById('calibration-modal').classList.add('hidden');
            });
        }

        const btnBackCalibrate = document.getElementById('btn-back-calibrate');
        if (btnBackCalibrate) {
            btnBackCalibrate.addEventListener('click', () => {
                window.App.showScreen('screen-main-menu');
            });
        }

        // Pinch to zoom logic for calibration
        const calArea = document.getElementById('calibration-content-area');
        const calCard = document.getElementById('calibration-card');
        
        let initialPinchDistance = null;
        let initialCardWidth = null;

        if (calArea) {
            calArea.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    initialPinchDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    initialCardWidth = window.App.currentCalibrationWidth;
                }
            });

            calArea.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2 && initialPinchDistance !== null) {
                    // Prevent default scrolling during pinch
                    e.preventDefault();
                    const currentDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const scale = currentDistance / initialPinchDistance;
                    let newWidth = initialCardWidth * scale;
                    // Clamp width logically
                    if (newWidth < 50) newWidth = 50;
                    if (newWidth > window.innerWidth * 2) newWidth = window.innerWidth * 2;
                    
                    window.App.currentCalibrationWidth = newWidth;
                    calCard.style.width = newWidth + 'px';
                }
            }, { passive: false });

            calArea.addEventListener('touchend', (e) => {
                if (e.touches.length < 2) {
                    initialPinchDistance = null;
                }
            });
            
            calArea.addEventListener('touchcancel', (e) => {
                initialPinchDistance = null;
            });
        }

        const btnSaveCalibration = document.getElementById('btn-save-calibration');
        if (btnSaveCalibration) {
            btnSaveCalibration.addEventListener('click', () => {
                const ppcm = window.App.currentCalibrationWidth / 8.56;
                window.App.pixelsPerCm = ppcm;
                localStorage.setItem('stereogram_calibration_ppcm', ppcm);
                window.App.showNotification("Calibration saved successfully!");
                window.App.showScreen('screen-main-menu');
            });
        }
    }
};

window.App = App;
window.ProgressReport = ProgressReport;
window.Menu = Menu;
window.Progress = Progress;

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
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('is-mobile');
    }

    App.init();
    ProgressReport.init();
    Menu.init();

    const btnCloseReward = document.getElementById('btn-close-reward');
    if (btnCloseReward) {
        btnCloseReward.addEventListener('click', async () => {
            document.getElementById('reward-modal').classList.add('hidden');
            window.Confetti.stop();
            window.App.showMapScreen(window.App.pendingRewardMap || null);
            
            if (window.App.pendingAnimation) {
                const { stageNum, oldPlays, newPlays } = window.App.pendingAnimation;
                window.App.pendingAnimation = null;
                await new Promise(r => setTimeout(r, 100)); // wait for layout to catch up
                await window.Map.animateAvatarProgress(stageNum, oldPlays, newPlays);
                window.Map.updateUI();
            }
        });
    }

    const btnCloseFinalGoal = document.getElementById('btn-close-final-goal');
    if (btnCloseFinalGoal) {
        btnCloseFinalGoal.addEventListener('click', () => {
            document.getElementById('final-goal-modal').classList.add('hidden');
            if (window.Confetti) window.Confetti.stop();
        });
    }

    // Global Audio Mute Logic
    const audio = document.getElementById('bgm-audio');
    const muteBtns = document.querySelectorAll('.btn-mute');
    if (audio && muteBtns.length > 0) {
        let isMuted = localStorage.getItem('stereogram_is_muted') === 'true';
        audio.muted = isMuted;
        muteBtns.forEach(btn => btn.innerText = isMuted ? "🔇" : "🔊");

        muteBtns.forEach(muteBtn => {
            muteBtn.addEventListener('click', () => {
                isMuted = !isMuted;
                audio.muted = isMuted;
                localStorage.setItem('stereogram_is_muted', isMuted);
                muteBtns.forEach(btn => btn.innerText = isMuted ? "🔇" : "🔊");
                
                // Auto-play if unmuted and user is active
                if (!isMuted && window.App.currentUser) {
                    audio.play().catch(e => console.log('Audio autoplay blocked', e));
                }
            });
        });
    }
});
