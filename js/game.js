// js/game.js
export const Game = {
    canvas: null,
    ctx: null,
    animationId: null,
    isPlaying: false,
    timerInterval: null,
    timeLeft: 600, // 10 minutes in seconds
    currentStage: 1,
    imageObj: null,

    // Particles for dynamic 60fps feel
    particles: [],

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
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

        // Debug button to finish immediately
        document.getElementById('btn-debug-complete').addEventListener('click', () => {
            this.timeLeft = 1; // trigger end
            if (!this.isPlaying) this.startTimer();
        });
    },

    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    },

    startStage(stageNum) {
        this.currentStage = stageNum;
        this.timeLeft = 600; // Reset to 10 mins
        this.updateTimerDisplay();
        
        document.getElementById('current-stage-title').innerText = `Stage ${stageNum}`;
        document.getElementById('btn-toggle-timer').innerText = "Start Exercise";
        
        this.loadImage(stageNum);
        
        // Init particles
        this.particles = [];
        for(let i=0; i<50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 5 + 2,
                color: Math.random() > 0.5 ? '#ff6b6b' : '#4ecdc4'
            });
        }

        window.App.showScreen('screen-game');
        this.resizeCanvas();
        this.startGameLoop();
    },

    loadImage(stageNum) {
        this.imageObj = new Image();
        // Fallback to placeholder if local file not found in prototype
        this.imageObj.onerror = () => {
            console.warn(`Could not load Cat ${stageNum}. Using fallback rendering.`);
            this.imageObj = null;
        };
        // Use relative paths to the current directory
        if (stageNum === 1) {
            this.imageObj.src = 'Cat 1.png';
        } else {
            this.imageObj.src = 'Cat 2.avif';
        }
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
        // Clear canvas
        this.ctx.fillStyle = '#1a1a24';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Image if loaded
        if (this.imageObj && this.imageObj.complete && this.imageObj.naturalWidth > 0) {
            // Calculate aspect ratio fit
            const imgRatio = this.imageObj.width / this.imageObj.height;
            const canvasRatio = this.canvas.width / this.canvas.height;
            let drawWidth, drawHeight, x, y;

            if (canvasRatio > imgRatio) {
                drawHeight = this.canvas.height * 0.8;
                drawWidth = drawHeight * imgRatio;
            } else {
                drawWidth = this.canvas.width * 0.8;
                drawHeight = drawWidth / imgRatio;
            }
            x = (this.canvas.width - drawWidth) / 2;
            y = (this.canvas.height - drawHeight) / 2;

            this.ctx.drawImage(this.imageObj, x, y, drawWidth, drawHeight);
        } else {
            // Draw placeholder text if image missing
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Stereogram Image ${this.currentStage} Loading...`, this.canvas.width/2, this.canvas.height/2);
        }

        // Draw floating particles to give 60fps dynamic feel
        if (this.isPlaying) {
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if(p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if(p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = 0.5;
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            });
        }
    },

    startTimer() {
        this.isPlaying = true;
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
    },

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        document.getElementById('timer-display').innerText = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    onSessionComplete() {
        this.pauseTimer();
        this.stopGame();
        
        // Requirements:
        // For every 10 minutes, a celebration notification will appear 
        // At the end of 10 minutes, reminder of patient to take eye breaks and rest
        
        // Show celebration
        window.App.showNotification("🎉 Exercise Complete! Awesome job! 🎉", "success");
        
        setTimeout(() => {
            // Show rest reminder
            window.App.showNotification("Please take an eye break and rest your eyes.", "warning");
        }, 3000); // 3 seconds later

        // Record progress
        if (window.Progress) window.Progress.completeSession();

        // Return to map
        window.App.showScreen('screen-map');
    },

    stopGame() {
        this.pauseTimer();
        this.isPlaying = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
};
