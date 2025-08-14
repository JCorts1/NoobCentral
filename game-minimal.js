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
        
        // Current selected character
        this.selectedCharacter = 'juan';
        
        // Create character with jumping
        this.player = this.createPlayer();
        
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
    
    createPlayer() {
        return {
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
            character: this.selectedCharacter,
            
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
                const legOffset = Math.floor(this.animFrame / 8) % 2 === 0 ? 3 : -3;
                
                if (this.character === 'juan') {
                    this.drawJuan(ctx, legOffset);
                } else if (this.character === 'kim') {
                    this.drawKim(ctx, legOffset);
                } else if (this.character === 'julian') {
                    this.drawJulian(ctx, legOffset);
                } else if (this.character === 'jay') {
                    this.drawJay(ctx, legOffset);
                }
            },
            
            drawJuan: function(ctx, legOffset) {
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
            },
            
            drawKim: function(ctx, legOffset) {
                // Head
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 20, this.y + 10, 20, 20);
                
                // Long hair for Kim
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 12, this.y + 5, 36, 25);
                ctx.fillRect(this.x + 8, this.y + 20, 44, 15);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 23, this.y + 17, 3, 3);
                ctx.fillRect(this.x + 34, this.y + 17, 3, 3);
                
                // Body (dress)
                ctx.fillStyle = '#FF1493';
                ctx.fillRect(this.x + 15, this.y + 30, 30, 35);
                
                // Arms
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 5, this.y + 35, 12, 20);
                ctx.fillRect(this.x + 43, this.y + 35, 12, 20);
                
                // Jewelry (bracelets)
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x + 6, this.y + 48, 10, 3);
                ctx.fillRect(this.x + 44, this.y + 48, 10, 3);
                
                // Legs (with running animation)
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 18 + legOffset, this.y + 65, 8, 20);
                ctx.fillRect(this.x + 34 - legOffset, this.y + 65, 8, 20);
                
                // Shoes
                ctx.fillStyle = '#800080';
                ctx.fillRect(this.x + 16 + legOffset, this.y + 80, 12, 5);
                ctx.fillRect(this.x + 32 - legOffset, this.y + 80, 12, 5);
            },
            
            drawJulian: function(ctx, legOffset) {
                // Head
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 20, this.y + 10, 20, 20);
                
                // Short hair for Julian
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 18, this.y + 8, 24, 15);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 23, this.y + 17, 3, 3);
                ctx.fillRect(this.x + 34, this.y + 17, 3, 3);
                
                // Body (green shirt)
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x + 15, this.y + 30, 30, 35);
                
                // Arms
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 5, this.y + 35, 12, 20);
                ctx.fillRect(this.x + 43, this.y + 35, 12, 20);
                
                // Pants
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 15, this.y + 65, 30, 20);
                
                // Legs (with running animation)
                ctx.fillRect(this.x + 18 + legOffset, this.y + 65, 8, 20);
                ctx.fillRect(this.x + 34 - legOffset, this.y + 65, 8, 20);
                
                // Plant accessory (small potted plant)
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 10, this.y + 50, 8, 6);
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x - 8, this.y + 45, 4, 8);
                ctx.fillRect(this.x - 6, this.y + 47, 4, 6);
            },
            
            drawJay: function(ctx, legOffset) {
                // Head
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 20, this.y + 10, 20, 20);
                
                // Short hair for Jay
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 18, this.y + 8, 24, 12);
                
                // Glasses
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 21, this.y + 15, 8, 6);
                ctx.fillRect(this.x + 31, this.y + 15, 8, 6);
                ctx.fillRect(this.x + 29, this.y + 17, 2, 2);
                
                // Eyes behind glasses
                ctx.fillStyle = '#FFF';
                ctx.fillRect(this.x + 23, this.y + 17, 4, 3);
                ctx.fillRect(this.x + 33, this.y + 17, 4, 3);
                
                // Body (muscular - wider)
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(this.x + 12, this.y + 30, 36, 35);
                
                // Muscular arms
                ctx.fillStyle = '#FFDBAC';
                ctx.fillRect(this.x + 2, this.y + 35, 15, 20);
                ctx.fillRect(this.x + 43, this.y + 35, 15, 20);
                
                // Pants
                ctx.fillStyle = '#000080';
                ctx.fillRect(this.x + 15, this.y + 65, 30, 20);
                
                // Legs (with running animation)
                ctx.fillRect(this.x + 18 + legOffset, this.y + 65, 8, 20);
                ctx.fillRect(this.x + 34 - legOffset, this.y + 65, 8, 20);
                
                // Laptop accessory
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(this.x - 12, this.y + 45, 15, 10);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x - 10, this.y + 47, 11, 6);
            }
        };
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
        
        // Character selection
        const characterBtns = document.querySelectorAll('.character-btn');
        characterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectCharacter(btn.dataset.character);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectCharacter(btn.dataset.character);
            });
        });
    }
    
    selectCharacter(character) {
        this.selectedCharacter = character;
        this.player.character = character;
        
        // Update UI
        document.getElementById('characterName').textContent = `Character: ${this.getCharacterDisplayName(character)}`;
        
        // Update button styles
        document.querySelectorAll('.character-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-character="${character}"]`).classList.add('active');
        
        // Show Juan's video if selected
        if (character === 'juan') {
            this.showJuanVideo();
        } else {
            this.hideVideo();
        }
    }
    
    getCharacterDisplayName(character) {
        const names = {
            'juan': 'Juan',
            'kim': 'Kim', 
            'julian': 'Julian-ElPez',
            'jay': 'Jay'
        };
        return names[character] || character;
    }
    
    showJuanVideo() {
        // Remove existing video if any
        this.hideVideo();
        
        // Create video element
        const video = document.createElement('video');
        video.id = 'juanVideo';
        video.src = '/Users/jaycortes/Downloads/Pixelated_Rocker_Juan_With_Guitar.mp4';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            z-index: 100;
            border: 3px solid #00ff00;
            border-radius: 10px;
            background: rgba(0,0,0,0.8);
        `;
        
        document.body.appendChild(video);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideVideo();
        }, 3000);
    }
    
    hideVideo() {
        const existingVideo = document.getElementById('juanVideo');
        if (existingVideo) {
            existingVideo.remove();
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
        document.getElementById('characterName').textContent = `Character: ${this.getCharacterDisplayName(this.selectedCharacter)}`;
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