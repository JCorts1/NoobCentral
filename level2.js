console.log('Level 2 script loading... VERTICAL RACING MODE');

class Level2Game {
    constructor() {
        console.log('Level 2 Game constructor called - Vertical Car Racing');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Basic setup - vertical scrolling racing game
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.distance = 0;
        this.gameSpeed = 4; // Vertical scroll speed
        this.gameRunning = true;
        
        // Load saved progress from level 1
        this.loadProgress();
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        if (this.isMobile) {
            this.gameSpeed = 6; // Faster on mobile
        }
        
        // Level 2 specific mechanics - VERTICAL RACING
        this.gameMode = 'racing'; // Vertical car racing
        this.fuel = 100;
        this.maxFuel = 100;
        this.roadOffset = 0; // For scrolling road effect
        
        // Player car - positioned at bottom center
        this.car = {
            x: this.canvas.width / 2 - 30, // Center horizontally
            y: this.canvas.height - 120,   // Near bottom
            width: 60,
            height: 100,
            speed: 6, // Left/right movement speed
            maxX: this.canvas.width - 200, // Road boundaries
            minX: 200
        };
        
        // Enemy cars coming from above
        this.enemyCars = [];
        this.enemySpawnTimer = 0;
        this.carsAvoided = 0;
        
        // Visual effects (simplified for performance)
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        // Audio system
        this.audioContext = null;
        this.initAudio();
        
        // Setup controls
        this.setupControls();
        
        // Initialize UI
        this.updateUI();
        
        console.log('Level 2 initialized - Driving mode activated!');
        this.gameLoop();
    }
    
    loadProgress() {
        // Load saved data from level 1
        const savedLives = localStorage.getItem('noobCentralLives');
        const savedEnergy = localStorage.getItem('noobCentralEnergy');
        const savedCharacter = localStorage.getItem('noobCentralCharacter');
        
        this.lives = savedLives ? parseInt(savedLives) : 5;
        this.energy = savedEnergy ? parseInt(savedEnergy) : 0;
        this.selectedCharacter = savedCharacter || 'juan';
        this.maxLives = 5;
        this.maxEnergy = 100;
        
        console.log(`Level 2 loaded with: ${this.lives} lives, ${this.energy}% energy, character: ${this.selectedCharacter}`);
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
        // Keyboard controls for left/right movement
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.moveLeft();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.moveRight();
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.boost();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mobile controls - redefine buttons for racing
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.innerHTML = '⬅️'; // Left arrow
            jumpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.moveLeft();
            });
        }
        
        const attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.innerHTML = '➡️'; // Right arrow
            attackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.moveRight();
            });
        }
        
        const specialBtn = document.getElementById('specialBtn');
        if (specialBtn) {
            specialBtn.innerHTML = '🚀'; // Boost
            specialBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.boost();
            });
        }
    }
    
    moveLeft() {
        if (this.car.x > this.car.minX) {
            this.car.x -= this.car.speed;
            this.createTone(300, 0.1, 'sine', 0.1);
        }
    }
    
    moveRight() {
        if (this.car.x < this.car.maxX) {
            this.car.x += this.car.speed;
            this.createTone(350, 0.1, 'sine', 0.1);
        }
    }
    
    boost() {
        if (this.fuel > 10) {
            this.gameSpeed = Math.min(8, this.gameSpeed + 1);
            this.fuel -= 10;
            this.createTone(500, 0.3, 'sawtooth', 0.2);
            
            // Reset speed after boost
            setTimeout(() => {
                this.gameSpeed = this.isMobile ? 6 : 4;
            }, 2000);
        }
    }
    
    carJump() {
        if (this.car.onGround) {
            this.car.velocityY = this.car.jumpPower;
            this.car.onGround = false;
            this.createTone(400, 0.2, 'sine', 0.3);
        }
    }
    
    accelerate() {
        if (this.fuel > 0) {
            this.carSpeed = Math.min(this.maxCarSpeed, this.carSpeed + 0.5);
            this.fuel = Math.max(0, this.fuel - 0.2);
            this.createTone(200, 0.1, 'sawtooth', 0.2);
        }
    }
    
    brake() {
        this.carSpeed = Math.max(0, this.carSpeed - 0.8);
        this.createTone(150, 0.1, 'square', 0.15);
    }
    
    spawnEnemyCar() {
        // Random lane position (left, center, right)
        const lanes = [250, 350, 450];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        const enemyCar = {
            x: randomLane,
            y: -100, // Start above screen
            width: 50,
            height: 80,
            speed: this.gameSpeed + Math.random() * 2, // Slightly variable speed
            type: Math.random() > 0.5 ? 'police' : 'enemy',
            
            update: function() {
                this.y += this.speed; // Move down the screen
            },
            
            draw: function(ctx) {
                if (this.type === 'police') {
                    // Police car - blue with white stripes
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Police stripes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 5, this.y + 20, this.width - 10, 8);
                    ctx.fillRect(this.x + 5, this.y + 40, this.width - 10, 8);
                    
                    // Police lights
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(this.x + 10, this.y + 5, 8, 6);
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(this.x + 32, this.y + 5, 8, 6);
                } else {
                    // Enemy car - red/orange
                    ctx.fillStyle = '#FF4500';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Car details
                    ctx.fillStyle = '#DC143C';
                    ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, 15);
                    
                    // Windows
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(this.x + 8, this.y + 15, this.width - 16, 10);
                }
                
                // Wheels for both types
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + this.height - 5, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x + this.width - 10, this.y + this.height - 5, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        this.enemyCars.push(enemyCar);
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Update distance based on speed (vertical movement)
        this.distance += this.gameSpeed * 0.3;
        this.roadOffset += this.gameSpeed; // Road scrolling effect
        
        // Continuous left/right movement if keys held
        if (this.keys && this.keys['ArrowLeft']) {
            this.moveLeft();
        }
        if (this.keys && this.keys['ArrowRight']) {
            this.moveRight();
        }
        
        // Spawn enemy cars from above
        this.enemySpawnTimer++;
        const spawnRate = this.isMobile ? 80 : 100; // Faster spawning on mobile
        if (this.enemySpawnTimer > spawnRate) {
            this.spawnEnemyCar();
            this.enemySpawnTimer = 0;
        }
        
        // Update enemy cars (move down)
        this.enemyCars.forEach(car => car.update());
        
        // Remove cars that went off screen and count them as avoided
        const initialCount = this.enemyCars.length;
        this.enemyCars = this.enemyCars.filter(car => {
            if (car.y >= this.canvas.height + 50) {
                this.carsAvoided++;
                return false;
            }
            return true;
        });
        
        // Check collisions with enemy cars
        this.checkCollisions();
        
        // Gradual fuel consumption
        this.fuel = Math.max(0, this.fuel - 0.02);
        
        // Game over if out of fuel
        if (this.fuel <= 0) {
            this.gameOver();
        }
        
        // Update UI
        this.updateUI();
    }
    
    checkCollisions() {
        this.enemyCars.forEach((enemyCar, index) => {
            if (this.car.x < enemyCar.x + enemyCar.width &&
                this.car.x + this.car.width > enemyCar.x &&
                this.car.y < enemyCar.y + enemyCar.height &&
                this.car.y + this.car.height > enemyCar.y) {
                
                // Hit enemy car
                this.takeDamage();
                this.enemyCars.splice(index, 1);
                
                // Add crash particles
                this.createCrashEffect(enemyCar.x + enemyCar.width/2, enemyCar.y + enemyCar.height/2);
            }
        });
    }
    
    createCrashEffect(x, y) {
        // Simple crash particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: '#FF6600'
            });
        }
    }
    
    takeDamage() {
        this.lives--;
        this.createTone(200, 0.5, 'triangle', 0.4);
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.updateHeartsDisplay();
        }
    }
    
    updateHeartsDisplay() {
        const heartsEl = document.getElementById('hearts');
        if (heartsEl) {
            heartsEl.innerHTML = '';
            for (let i = 0; i < this.maxLives; i++) {
                const heart = document.createElement('span');
                heart.className = i < this.lives ? 'heart' : 'heart lost';
                heart.textContent = '❤️';
                heartsEl.appendChild(heart);
            }
        }
    }
    
    updateUI() {
        try {
            const scoreEl = document.getElementById('score');
            const energyEl = document.getElementById('energy');
            
            if (scoreEl) {
                scoreEl.textContent = `Distance: ${Math.floor(this.distance)}m | Cars Avoided: ${this.carsAvoided || 0}`;
            }
            
            if (energyEl) {
                energyEl.textContent = `Fuel: ${Math.floor(this.fuel)}%`;
            }
            
            this.updateHeartsDisplay();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        const gameOverEl = document.getElementById('gameOver');
        const finalScoreEl = document.getElementById('finalScore');
        
        if (gameOverEl) gameOverEl.style.display = 'block';
        if (finalScoreEl) finalScoreEl.textContent = Math.floor(this.distance);
        
        this.createTone(200, 0.8, 'triangle', 0.3);
    }
    
    draw() {
        // Clear screen with darker background
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grass/background on sides
        this.ctx.fillStyle = '#006600';
        this.ctx.fillRect(0, 0, 200, this.canvas.height); // Left side
        this.ctx.fillRect(600, 0, 200, this.canvas.height); // Right side
        
        // Draw main road (vertical)
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(200, 0, 400, this.canvas.height);
        
        // Draw road lane dividers (vertical scrolling)
        this.ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < this.canvas.height + 100; i += 40) {
            const y = (i + this.roadOffset) % (this.canvas.height + 100);
            // Center lane divider
            this.ctx.fillRect(395, y, 10, 20);
            // Left lane divider  
            this.ctx.fillRect(295, y, 8, 15);
            // Right lane divider
            this.ctx.fillRect(495, y, 8, 15);
        }
        
        // Draw road edges
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(200, 0, 5, this.canvas.height); // Left edge
        this.ctx.fillRect(595, 0, 5, this.canvas.height); // Right edge
        
        // Draw enemy cars
        this.enemyCars.forEach(car => car.draw(this.ctx));
        
        // Draw player car
        this.drawPlayerCar();
        
        // Draw particles (crash effects)
        this.drawParticles();
        
        // Level 2 indicator
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('RACING MODE', this.canvas.width - 20, 30);
    }
    
    drawParticles() {
        this.particles.forEach((particle, index) => {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    drawPlayerCar() {
        const car = this.car;
        
        // Player car body (vertical orientation)
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(car.x, car.y, car.width, car.height);
        
        // Car hood (top part)
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(car.x + 5, car.y, car.width - 10, 25);
        
        // Windshield
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(car.x + 8, car.y + 20, car.width - 16, 15);
        
        // Car body details
        this.ctx.fillStyle = '#B22222';
        this.ctx.fillRect(car.x + 3, car.y + 40, car.width - 6, 40);
        
        // Back windshield
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(car.x + 8, car.y + 75, car.width - 16, 12);
        
        // Wheels (positioned for vertical car)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(car.x + 10, car.y + 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(car.x + car.width - 10, car.y + 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(car.x + 10, car.y + car.height - 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(car.x + car.width - 10, car.y + car.height - 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Headlights (at front of car)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(car.x + 8, car.y + 2, 12, 6);
        this.ctx.fillRect(car.x + car.width - 20, car.y + 2, 12, 6);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start Level 2 when page loads
window.addEventListener('load', () => {
    console.log('Level 2 page loaded, starting game...');
    new Level2Game();
});