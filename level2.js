console.log('Level 2 script loading... VERTICAL RACING MODE v2.1');

class Level2Game {
    constructor() {
        console.log('Level 2 Game constructor called - Vertical Car Racing');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp

        this.canvas.width = 800;
        this.canvas.height = 600;
        this.distance = 0;
        this.gameSpeed = 4;
        this.gameRunning = true;
        this.frameCount = 0; // For animations

        this.loadProgress();

        this.isMobile = this.detectMobile();
        if (this.isMobile) {
            this.gameSpeed = 6;
        }

        this.gameMode = 'racing';
        this.roadOffset = 0;

        this.car = {
            x: this.canvas.width / 2 - 35,
            y: this.canvas.height - 130,
            width: 70,
            height: 110,
            speed: 8,
            maxX: this.canvas.width - 200 - 70,
            minX: 200
        };

        this.enemyCars = [];
        this.enemySpawnTimer = 0;
        this.carsAvoided = 0;
        this.enemyBullets = [];
        this.playerBullets = [];
        this.shootCooldown = 0;
        this.lastDistanceCheck = 0;
        this.levelComplete = false;
        this.winCondition = 2000; // Level ends at 2000 meters

        this.roadsideObjects = [];
        this.generateInitialRoadsideObjects();

        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

        this.audioContext = null;
        this.initAudio();

        this.setupControls();

        this.updateUI();

        console.log('Level 2 initialized - Driving mode activated!');
        this.gameLoop();
    }

    loadProgress() {
        const savedLives = localStorage.getItem('noobCentralLives');
        const savedEnergy = localStorage.getItem('noobCentralEnergy');
        const savedCharacter = localStorage.getItem('noobCentralCharacter');

        this.lives = savedLives ? parseInt(savedLives) : 5;
        this.energy = savedEnergy ? parseInt(savedEnergy) : 0;
        this.selectedCharacter = savedCharacter || 'juan';
        this.maxLives = 5;

        // Enhanced fuel system - car needs fuel to operate
        this.fuel = 100 + (this.energy / 2);
        this.maxFuel = this.fuel;
        this.fuelConsumptionRate = 0.08; // Increased consumption
        this.fuelPickups = []; // Fuel pickups on the road
        this.nextFuelPickup = 200; // First fuel pickup at 200m

        console.log(`Level 2 loaded with: ${this.lives} lives. Converted energy to ${this.fuel} starting fuel.`);
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    createTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    setupControls() {
        this.keys = {};

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.code === 'Space') {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.innerHTML = '⬅️';
            jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['ArrowLeft'] = true; });
            jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['ArrowLeft'] = false; });
        }

        const attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.innerHTML = '➡️';
            attackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['ArrowRight'] = true; });
            attackBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['ArrowRight'] = false; });
        }

        const specialBtn = document.getElementById('specialBtn');
        if (specialBtn) {
            specialBtn.innerHTML = '🚀';
            specialBtn.addEventListener('click', (e) => { e.preventDefault(); this.boost(); });
        }

        // Add shooting controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.keys[' ']) {
                e.preventDefault();
                this.shoot();
            }
        });
    }

    moveLeft() {
        if (this.car.x > this.car.minX) {
            this.car.x -= this.car.speed;
        }
    }

    moveRight() {
        if (this.car.x < this.car.maxX) {
            this.car.x += this.car.speed;
        }
    }

    boost() {
        if (this.fuel > 20) {
            this.fuel -= 20;
            this.createTone(600, 0.5, 'sawtooth', 0.2);
            this.addScreenShake(3, 500);

            // Create boost particles
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: this.car.x + (this.car.width / 2) + (Math.random() - 0.5) * 20,
                    y: this.car.y + this.car.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 5 + Math.random() * 5,
                    life: 20 + Math.random() * 10,
                    color: Math.random() > 0.5 ? '#FFA500' : '#FF4500',
                    type: 'flame'
                });
            }
        }
    }

    spawnEnemyCar() {
        const lanes = [220, 360, 510];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

        // Difficulty scales with distance
        const difficultyMultiplier = Math.min(this.distance / 500, 3); // Max 3x difficulty
        const hasGun = this.distance > 300 && Math.random() < (0.3 + difficultyMultiplier * 0.2);

        const enemyCar = {
            x: randomLane - 30,
            y: -120,
            width: 60,
            height: 100,
            speed: this.gameSpeed + Math.random() * 2 + difficultyMultiplier,
            type: Math.random() > 0.5 ? 'police' : 'enemy',
            color: `hsl(${Math.random() * 360}, 60%, 50%)`,
            hasGun: hasGun,
            shootTimer: Math.random() * 120, // Random initial shoot delay
            health: 1 + Math.floor(difficultyMultiplier / 2),

            update: function(game) {
                this.y += this.speed;
                
                // Shooting behavior
                if (this.hasGun && this.y > 0 && this.y < game.canvas.height - 200) {
                    this.shootTimer--;
                    if (this.shootTimer <= 0) {
                        this.shoot(game);
                        this.shootTimer = 60 + Math.random() * 120; // Random interval
                    }
                }
            },

            shoot: function(game) {
                game.enemyBullets.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height,
                    width: 4,
                    height: 8,
                    speed: 6,
                    color: '#FF0000'
                });
                game.createTone(300, 0.1, 'square', 0.1);
            },

            draw: function(ctx, frameCount) { // GRAPHICS UPGRADE: Pass frameCount for animations
                // Shared details
                const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                bodyGradient.addColorStop(0, this.color);
                bodyGradient.addColorStop(1, '#222');
                ctx.fillStyle = bodyGradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);

                // Windshield
                const glassGradient = ctx.createLinearGradient(0, this.y, 0, this.y + 20);
                glassGradient.addColorStop(0, '#aaccff');
                glassGradient.addColorStop(1, '#4466aa');
                ctx.fillStyle = glassGradient;
                ctx.fillRect(this.x + 8, this.y + 20, this.width - 16, 25);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(this.x + 10, this.y + 22, 5, 10); // Reflection

                // Wheels
                ctx.fillStyle = '#111';
                ctx.fillRect(this.x - 5, this.y + 15, 10, 20);
                ctx.fillRect(this.x - 5, this.y + 65, 10, 20);
                ctx.fillRect(this.x + this.width - 5, this.y + 15, 10, 20);
                ctx.fillRect(this.x + this.width - 5, this.y + 65, 10, 20);

                if (this.type === 'police') {
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(this.x, this.y + 50, this.width, 15);
                    ctx.font = 'bold 12px Courier New';
                    ctx.fillStyle = '#0000FF';
                    ctx.fillText('POLICE', this.x + 8, this.y + 62);

                    // Flashing lights
                    const lightOn = frameCount % 20 < 10;
                    ctx.fillStyle = lightOn ? '#FF0000' : '#440000';
                    ctx.fillRect(this.x + 10, this.y - 8, 15, 10);
                    ctx.fillStyle = !lightOn ? '#0000FF' : '#000044';
                    ctx.fillRect(this.x + 35, this.y - 8, 15, 10);
                } else {
                    // Spoiler
                    ctx.fillStyle = '#222';
                    ctx.fillRect(this.x, this.y + this.height - 5, this.width, 10);
                    ctx.fillRect(this.x - 5, this.y + this.height - 8, 5, 5);
                    ctx.fillRect(this.x + this.width, this.y + this.height - 8, 5, 5);
                }

                // Draw gun if enemy has one
                if (this.hasGun) {
                    ctx.fillStyle = '#444';
                    ctx.fillRect(this.x + this.width / 2 - 2, this.y + this.height - 10, 4, 15);
                    ctx.fillStyle = '#666';
                    ctx.fillRect(this.x + this.width / 2 - 1, this.y + this.height - 8, 2, 10);
                }
            }
        };

        this.enemyCars.push(enemyCar);
    }

    // GRAPHICS UPGRADE: Generate roadside objects
    generateInitialRoadsideObjects() {
        for (let i = 0; i < 20; i++) {
            this.spawnRoadsideObject(Math.random() * this.canvas.height);
        }
    }

    spawnRoadsideObject(yPos = -50) {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const object = {
            x: side === 'left' ? Math.random() * 150 : 650 + Math.random() * 150,
            y: yPos,
            width: 20 + Math.random() * 20,
            height: 40 + Math.random() * 60,
            speed: this.gameSpeed,
            type: Math.random() > 0.5 ? 'tree' : 'rock'
        };
        this.roadsideObjects.push(object);
    }

    update() {
        if (!this.gameRunning) return;

        this.frameCount++;
        this.distance += this.gameSpeed * 0.1;
        this.roadOffset = (this.roadOffset + this.gameSpeed) % 80; // Loop road lines

        let isBoosting = this.keys[' '] || this.keys['Spacebar'];
        if (isBoosting) {
            this.boost();
        }

        if (this.keys['ArrowLeft']) { this.moveLeft(); }
        if (this.keys['ArrowRight']) { this.moveRight(); }

        // Update difficulty-based spawning
        this.updateDifficultyBasedSpawning();
        
        this.enemySpawnTimer++;
        const spawnRate = this.enemySpawnRate || (this.isMobile ? 70 : 90);
        if (this.enemySpawnTimer > spawnRate) {
            this.spawnEnemyCar();
            this.enemySpawnTimer = 0;
        }

        this.enemyCars.forEach(car => car.update(this));
        
        // Update bullets
        this.shootCooldown = Math.max(0, this.shootCooldown - 1);
        
        // Update player bullets
        this.playerBullets.forEach(bullet => bullet.y -= bullet.speed);
        this.playerBullets = this.playerBullets.filter(bullet => bullet.y > -20);
        
        // Update enemy bullets
        this.enemyBullets.forEach(bullet => bullet.y += bullet.speed);
        this.enemyBullets = this.enemyBullets.filter(bullet => bullet.y < this.canvas.height + 20);
        
        // Update fuel pickups
        this.fuelPickups.forEach(pickup => pickup.y += pickup.speed);
        this.fuelPickups = this.fuelPickups.filter(pickup => pickup.y < this.canvas.height + 50);
        
        // Spawn fuel pickups periodically
        if (this.distance >= this.nextFuelPickup) {
            this.spawnFuelPickup();
            this.nextFuelPickup += 150 + Math.random() * 100; // Every 150-250 meters
        }

        this.enemyCars = this.enemyCars.filter(car => {
            if (car.y > this.canvas.height + 50) {
                this.carsAvoided++;
                return false;
            }
            return true;
        });

        // GRAPHICS UPGRADE: Update roadside objects
        this.roadsideObjects.forEach(obj => obj.y += this.gameSpeed);
        if (this.roadsideObjects.length > 0 && this.roadsideObjects[0].y > this.canvas.height + 50) {
            this.roadsideObjects.shift();
            this.spawnRoadsideObject();
        }
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            this.playerBullets.push({
                x: this.car.x + this.car.width / 2,
                y: this.car.y,
                width: 3,
                height: 10,
                speed: 12,
                color: '#00FF00'
            });
            this.shootCooldown = 15; // Cooldown between shots
            this.createTone(400, 0.1, 'square', 0.2);
        }
    }

    spawnFuelPickup() {
        const lanes = [240, 380, 520]; // Slightly offset from car lanes
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        
        this.fuelPickups.push({
            x: lane - 15,
            y: -50,
            width: 30,
            height: 40,
            speed: this.gameSpeed,
            fuelAmount: 25 + Math.random() * 25 // 25-50 fuel
        });
    }

    updateDifficultyBasedSpawning() {
        // Every 100 meters, increase enemy spawn rate
        const currentHundreds = Math.floor(this.distance / 100);
        const lastHundreds = Math.floor(this.lastDistanceCheck / 100);
        
        if (currentHundreds > lastHundreds) {
            // Reduce spawn timer (more frequent spawning)
            const baseSpawnRate = this.isMobile ? 70 : 90;
            const reduction = Math.min(currentHundreds * 8, 50); // Max 50 frame reduction
            this.enemySpawnRate = Math.max(baseSpawnRate - reduction, 20); // Minimum 20 frames
            
            console.log(`Distance: ${Math.floor(this.distance)}m - Spawn rate: ${this.enemySpawnRate}`);
        }
        
        this.lastDistanceCheck = this.distance;

        this.updateParticles();
        this.updateScreenShake();
        this.checkCollisions();
        this.checkBulletCollisions();
        this.checkFuelPickups();

        this.fuel = Math.max(0, this.fuel - this.fuelConsumptionRate);

        if (this.fuel <= 0 && this.gameRunning) {
            this.gameOver("Out of Fuel!");
        }
        
        // Check for level completion
        if (this.distance >= this.winCondition && !this.levelComplete) {
            this.levelComplete = true;
            this.gameWin();
        }

        this.updateUI();
    }

    checkCollisions() {
        for (let i = this.enemyCars.length - 1; i >= 0; i--) {
            const enemyCar = this.enemyCars[i];
            if (this.car.x < enemyCar.x + enemyCar.width &&
                this.car.x + this.car.width > enemyCar.x &&
                this.car.y < enemyCar.y + enemyCar.height &&
                this.car.y + this.car.height > enemyCar.y) {

                this.takeDamage();
                this.enemyCars.splice(i, 1);
                this.createCrashEffect(enemyCar.x + enemyCar.width / 2, enemyCar.y + enemyCar.height / 2);
            }
        }
    }

    createCrashEffect(x, y) {
        this.addScreenShake(5, 300);
        for (let i = 0; i < 30; i++) {
            const type = Math.random() > 0.3 ? 'spark' : 'smoke';
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30 + Math.random() * 20,
                color: type === 'spark' ? '#FFD700' : '#888',
                type: type
            });
        }
    }

    takeDamage() {
        if (!this.gameRunning) return;
        this.lives--;
        this.createTone(150, 0.6, 'sawtooth', 0.4);

        if (this.lives <= 0) {
            this.gameOver("Wrecked!");
        }
        this.updateHeartsDisplay();
    }

    updateHeartsDisplay() {
        const heartsEl = document.getElementById('hearts');
        if (heartsEl) {
            heartsEl.innerHTML = '';
            for (let i = 0; i < this.maxLives; i++) {
                const heart = document.createElement('span');
                heart.className = 'heart';
                heart.textContent = '❤️';
                if (i >= this.lives) {
                    heart.classList.add('lost');
                }
                heartsEl.appendChild(heart);
            }
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('score');
        const energyEl = document.getElementById('energy');

        if (scoreEl) scoreEl.textContent = `Distance: ${Math.floor(this.distance)}m / ${this.winCondition}m | Destroyed: ${this.carsAvoided}`;
        if (energyEl) {
            const fuelColor = this.fuel < 25 ? '#FF0000' : this.fuel < 50 ? '#FFA500' : '#00FF00';
            energyEl.innerHTML = `<span style="color: ${fuelColor}">Fuel: ${Math.floor(this.fuel)}%</span>`;
        }

        this.updateHeartsDisplay();
    }

    gameOver(reason = "Game Over") {
        if (!this.gameRunning) return;
        this.gameRunning = false;

        const gameOverEl = document.getElementById('gameOver');
        const finalScoreEl = document.getElementById('finalScore');
        const h2El = gameOverEl.querySelector('h2');

        if (h2El) h2El.textContent = reason;
        if (gameOverEl) gameOverEl.style.display = 'block';
        if (finalScoreEl) finalScoreEl.textContent = `${Math.floor(this.distance)}m`;

        this.createTone(200, 0.8, 'triangle', 0.3);
    }

    gameWin() {
        if (!this.gameRunning) return;
        this.gameRunning = false;

        // Save progress
        localStorage.setItem('noobCentralLives', this.lives.toString());
        localStorage.setItem('noobCentralEnergy', Math.floor(this.fuel).toString());
        localStorage.setItem('noobCentralCharacter', this.selectedCharacter);

        const gameOverEl = document.getElementById('gameOver');
        const finalScoreEl = document.getElementById('finalScore');
        const h2El = gameOverEl.querySelector('h2');
        const buttonEl = gameOverEl.querySelector('button');

        if (h2El) h2El.textContent = 'Level Complete!';
        if (gameOverEl) gameOverEl.style.display = 'block';
        if (finalScoreEl) finalScoreEl.textContent = `${Math.floor(this.distance)}m`;
        if (buttonEl) {
            buttonEl.textContent = 'Continue to Next Level';
            buttonEl.onclick = () => {
                // For now, just go back to main menu or reload
                window.location.href = 'index.html';
            };
        }

        this.createTone(440, 0.5, 'sine', 0.3);
        this.createTone(554, 0.5, 'sine', 0.3);
        this.createTone(659, 0.8, 'sine', 0.3);
    }

    checkBulletCollisions() {
        // Player bullets hitting enemies
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            for (let j = this.enemyCars.length - 1; j >= 0; j--) {
                const enemy = this.enemyCars[j];
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    this.playerBullets.splice(i, 1);
                    enemy.health--;
                    
                    // Create hit effect
                    for (let k = 0; k < 10; k++) {
                        this.particles.push({
                            x: bullet.x,
                            y: bullet.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 15 + Math.random() * 10,
                            color: '#FFD700',
                            type: 'spark'
                        });
                    }
                    
                    if (enemy.health <= 0) {
                        this.enemyCars.splice(j, 1);
                        this.carsAvoided++;
                        this.createTone(250, 0.2, 'square', 0.2);
                    }
                    break;
                }
            }
        }
        
        // Enemy bullets hitting player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            if (bullet.x < this.car.x + this.car.width &&
                bullet.x + bullet.width > this.car.x &&
                bullet.y < this.car.y + this.car.height &&
                bullet.y + bullet.height > this.car.y) {
                
                this.enemyBullets.splice(i, 1);
                this.takeDamage();
                break;
            }
        }
    }

    checkFuelPickups() {
        for (let i = this.fuelPickups.length - 1; i >= 0; i--) {
            const pickup = this.fuelPickups[i];
            if (pickup.x < this.car.x + this.car.width &&
                pickup.x + pickup.width > this.car.x &&
                pickup.y < this.car.y + this.car.height &&
                pickup.y + pickup.height > this.car.y) {
                
                this.fuel = Math.min(this.maxFuel, this.fuel + pickup.fuelAmount);
                this.fuelPickups.splice(i, 1);
                
                // Create pickup effect
                for (let j = 0; j < 15; j++) {
                    this.particles.push({
                        x: pickup.x + pickup.width / 2,
                        y: pickup.y + pickup.height / 2,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        life: 20 + Math.random() * 10,
                        color: '#00FF00',
                        type: 'spark'
                    });
                }
                
                this.createTone(350, 0.3, 'sine', 0.2);
                break;
            }
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }

    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration--;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        // Background
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // GRAPHICS UPGRADE: Dynamic grass and roadside objects
        this.ctx.fillStyle = '#005500';
        this.ctx.fillRect(0, 0, 200, this.canvas.height);
        this.ctx.fillStyle = '#004400';
        this.ctx.fillRect(600, 0, 200, this.canvas.height);

        this.roadsideObjects.forEach(obj => {
            if (obj.type === 'tree') {
                this.ctx.fillStyle = '#5C4033'; // Trunk
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                this.ctx.fillStyle = '#228B22'; // Leaves
                this.ctx.beginPath();
                this.ctx.arc(obj.x + obj.width / 2, obj.y, obj.width * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else { // Rock
                this.ctx.fillStyle = '#888';
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 10);
            }
        });

        // GRAPHICS UPGRADE: Road with texture/gradient
        const roadGradient = this.ctx.createLinearGradient(200, 0, 600, 0);
        roadGradient.addColorStop(0, '#444');
        roadGradient.addColorStop(0.5, '#555');
        roadGradient.addColorStop(1, '#444');
        this.ctx.fillStyle = roadGradient;
        this.ctx.fillRect(200, 0, 400, this.canvas.height);

        // Road lines
        this.ctx.fillStyle = '#FFFF00';
        for (let i = -80; i < this.canvas.height; i += 80) {
            const y = (i + this.roadOffset) % (this.canvas.height + 80);
            this.ctx.fillRect(345, y, 10, 50);
            this.ctx.fillRect(445, y, 10, 50);
        }

        // Road edges / curbs
        this.ctx.fillStyle = '#DDDDDD';
        this.ctx.fillRect(200, 0, 10, this.canvas.height);
        this.ctx.fillRect(590, 0, 10, this.canvas.height);
        this.ctx.fillStyle = '#999999';
        this.ctx.fillRect(205, 0, 5, this.canvas.height);
        this.ctx.fillRect(590, 0, 5, this.canvas.height);

        this.enemyCars.forEach(car => car.draw(this.ctx, this.frameCount));
        
        // Draw bullets
        this.playerBullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw fuel pickups
        this.fuelPickups.forEach(pickup => {
            // Fuel can design
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(pickup.x, pickup.y, pickup.width, pickup.height);
            this.ctx.fillStyle = '#FFA500';
            this.ctx.fillRect(pickup.x + 3, pickup.y + 3, pickup.width - 6, pickup.height - 6);
            this.ctx.fillStyle = '#FF4500';
            this.ctx.fillRect(pickup.x + 6, pickup.y + 6, pickup.width - 12, pickup.height - 12);
            
            // Fuel symbol
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('F', pickup.x + pickup.width / 2, pickup.y + pickup.height / 2 + 5);
            this.ctx.textAlign = 'left';
        });

        this.drawPlayerCar();

        this.drawParticles();

        this.ctx.restore();
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            if (p.type === 'spark') {
                this.ctx.fillRect(p.x, p.y, 4, 4);
            } else if (p.type === 'flame') {
                this.ctx.globalAlpha = p.life / 30;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.life / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            } else { // smoke
                this.ctx.globalAlpha = p.life / 50;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            }
        });
    }

    // GRAPHICS UPGRADE: Highly detailed player car drawing function
    drawPlayerCar() {
        const car = this.car;

        // Define car style based on selected character
        let style = {
            bodyColor: '#FF4500', // Default: orange
            roofColor: '#DC143C',
            carType: 'sedan'
        };

        switch(this.selectedCharacter) {
            case 'jay': // Muscular blue muscle car
                style = { bodyColor: '#1E90FF', roofColor: '#00008B', carType: 'muscle' };
                break;
            case 'kim': // Sleek pink sports car
                style = { bodyColor: '#FF69B4', roofColor: '#FF1493', carType: 'sports' };
                break;
            case 'julian': // Rugged green off-roader
                style = { bodyColor: '#228B22', roofColor: '#556B2F', carType: 'offroad' };
                break;
            case 'juan': // Classic black retro car
                style = { bodyColor: '#222222', roofColor: '#000000', carType: 'classic' };
                break;
        }

        // Car Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(car.x + car.width / 2, car.y + car.height + 5, car.width / 2, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Car Body
        const bodyGradient = this.ctx.createLinearGradient(car.x, car.y, car.x + car.width, car.y);
        bodyGradient.addColorStop(0, '#fff');
        bodyGradient.addColorStop(0.1, style.bodyColor);
        bodyGradient.addColorStop(0.9, style.bodyColor);
        bodyGradient.addColorStop(1, '#000');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(car.x, car.y, car.width, car.height);

        // Roof and Windows
        this.ctx.fillStyle = style.roofColor;
        this.ctx.fillRect(car.x + 5, car.y + 15, car.width - 10, 40);

        const glassGradient = this.ctx.createLinearGradient(0, car.y, 0, car.y + 50);
        glassGradient.addColorStop(0, '#aaccff');
        glassGradient.addColorStop(1, '#4466aa');
        this.ctx.fillStyle = glassGradient;
        this.ctx.fillRect(car.x + 10, car.y + 20, car.width - 20, 30);
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)'; // Reflection
        this.ctx.fillRect(car.x + 15, car.y + 25, 10, 15);

        // Character specific details
        if (style.carType === 'muscle') { // Jay
            this.ctx.fillStyle = '#444'; // Hood scoop
            this.ctx.fillRect(car.x + car.width/2 - 10, car.y, 20, 15);
        } else if (style.carType === 'offroad') { // Julian
            this.ctx.fillStyle = '#444'; // Roof rack
            this.ctx.fillRect(car.x, car.y + 10, car.width, 5);
        } else if (style.carType === 'sports') { // Kim
            this.ctx.fillStyle = '#444'; // Spoiler
            this.ctx.fillRect(car.x, car.y + car.height, car.width, 10);
        }

        // Headlights
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(car.x, car.y + 5, 10, 15);
        this.ctx.fillRect(car.x + car.width - 10, car.y + 5, 10, 15);

        // Brake Lights
        this.ctx.fillStyle = (this.keys['ArrowDown'] || this.keys['s']) ? '#FF0000' : '#8B0000';
        this.ctx.fillRect(car.x, car.y + car.height - 15, 10, 10);
        this.ctx.fillRect(car.x + car.width - 10, car.y + car.height - 15, 10, 10);

        // Wheels
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(car.x - 10, car.y + 15, 15, 25);
        this.ctx.fillRect(car.x - 10, car.y + car.height - 45, 15, 25);
        this.ctx.fillRect(car.x + car.width - 5, car.y + 15, 15, 25);
        this.ctx.fillRect(car.x + car.width - 5, car.y + car.height - 45, 15, 25);
        // Hubcaps
        this.ctx.fillStyle = '#AAA';
        this.ctx.beginPath();
        this.ctx.arc(car.x - 2.5, car.y + 27.5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(car.x + car.width - 2.5, car.y + 27.5, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    gameLoop() {
        if (!this.gameRunning && this.particles.length === 0) {
            // Freeze game completely on game over after particles are gone
            return;
        }
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    console.log('Level 2 page loaded, starting game...');
    new Level2Game();
});
