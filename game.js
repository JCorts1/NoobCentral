class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        this.distance = 0;
        this.gameSpeed = 3;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.buildings = [];
        this.currentCharacter = 'juan';
        this.player = null;
        this.keys = {};
        this.gameRunning = true;
        this.isMobile = window.innerWidth <= 768;
        this.showWelcome = false; // DISABLE WELCOME SCREEN FOR NOW
        this.welcomeTimer = 0;
        
        this.setupCanvas();
        this.setupControls();
        this.generateInitialCity();
        this.setupMusic();
        this.setupAudio();
        
        // Create player immediately
        this.createPlayer();
        
        this.gameLoop();
    }
    
    setupCanvas() {
        if (this.isMobile) {
            // Smaller height on mobile with thick borders
            this.canvas.width = window.innerWidth - 40; // Account for borders
            this.canvas.height = window.innerHeight * 0.8; // 80% height
            
            // Prevent scrolling on mobile
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        } else {
            this.canvas.width = Math.min(1200, window.innerWidth - 40);
            this.canvas.height = Math.min(800, window.innerHeight - 40);
        }
        
        // Scale factor for different screen sizes
        this.scaleFactor = this.isMobile ? Math.min(this.canvas.width / 800, this.canvas.height / 600) : 1;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameRunning && this.player) this.player.jump();
            }
            if (e.key === 'q' || e.key === 'Q') {
                if (this.gameRunning && this.player) this.player.special();
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.gameRunning && this.player) this.player.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Canvas controls for both mouse and touch
        const handleCanvasInteraction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && this.player) {
                this.player.jump();
            } else if (this.gameRunning && !this.player) {
                this.createPlayer();
            }
        };
        
        this.canvas.addEventListener('click', handleCanvasInteraction);
        this.canvas.addEventListener('touchstart', handleCanvasInteraction, { passive: false });
        
        // Character selection buttons with touch support
        document.querySelectorAll('.character-btn').forEach(btn => {
            const handleCharacterSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.gameRunning) return;
                
                const activeBtn = document.querySelector('.character-btn.active');
                if (activeBtn) activeBtn.classList.remove('active');
                
                e.target.classList.add('active');
                this.currentCharacter = e.target.dataset.character;
                this.createPlayer();
            };
            
            btn.addEventListener('click', handleCharacterSelect);
            btn.addEventListener('touchstart', handleCharacterSelect, { passive: false });
        });
        
        // Mobile button controls with both click and touch events
        const jumpBtn = document.getElementById('jumpBtn');
        const attackBtn = document.getElementById('attackBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        // Jump button
        const handleJump = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && this.player) {
                this.player.jump();
            } else if (this.gameRunning && !this.player) {
                this.createPlayer();
            }
        };
        
        jumpBtn.addEventListener('click', handleJump);
        jumpBtn.addEventListener('touchstart', handleJump, { passive: false });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Attack button
        const handleAttack = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.showWelcome) {
                this.showWelcome = false;
                return;
            }
            if (this.gameRunning && this.player) this.player.shoot();
        };
        
        attackBtn.addEventListener('click', handleAttack);
        attackBtn.addEventListener('touchstart', handleAttack, { passive: false });
        attackBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Special button
        const handleSpecial = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.showWelcome) {
                this.showWelcome = false;
                return;
            }
            if (this.gameRunning && this.player) this.player.special();
        };
        
        specialBtn.addEventListener('click', handleSpecial);
        specialBtn.addEventListener('touchstart', handleSpecial, { passive: false });
        specialBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Handle resize and orientation changes
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.setupCanvas();
            
            // Update player position if needed
            if (this.player) {
                this.player.groundY = this.canvas.height - 50 - this.player.height;
                if (this.player.y > this.player.groundY) {
                    this.player.y = this.player.groundY;
                }
            }
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.setupCanvas();
            }, 100);
        });
        
        // Prevent scrolling on mobile but allow button interactions
        document.addEventListener('touchmove', (e) => {
            if (!e.target.classList.contains('control-btn') && 
                !e.target.classList.contains('character-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    createPlayer() {
        const x = this.isMobile ? 60 : 100; // Move character back on mobile
        const groundLevel = this.canvas.height - 60; // Ground level
        const characterHeight = 100;
        const y = groundLevel - characterHeight; // Position on ground
        
        console.log('Creating player at:', x, y, 'Canvas height:', this.canvas.height);
        
        switch (this.currentCharacter) {
            case 'juan':
                this.player = new Juan(x, y, this);
                break;
            case 'kim':
                this.player = new Kim(x, y, this);
                break;
            case 'julian':
                this.player = new Julian(x, y, this);
                break;
            case 'jay':
                this.player = new Jay(x, y, this);
                break;
        }
        
        console.log('Player created:', this.player);
    }
    
    generateInitialCity() {
        for (let i = 0; i < 12; i++) {
            this.buildings.push(new Building(i * 200, this));
        }
    }
    
    setupMusic() {
        const music = document.getElementById('backgroundMusic');
        music.volume = 0.3;
        music.play().catch(() => {
            console.log('Music autoplay blocked - user interaction needed');
        });
    }
    
    setupAudio() {
        this.audioContext = null;
        
        // Enable audio context on first user interaction
        const enableAudio = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                } catch (e) {
                    console.log('Web Audio API not supported');
                }
            }
        };
        
        // Enable audio on any user interaction
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, enableAudio, { once: true });
        });
    }
    
    playShootSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    spawnEnemy() {
        const spawnRate = this.isMobile ? 0.008 : 0.01;
        if (Math.random() < spawnRate + (this.distance / 10000)) {
            this.enemies.push(new Enemy(this.canvas.width + 50, this));
        }
    }
    
    updateCity() {
        this.buildings.forEach((building, index) => {
            building.update();
            if (building.x < -250) {
                this.buildings.splice(index, 1);
                this.buildings.push(new Building(this.buildings[this.buildings.length - 1].x + 200 + Math.random() * 100, this));
            }
        });
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        this.enemies.forEach((enemy, index) => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                this.gameOver();
            }
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = Math.floor(this.distance);
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Distance: ${Math.floor(this.distance)}m`;
        
        if (this.player) {
            document.getElementById('energy').textContent = `Energy: ${Math.floor(this.player.energy)}%`;
            
            // Update character name in UI
            const characterNameEl = document.getElementById('characterName');
            if (characterNameEl) {
                characterNameEl.textContent = `Character: ${this.player.name}`;
            }
        } else {
            document.getElementById('energy').textContent = `Energy: 0%`;
            const characterNameEl = document.getElementById('characterName');
            if (characterNameEl) {
                characterNameEl.textContent = `Character: Loading...`;
            }
        }
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Ensure player exists before updating
        if (!this.player) {
            console.log('No player, creating one...');
            this.createPlayer();
            return;
        }
        
        console.log('Game updating, distance:', this.distance, 'player pos:', this.player.x, this.player.y);
        
        this.distance += this.gameSpeed * 0.1;
        this.gameSpeed += 0.001;
        
        this.player.update();
        this.updateCity();
        
        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.x < -50) {
                this.enemies.splice(index, 1);
            }
        });
        
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.life <= 0 || projectile.x > this.canvas.width + 50) {
                this.projectiles.splice(index, 1);
            }
        });
        
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        this.spawnEnemy();
        this.checkCollisions();
        this.updateUI();
    }
    
    draw() {
        // Night sky background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0B1426'); // Dark blue night
        gradient.addColorStop(1, '#1a1a2e'); // Darker at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Stars
        this.drawStars();
        
        this.drawGround();
        this.buildings.forEach(building => building.draw());
        
        // Only draw player if it exists
        if (this.player) {
            console.log('Drawing player at:', this.player.x, this.player.y);
            this.player.draw();
        } else {
            console.log('No player to draw');
        }
        
        this.enemies.forEach(enemy => enemy.draw());
        this.projectiles.forEach(projectile => projectile.draw());
        this.particles.forEach(particle => particle.draw());
    }
    
    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 31 + this.distance * 0.1) % this.canvas.width;
            const y = (i * 17) % (this.canvas.height / 2);
            this.ctx.fillRect(x, y, 2, 2);
        }
    }
    
    drawWelcomeScreen() {
        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Colombian flag
        this.drawColombianFlag();
        
        // Welcome text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `${this.isMobile ? '24' : '32'}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WELCOME TO', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = `${this.isMobile ? '36' : '48'}px monospace`;
        this.ctx.fillText('MEDELLÍN', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${this.isMobile ? '16' : '20'}px monospace`;
        this.ctx.fillText('Press any key to continue...', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
    
    drawColombianFlag() {
        const flagWidth = this.isMobile ? 120 : 160;
        const flagHeight = this.isMobile ? 80 : 100;
        const flagX = this.canvas.width / 2 - flagWidth / 2;
        const flagY = this.canvas.height / 2 - 150;
        
        // Yellow (top half)
        this.ctx.fillStyle = '#FFDE00';
        this.ctx.fillRect(flagX, flagY, flagWidth, flagHeight / 2);
        
        // Blue (bottom quarter)
        this.ctx.fillStyle = '#0033A0';
        this.ctx.fillRect(flagX, flagY + flagHeight / 2, flagWidth, flagHeight / 4);
        
        // Red (bottom quarter)
        this.ctx.fillStyle = '#CE1126';
        this.ctx.fillRect(flagX, flagY + (flagHeight * 3) / 4, flagWidth, flagHeight / 4);
        
        // Pixelated border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(flagX, flagY, flagWidth, flagHeight);
    }
    
    drawGround() {
        const groundHeight = this.isMobile ? 60 : 50;
        
        this.ctx.fillStyle = '#2d2d2d'; // Darker for night
        this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
        
        const lineSpacing = this.isMobile ? 25 : 20;
        for (let i = 0; i < this.canvas.width; i += lineSpacing) {
            this.ctx.fillStyle = '#404040'; // Lighter lines for night
            this.ctx.fillRect(i - (this.distance * this.gameSpeed) % lineSpacing, this.canvas.height - groundHeight - 5, lineSpacing / 2, 5);
        }
    }
}

class Character {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 80;
        this.height = 100;
        this.energy = 0;
        this.jumpVelocity = 0;
        this.onGround = true;
        this.gravity = 0.8;
        this.jumpPower = -18; // Higher jump
        this.groundY = game.canvas.height - 60 - this.height;
        this.specialCooldown = 0;
        this.shootCooldown = 0;
        this.animFrame = 0;
        this.animSpeed = 8;
    }
    
    update() {
        this.animFrame++;
        
        if (!this.onGround) {
            this.jumpVelocity += this.gravity;
            this.y += this.jumpVelocity;
            
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.jumpVelocity = 0;
                this.onGround = true;
            }
        }
        
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        this.energy = Math.min(100, this.energy + 0.5);
    }
    
    jump() {
        if (this.onGround) {
            this.jumpVelocity = this.jumpPower;
            this.onGround = false;
        }
    }
    
    drawPixelHuman(ctx, color, hairStyle = 'normal', accessories = null) {
        console.log('drawPixelHuman called at:', this.x, this.y, 'color:', color, 'hairStyle:', hairStyle);
        // Head with better shading
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(this.x + 25, this.y + 15, 20, 20);
        
        // Head highlight
        ctx.fillStyle = '#FFEECC';
        ctx.fillRect(this.x + 27, this.y + 17, 6, 6);
        
        // Hair based on style
        if (hairStyle === 'long') {
            // Long hair for Juan (dark brown)
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 10, this.y + 8, 50, 25); // Wider and longer
            ctx.fillRect(this.x + 5, this.y + 20, 60, 15); // Even wider at shoulders
            
            // Hair highlights
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 15, this.y + 12, 8, 20);
            ctx.fillRect(this.x + 47, this.y + 12, 8, 20);
        } else if (hairStyle === 'short') {
            // Short hair for Julian (light brown)
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x + 18, this.y + 8, 34, 15); // Shorter and closer to head
            
            // Hair texture
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 22, this.y + 10, 4, 8);
            ctx.fillRect(this.x + 40, this.y + 10, 4, 8);
        } else if (hairStyle === 'longfemale') {
            // Long feminine hair for Kim (lighter brown)
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(this.x + 12, this.y + 6, 46, 30); // Long and flowing
            ctx.fillRect(this.x + 8, this.y + 18, 54, 20); // Wider at bottom
            
            // Hair shine
            ctx.fillStyle = '#F5DEB3';
            ctx.fillRect(this.x + 20, this.y + 10, 6, 25);
            ctx.fillRect(this.x + 44, this.y + 10, 6, 25);
        } else if (hairStyle === 'muscular') {
            // Normal hair for muscular Jay (black hair)
            ctx.fillStyle = '#2F2F2F';
            ctx.fillRect(this.x + 15, this.y + 8, 40, 20);
            
            // Hair highlights
            ctx.fillStyle = '#4F4F4F';
            ctx.fillRect(this.x + 18, this.y + 12, 6, 12);
            ctx.fillRect(this.x + 46, this.y + 12, 6, 12);
        } else {
            // Normal hair
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 15, this.y + 8, 40, 20);
        }
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 28, this.y + 22, 3, 3);
        ctx.fillRect(this.x + 39, this.y + 22, 3, 3);
        
        // Eye pupils
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 29, this.y + 23, 1, 1);
        ctx.fillRect(this.x + 40, this.y + 23, 1, 1);
        
        // Body with shading (muscular chest for Jay)
        const bodyWidth = isMuscular ? 36 : 32;
        ctx.fillStyle = color;
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 35, bodyWidth, 40);
        
        // Body highlight
        const darkerColor = this.darkenColor(color);
        ctx.fillStyle = darkerColor;
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 35, 4, 40); // Left shadow
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 71, bodyWidth, 4); // Bottom shadow
        
        // Chest muscles for Jay
        if (isMuscular) {
            ctx.fillStyle = darkerColor;
            ctx.fillRect(this.x + 22, this.y + 40, 8, 6); // Left pec
            ctx.fillRect(this.x + 44, this.y + 40, 8, 6); // Right pec
        }
        
        // Arms with better definition (muscular if specified)
        const isMuscular = hairStyle === 'muscular';
        const armWidth = isMuscular ? 20 : 16;
        const armHeight = isMuscular ? 28 : 24;
        
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(this.x + 4, this.y + 40, armWidth, armHeight);
        ctx.fillRect(this.x + (isMuscular ? 56 : 52), this.y + 40, armWidth, armHeight);
        
        // Arm shading
        ctx.fillStyle = '#E6C7A3';
        ctx.fillRect(this.x + 4, this.y + 40, 3, armHeight);
        ctx.fillRect(this.x + (isMuscular ? 73 : 65), this.y + 40, 3, armHeight);
        
        // Muscle definition for Jay
        if (isMuscular) {
            ctx.fillStyle = '#DDB896';
            ctx.fillRect(this.x + 8, this.y + 44, 6, 4); // Left bicep
            ctx.fillRect(this.x + 60, this.y + 44, 6, 4); // Right bicep
        }
        
        // Pants with better shading (bigger for muscular)
        const pantsWidth = isMuscular ? 36 : 32;
        ctx.fillStyle = '#0066CC';
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 75, pantsWidth, 25);
        
        ctx.fillStyle = '#004499';
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 75, 4, 25);
        ctx.fillRect(this.x + (isMuscular ? 18 : 20), this.y + 96, pantsWidth, 4);
        
        // Shoes with detail
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 12, this.y + 88, 24, 12);
        ctx.fillRect(this.x + 44, this.y + 88, 24, 12);
        
        // Shoe laces
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 20, this.y + 92, 8, 1);
        ctx.fillRect(this.x + 52, this.y + 92, 8, 1);
        
        // Legs with animation (thicker for muscular)
        const legOffset = Math.floor(this.animFrame / this.animSpeed) % 2 === 0 ? 4 : -4;
        const legWidth = isMuscular ? 12 : 10;
        ctx.fillStyle = '#0066CC';
        ctx.fillRect(this.x + 22 + legOffset, this.y + 75, legWidth, 28);
        ctx.fillRect(this.x + (isMuscular ? 38 : 40) - legOffset, this.y + 75, legWidth, 28);
        
        // Name is now displayed in UI instead of above character
        
        // Add accessories if provided
        if (accessories) {
            accessories.forEach(acc => acc(ctx, this.x, this.y));
        }
    }
    
    darkenColor(color) {
        const colors = {
            '#FF6B35': '#CC5428',
            '#FF69B4': '#CC5490',
            '#32CD32': '#28A428',
            '#00BFFF': '#0099CC'
        };
        return colors[color] || color;
    }
    
    special() {
        if (this.energy >= 100 && this.specialCooldown <= 0) {
            this.performSpecial();
            this.energy = 0;
            this.specialCooldown = 300;
        }
    }
    
    shoot() {
        if (this.shootCooldown <= 0) {
            this.performShoot();
            this.shootCooldown = 20;
        }
    }
    
    performSpecial() {}
    
    performShoot() {}
}

class Juan extends Character {
    constructor(x, y, game) {
        super(x, y, game);
        this.name = 'Juan';
    }
    
    draw() {
        const guitarAccessory = (ctx, x, y) => {
            // Guitar body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - 10, y + 55, 24, 10);
            ctx.fillRect(x - 16, y + 45, 16, 28);
            
            // Guitar strings
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x - 12, y + 48, 2, 22);
            ctx.fillRect(x - 8, y + 48, 2, 22);
            ctx.fillRect(x - 4, y + 48, 2, 22);
            
            // Guitar highlight
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x - 14, y + 47, 2, 24);
        };
        
        this.drawPixelHuman(this.game.ctx, '#FF6B35', 'long', [guitarAccessory]);
    }
    
    performShoot() {
        this.game.projectiles.push(new GuitarNote(this.x + 80, this.y + 50, 0, this.game));
        this.game.playShootSound();
    }
    
    performSpecial() {
        // EPIC GUITAR SOLO - 16 musical notes in all directions
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            this.game.projectiles.push(new PowerGuitarNote(this.x + 40, this.y + 50, angle, this.game));
        }
        
        // Visual effect
        for (let i = 0; i < 30; i++) {
            this.game.particles.push(new MusicalNote(this.x + 40, this.y + 50, this.game));
        }
    }
}

class Kim extends Character {
    constructor(x, y, game) {
        super(x, y, game);
        this.name = 'Kim';
    }
    
    draw() {
        const jewelryAccessory = (ctx, x, y) => {
            // Jewelry
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + 28, y + 25, 5, 5); // Left earring
            ctx.fillRect(x + 45, y + 25, 5, 5); // Right earring
            ctx.fillRect(x + 32, y + 42, 10, 3); // Necklace
            
            // Bracelet
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + 52, y + 62, 6, 3);
            
            // Ring
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + 58, y + 58, 3, 2);
        };
        
        this.drawPixelHuman(this.game.ctx, '#FF69B4', 'longfemale', [jewelryAccessory]);
    }
    
    performShoot() {
        this.game.projectiles.push(new Jewelry(this.x + 80, this.y + 50, 0, this.game));
        this.game.playShootSound();
    }
    
    performSpecial() {
        // BUG SWARM ATTACK - bugs target all nearby enemies
        this.game.enemies.forEach(enemy => {
            const distance = Math.abs(enemy.x - this.x);
            if (distance < 400) {
                for (let i = 0; i < 8; i++) {
                    this.game.projectiles.push(new Bug(this.x + 40, this.y + 50, enemy, this.game));
                }
            }
        });
        
        // Visual swarm effect
        for (let i = 0; i < 50; i++) {
            this.game.particles.push(new BugParticle(this.x + 40, this.y + 50, this.game));
        }
    }
}

class Julian extends Character {
    constructor(x, y, game) {
        super(x, y, game);
        this.name = 'Julian-ElPez';
    }
    
    draw() {
        const plantAccessory = (ctx, x, y) => {
            // Plant pot in hand
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 58, y + 42, 12, 10);
            
            // Pot rim
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x + 57, y + 41, 14, 2);
            
            // Plant stem
            ctx.fillStyle = '#228B22';
            ctx.fillRect(x + 61, y + 35, 6, 12);
            
            // Plant leaves
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(x + 58, y + 32, 12, 10);
            
            // Extra leaves
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(x + 56, y + 34, 4, 6);
            ctx.fillRect(x + 70, y + 36, 4, 4);
        };
        
        this.drawPixelHuman(this.game.ctx, '#32CD32', 'short', [plantAccessory]);
    }
    
    performShoot() {
        this.game.projectiles.push(new Seed(this.x + 80, this.y + 50, 0, this.game));
        this.game.playShootSound();
    }
    
    performSpecial() {
        // NATURE'S WRATH - Giant tree devours all enemies on screen
        this.game.enemies.forEach((enemy, index) => {
            const distance = Math.abs(enemy.x - this.x);
            if (distance < 500) {
                this.game.enemies.splice(index, 1);
                // Tree eating effect
                for (let i = 0; i < 20; i++) {
                    this.game.particles.push(new TreeParticle(enemy.x, enemy.y, this.game));
                }
            }
        });
        
        // Giant tree visual effect
        for (let i = 0; i < 100; i++) {
            this.game.particles.push(new TreeParticle(
                this.x + Math.random() * 200 - 100,
                this.y + Math.random() * 100 - 50,
                this.game
            ));
        }
    }
}

class Jay extends Character {
    constructor(x, y, game) {
        super(x, y, game);
        this.name = 'Jay';
    }
    
    draw() {
        const techAccessory = (ctx, x, y) => {
            // Glasses
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 25, y + 22, 5, 5);
            ctx.fillRect(x + 40, y + 22, 5, 5);
            ctx.fillRect(x + 30, y + 24, 10, 2);
            
            // Glasses reflection
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 26, y + 23, 2, 2);
            ctx.fillRect(x + 41, y + 23, 2, 2);
            
            // Laptop
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 58, y + 48, 20, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 61, y + 51, 14, 6);
            
            // Screen glow
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(x + 63, y + 53, 10, 2);
            
            // Keyboard
            ctx.fillStyle = '#333';
            ctx.fillRect(x + 59, y + 58, 18, 2);
            
            // WiFi symbol
            ctx.fillStyle = '#0088FF';
            ctx.fillRect(x + 74, y + 45, 2, 1);
            ctx.fillRect(x + 73, y + 46, 4, 1);
        };
        
        this.drawPixelHuman(this.game.ctx, '#00BFFF', 'muscular', [techAccessory]);
    }
    
    performShoot() {
        this.game.projectiles.push(new Virus(this.x + 80, this.y + 50, 0, this.game));
        this.game.playShootSound();
    }
    
    performSpecial() {
        // SYSTEM OVERRIDE - Binary code fills screen, all enemies deleted
        this.game.enemies.forEach((enemy, index) => {
            this.game.enemies.splice(index, 1);
        });
        
        // Matrix-style binary code rain
        for (let i = 0; i < 300; i++) {
            this.game.particles.push(new BinaryCode(
                Math.random() * this.game.canvas.width,
                Math.random() * this.game.canvas.height,
                this.game
            ));
        }
    }
}

class Enemy {
    constructor(x, game) {
        this.x = x;
        this.y = game.canvas.height - 50 - 80;
        this.width = 60;
        this.height = 80;
        this.game = game;
        this.speed = game.gameSpeed + Math.random() * 2;
        this.enemyType = Math.floor(Math.random() * 3);
    }
    
    update() {
        this.x -= this.speed;
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        if (this.enemyType === 0) {
            // Red monster
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(this.x + 10, this.y + 10, 10, 10);
            ctx.fillRect(this.x + 40, this.y + 10, 10, 10);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 20, this.y + 40, 20, 10);
            
            // Spikes
            ctx.fillStyle = '#8B0000';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + 5 + i * 20, this.y - 5, 5, 8);
            }
        } else if (this.enemyType === 1) {
            // Purple alien
            ctx.fillStyle = '#800080';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#FF00FF';
            ctx.fillRect(this.x + 12, this.y + 8, 8, 12);
            ctx.fillRect(this.x + 40, this.y + 8, 8, 12);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 22, this.y + 35, 16, 8);
            
            // Tentacles
            ctx.fillStyle = '#800080';
            ctx.fillRect(this.x + 8, this.y + 70, 6, 12);
            ctx.fillRect(this.x + 46, this.y + 70, 6, 12);
        } else {
            // Dark robot
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x + 12, this.y + 12, 8, 8);
            ctx.fillRect(this.x + 40, this.y + 12, 8, 8);
            
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x + 20, this.y + 40, 20, 10);
            
            // Antenna
            ctx.fillStyle = '#999';
            ctx.fillRect(this.x + 28, this.y - 8, 4, 12);
            ctx.fillRect(this.x + 26, this.y - 10, 8, 4);
        }
    }
}

class Building {
    constructor(x, game) {
        this.x = x;
        this.game = game;
        this.width = 160 + Math.random() * 80;
        this.height = 250 + Math.random() * 400;
        this.y = game.canvas.height - 50 - this.height;
        this.color = this.getRandomBuildingColor();
        this.roofColor = this.getRoofColor();
        this.windows = this.generateWindows();
        this.buildingType = Math.floor(Math.random() * 3);
    }
    
    getRandomBuildingColor() {
        const colors = ['#2A2A2A', '#333', '#222', '#444', '#3A3A3A', '#1A1A1A', '#2F2F2F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getRoofColor() {
        const colors = ['#8B4513', '#A0522D', '#654321', '#8B0000', '#2F4F4F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateWindows() {
        const windows = [];
        const cols = Math.floor(this.width / 40);
        const rows = Math.floor(this.height / 45);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.2) {
                    windows.push({
                        x: col * 40 + 12,
                        y: row * 45 + 20,
                        lit: Math.random() > 0.4
                    });
                }
            }
        }
        return windows;
    }
    
    update() {
        this.x -= this.game.gameSpeed;
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        // Main building
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Roof
        ctx.fillStyle = this.roofColor;
        ctx.fillRect(this.x, this.y, this.width, 8);
        
        // Building details based on type
        if (this.buildingType === 0) {
            // Modern building with dark trim
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y + 8, 4, this.height - 8);
            ctx.fillRect(this.x + this.width - 4, this.y + 8, 4, this.height - 8);
        } else if (this.buildingType === 1) {
            // Classic building with columns
            ctx.fillStyle = '#AAA';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + (i + 1) * (this.width / 4) - 2, this.y + 8, 4, this.height - 8);
            }
        }
        
        // Windows
        this.windows.forEach(window => {
            if (window.lit) {
                // Glowing window
                ctx.fillStyle = '#FFFF99';
                ctx.fillRect(this.x + window.x, this.y + window.y, 18, 24);
                
                // Window glow effect
                ctx.fillStyle = 'rgba(255, 255, 153, 0.3)';
                ctx.fillRect(this.x + window.x - 1, this.y + window.y - 1, 20, 26);
                
                // Window frame
                ctx.fillStyle = '#FFF';
                ctx.fillRect(this.x + window.x + 8, this.y + window.y + 10, 2, 4);
                ctx.fillRect(this.x + window.x + 4, this.y + window.y + 18, 10, 2);
            } else {
                // Dark window
                ctx.fillStyle = '#111';
                ctx.fillRect(this.x + window.x, this.y + window.y, 18, 24);
            }
        });
        
        // Entrance for some buildings
        if (this.buildingType === 2 && Math.random() > 0.7) {
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x + this.width/2 - 12, this.y + this.height - 30, 24, 30);
        }
    }
}

class GuitarNote {
    constructor(x, y, angle, game) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.game = game;
        this.speed = 15;
        this.life = 80;
        this.size = 8;
        this.damage = 30;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
        
        // Check collision with enemies
        this.game.enemies.forEach((enemy, index) => {
            if (this.x < enemy.x + enemy.width &&
                this.x + this.size > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.size > enemy.y) {
                this.game.enemies.splice(index, 1);
                this.game.score += 10;
                this.life = 0;
            }
        });
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        
        // Musical note symbol
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - 2, this.y - 4, 4, 8);
    }
}

class PowerGuitarNote extends GuitarNote {
    constructor(x, y, angle, game) {
        super(x, y, angle, game);
        this.size = 10;
        this.damage = 50;
        this.speed = 18;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }
}

class Jewelry {
    constructor(x, y, angle, game) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.game = game;
        this.speed = 12;
        this.life = 70;
        this.size = 6;
        this.damage = 35;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
        
        this.game.enemies.forEach((enemy, index) => {
            if (this.x < enemy.x + enemy.width &&
                this.x + this.size > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.size > enemy.y) {
                this.game.enemies.splice(index, 1);
                this.game.score += 10;
                this.life = 0;
            }
        });
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

class Seed {
    constructor(x, y, angle, game) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.game = game;
        this.speed = 10;
        this.life = 90;
        this.size = 6;
        this.damage = 25;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
        
        this.game.enemies.forEach((enemy, index) => {
            if (this.x < enemy.x + enemy.width &&
                this.x + this.size > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.size > enemy.y) {
                this.game.enemies.splice(index, 1);
                this.game.score += 10;
                this.life = 0;
            }
        });
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }
}

class Virus {
    constructor(x, y, angle, game) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.game = game;
        this.speed = 16;
        this.life = 60;
        this.size = 8;
        this.damage = 40;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
        
        this.game.enemies.forEach((enemy, index) => {
            if (this.x < enemy.x + enemy.width &&
                this.x + this.size > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.size > enemy.y) {
                this.game.enemies.splice(index, 1);
                this.game.score += 10;
                this.life = 0;
            }
        });
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#00BFFF';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        
        // Binary pattern
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - 2, this.y - 2, 2, 2);
        ctx.fillRect(this.x + 2, this.y + 2, 2, 2);
    }
}

class Bug {
    constructor(x, y, target, game) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.game = game;
        this.speed = 10;
        this.life = 120;
        this.size = 6;
        this.damage = 20;
    }
    
    update() {
        if (this.target && this.target.x) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
            
            // Check collision with target
            if (distance < 10) {
                this.game.enemies = this.game.enemies.filter(e => e !== this.target);
                this.game.score += 10;
                this.life = 0;
            }
        }
        this.life--;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        
        // Bug wings
        ctx.fillStyle = '#DDD';
        ctx.fillRect(this.x - 2, this.y - 4, 4, 2);
    }
}

class Particle {
    constructor(x, y, color, game) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.game = game;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

class BinaryCode extends Particle {
    constructor(x, y, game) {
        super(x, y, '#00FF00', game);
        this.text = Math.random() > 0.5 ? '1' : '0';
        this.life = 90;
        this.maxLife = 90;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

class MusicalNote extends Particle {
    constructor(x, y, game) {
        super(x, y, '#FFD700', game);
        this.life = 60;
        this.maxLife = 60;
        this.note = ['♪', '♫', '♬'][Math.floor(Math.random() * 3)];
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.note, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

class BugParticle extends Particle {
    constructor(x, y, game) {
        super(x, y, '#8B4513', game);
        this.life = 40;
        this.maxLife = 40;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        ctx.globalAlpha = 1;
    }
}

class TreeParticle extends Particle {
    constructor(x, y, game) {
        super(x, y, '#228B22', game);
        this.life = 80;
        this.maxLife = 80;
        this.size = Math.random() * 4 + 2;
    }
    
    draw() {
        const ctx = this.game.ctx;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Add some leaves
        if (Math.random() > 0.7) {
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
    }
}

window.addEventListener('load', () => {
    new Game();
});