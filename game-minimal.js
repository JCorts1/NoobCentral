console.log('Game script loading...');

class Game {
    constructor() {
        console.log('Game constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Basic setup
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.distance = 0;
        this.gameSpeed = 2;
        this.gameRunning = true;
        
        // Create character with jumping
        this.player = {
            x: 100,
            y: this.canvas.height - 150,
            width: 60,
            height: 80,
            jumpVelocity: 0,
            onGround: true,
            gravity: 0.8,
            jumpPower: -15,
            groundY: this.canvas.height - 150,
            animFrame: 0,
            
            update: function() {
                this.animFrame++;
                
                // Jumping physics
                if (!this.onGround) {
                    this.jumpVelocity += this.gravity;
                    this.y += this.jumpVelocity;
                    
                    if (this.y >= this.groundY) {
                        this.y = this.groundY;
                        this.jumpVelocity = 0;
                        this.onGround = true;
                    }
                }
            },
            
            jump: function() {
                if (this.onGround) {
                    this.jumpVelocity = this.jumpPower;
                    this.onGround = false;
                }
            },
            
            draw: function(ctx) {
                console.log('Drawing player at:', this.x, this.y);
                
                // Draw pixelated human character (Juan)
                // Head
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 20, this.y + 10, 20, 20);
                
                // Long hair for Juan
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 10, this.y + 5, 40, 20);
                ctx.fillRect(this.x + 5, this.y + 15, 50, 15);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 23, this.y + 17, 3, 3);
                ctx.fillRect(this.x + 34, this.y + 17, 3, 3);
                
                // Body
                ctx.fillStyle = '#FF6B35';
                ctx.fillRect(this.x + 15, this.y + 30, 30, 35);
                
                // Arms
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 5, this.y + 35, 12, 20);
                ctx.fillRect(this.x + 43, this.y + 35, 12, 20);
                
                // Pants
                ctx.fillStyle = '#0066CC';
                ctx.fillRect(this.x + 15, this.y + 65, 30, 20);
                
                // Legs (with running animation)
                const legOffset = Math.floor(this.animFrame / 8) % 2 === 0 ? 3 : -3;
                ctx.fillRect(this.x + 18 + legOffset, this.y + 65, 8, 20);
                ctx.fillRect(this.x + 34 - legOffset, this.y + 65, 8, 20);
                
                // Guitar (Juan's accessory)
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 8, this.y + 45, 20, 8);
                ctx.fillRect(this.x - 12, this.y + 40, 12, 18);
                
                // Guitar strings
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x - 10, this.y + 42, 1, 14);
                ctx.fillRect(this.x - 7, this.y + 42, 1, 14);
                ctx.fillRect(this.x - 4, this.y + 42, 1, 14);
            }
        };
        
        // Simple buildings
        this.buildings = [];
        for (let i = 0; i < 10; i++) {
            this.buildings.push({
                x: i * 100,
                y: this.canvas.height - 200 - Math.random() * 200,
                width: 80,
                height: 200 + Math.random() * 200,
                update: function(speed) {
                    this.x -= speed;
                },
                draw: function(ctx) {
                    ctx.fillStyle = '#666';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            });
        }
        
        // Add enemies
        this.enemies = [];
        this.spawnTimer = 0;
        
        // Setup controls
        this.setupControls();
        
        console.log('Starting game loop...');
        this.gameLoop();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.player.jump();
            }
        });
        
        // Mobile jump button
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.player.jump();
            });
            
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.jump();
            });
        }
    }
    
    spawnEnemy() {
        const enemy = {
            x: this.canvas.width + 50,
            y: this.canvas.height - 100,
            width: 40,
            height: 40,
            
            update: function(speed) {
                this.x -= speed * 1.5; // Enemies move faster than buildings
            },
            
            draw: function(ctx) {
                // Draw pixelated monster
                ctx.fillStyle = '#8B0000'; // Dark red
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Monster eyes
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
                ctx.fillRect(this.x + 26, this.y + 8, 6, 6);
                
                // Monster teeth
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 5, this.y + 25, 4, 8);
                ctx.fillRect(this.x + 15, this.y + 25, 4, 8);
                ctx.fillRect(this.x + 25, this.y + 25, 4, 8);
                ctx.fillRect(this.x + 31, this.y + 25, 4, 8);
            }
        };
        
        this.enemies.push(enemy);
    }
    
    checkCollisions() {
        this.enemies.forEach(enemy => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                
                // Collision detected - game over
                this.gameOver();
            }
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = Math.floor(this.distance);
        document.getElementById('gameOver').style.display = 'block';
    }
    
    update() {
        console.log('Game updating, distance:', this.distance);
        
        this.distance += this.gameSpeed * 0.1;
        
        // Update buildings
        this.buildings.forEach(building => {
            building.update(this.gameSpeed);
        });
        
        // Reset buildings that go off screen
        this.buildings.forEach(building => {
            if (building.x < -100) {
                building.x = this.canvas.width + Math.random() * 200;
            }
        });
        
        this.player.update();
        
        // Spawn enemies
        this.spawnTimer++;
        if (this.spawnTimer > 120) { // Spawn every 2 seconds at 60fps
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.gameSpeed);
        });
        
        // Remove off-screen enemies
        this.enemies = this.enemies.filter(enemy => enemy.x > -100);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        document.getElementById('score').textContent = `Distance: ${Math.floor(this.distance)}m`;
        document.getElementById('energy').textContent = `Energy: 100%`;
        document.getElementById('characterName').textContent = `Character: Juan`;
    }
    
    draw() {
        // Clear screen with night sky
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw buildings
        this.buildings.forEach(building => building.draw(this.ctx));
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw player
        console.log('About to draw player...');
        this.player.draw(this.ctx);
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    console.log('Window loaded, creating game...');
    try {
        new Game();
        console.log('Game created successfully');
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Error creating game: ' + error.message);
    }
});