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
        
        // City elements including welcome sign
        this.buildings = [];
        this.cityElements = [];
        
        // Add Welcome to Medellin sign at the beginning
        this.cityElements.push({
            x: 200,
            y: this.canvas.height - 250,
            width: 160,
            height: 100,
            type: 'welcome_sign',
            update: function(speed) {
                this.x -= speed;
            },
            draw: function(ctx) {
                // Sign post
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 75, this.y + 70, 10, 80);
                
                // Sign board
                ctx.fillStyle = '#2F4F2F';
                ctx.fillRect(this.x, this.y, this.width, 70);
                
                // Colombian flag
                ctx.fillStyle = '#FFFF00'; // Yellow
                ctx.fillRect(this.x + 10, this.y + 5, 140, 20);
                ctx.fillStyle = '#0033A0'; // Blue
                ctx.fillRect(this.x + 10, this.y + 25, 140, 20);
                ctx.fillStyle = '#CE1126'; // Red
                ctx.fillRect(this.x + 10, this.y + 45, 140, 20);
                
                // Text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.fillText('WELCOME TO', this.x + 50, this.y + 17);
                ctx.fillText('MEDELLIN', this.x + 55, this.y + 37);
                ctx.fillText('COLOMBIA', this.x + 55, this.y + 57);
            }
        });
        
        // Create background buildings (far layer)
        this.backgroundBuildings = [];
        for (let i = 0; i < 20; i++) {
            this.backgroundBuildings.push({
                x: 400 + i * 150,
                y: this.canvas.height - 200 - Math.random() * 100,
                width: 120,
                height: 200 + Math.random() * 100,
                speed: 0.3,
                update: function(speed) {
                    this.x -= speed * this.speed;
                },
                draw: function(ctx) {
                    ctx.fillStyle = '#2A2A2A';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Distant windows
                    ctx.fillStyle = '#444444';
                    for (let row = 0; row < 8; row++) {
                        for (let col = 0; col < 4; col++) {
                            if (Math.random() > 0.6) {
                                ctx.fillRect(this.x + 10 + col * 25, this.y + 10 + row * 20, 15, 12);
                            }
                        }
                    }
                }
            });
        }
        
        // Create main detailed buildings (much larger and more detailed)
        for (let i = 0; i < 12; i++) {
            const buildingType = Math.random();
            let building;
            
            if (buildingType < 0.25) {
                // Large residential building
                building = {
                    x: 400 + i * 200,
                    y: this.canvas.height - 400 - Math.random() * 200,
                    width: 180,
                    height: 400 + Math.random() * 200,
                    type: 'residential',
                    windowLights: this.generateWindowLights(6, 8),
                    update: function(speed) {
                        this.x -= speed;
                    },
                    draw: function(ctx) {
                        // Main building structure
                        ctx.fillStyle = '#3A3A3A';
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                        
                        // Building facade
                        ctx.fillStyle = '#4A4A4A';
                        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 5);
                        
                        // Balconies
                        for (let floor = 1; floor < 12; floor++) {
                            ctx.fillStyle = '#555555';
                            ctx.fillRect(this.x + 10, this.y + floor * 35, this.width - 20, 4);
                            
                            // Balcony railings
                            ctx.fillStyle = '#666666';
                            for (let r = 0; r < 15; r++) {
                                ctx.fillRect(this.x + 15 + r * 10, this.y + floor * 35 - 8, 2, 12);
                            }
                        }
                        
                        // Windows with detailed frames
                        for (let floor = 0; floor < 12; floor++) {
                            for (let apt = 0; apt < 6; apt++) {
                                const windowX = this.x + 20 + apt * 25;
                                const windowY = this.y + 15 + floor * 35;
                                
                                // Window frame
                                ctx.fillStyle = '#666666';
                                ctx.fillRect(windowX - 2, windowY - 2, 22, 26);
                                
                                // Window glass
                                if (this.windowLights[floor] && this.windowLights[floor][apt]) {
                                    ctx.fillStyle = '#FFFF99';
                                } else {
                                    ctx.fillStyle = '#1A1A2E';
                                }
                                ctx.fillRect(windowX, windowY, 18, 22);
                                
                                // Window cross bars
                                ctx.fillStyle = '#888888';
                                ctx.fillRect(windowX + 8, windowY, 2, 22);
                                ctx.fillRect(windowX, windowY + 10, 18, 2);
                                
                                // Window details (curtains, plants)
                                if (this.windowLights[floor] && this.windowLights[floor][apt] && Math.random() > 0.7) {
                                    ctx.fillStyle = '#FF6B6B';
                                    ctx.fillRect(windowX + 2, windowY + 2, 4, 18);
                                    ctx.fillRect(windowX + 12, windowY + 2, 4, 18);
                                }
                            }
                        }
                        
                        // Rooftop details
                        ctx.fillStyle = '#654321';
                        ctx.fillRect(this.x, this.y, this.width, 20);
                        
                        // Antennas and equipment
                        ctx.fillStyle = '#888888';
                        ctx.fillRect(this.x + 30, this.y - 15, 4, 15);
                        ctx.fillRect(this.x + 80, this.y - 25, 6, 25);
                        ctx.fillRect(this.x + 130, this.y - 10, 3, 10);
                        
                        // Air conditioning units
                        ctx.fillStyle = '#CCCCCC';
                        ctx.fillRect(this.x + 50, this.y + 5, 12, 8);
                        ctx.fillRect(this.x + 100, this.y + 5, 12, 8);
                        
                        // Building name/number
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '14px Arial';
                        ctx.fillText((100 + i).toString(), this.x + this.width/2 - 10, this.y + this.height - 20);
                    }
                };
            } else if (buildingType < 0.5) {
                // Modern office tower
                building = {
                    x: 400 + i * 200,
                    y: this.canvas.height - 500 - Math.random() * 150,
                    width: 160,
                    height: 500 + Math.random() * 150,
                    type: 'office',
                    windowLights: this.generateWindowLights(5, 15),
                    update: function(speed) {
                        this.x -= speed;
                    },
                    draw: function(ctx) {
                        // Main tower structure
                        ctx.fillStyle = '#2F2F2F';
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                        
                        // Glass facade gradient
                        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
                        gradient.addColorStop(0, '#4A4A4A');
                        gradient.addColorStop(0.5, '#6A6A6A');
                        gradient.addColorStop(1, '#4A4A4A');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, this.height - 8);
                        
                        // Reflective glass windows
                        for (let floor = 0; floor < 18; floor++) {
                            for (let col = 0; col < 5; col++) {
                                const windowX = this.x + 15 + col * 30;
                                const windowY = this.y + 20 + floor * 28;
                                
                                // Window frame
                                ctx.fillStyle = '#333333';
                                ctx.fillRect(windowX - 1, windowY - 1, 26, 24);
                                
                                // Glass reflection
                                if (this.windowLights[floor] && this.windowLights[floor][col]) {
                                    ctx.fillStyle = '#87CEEB';
                                } else {
                                    ctx.fillStyle = '#1E3A5F';
                                }
                                ctx.fillRect(windowX, windowY, 24, 22);
                                
                                // Reflection highlights
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                                ctx.fillRect(windowX + 2, windowY + 2, 8, 18);
                            }
                        }
                        
                        // Building logo/sign
                        ctx.fillStyle = '#FF6B35';
                        ctx.fillRect(this.x + 20, this.y + 30, this.width - 40, 25);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '12px Arial';
                        ctx.fillText('MEDELLÍN CORP', this.x + 35, this.y + 47);
                        
                        // Rooftop elements
                        ctx.fillStyle = '#444444';
                        ctx.fillRect(this.x, this.y, this.width, 15);
                        
                        // Satellite dishes and equipment
                        ctx.fillStyle = '#CCCCCC';
                        ctx.fillRect(this.x + 40, this.y - 12, 15, 12);
                        ctx.fillRect(this.x + 100, this.y - 8, 10, 8);
                        
                        // Communication tower
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(this.x + this.width/2 - 2, this.y - 40, 4, 40);
                        ctx.fillRect(this.x + this.width/2 - 1, this.y - 45, 2, 5);
                    }
                };
            } else if (buildingType < 0.75) {
                // Colombian colonial style building
                building = {
                    x: 400 + i * 200,
                    y: this.canvas.height - 300 - Math.random() * 100,
                    width: 140,
                    height: 300 + Math.random() * 100,
                    type: 'colonial',
                    windowLights: this.generateWindowLights(4, 8),
                    update: function(speed) {
                        this.x -= speed;
                    },
                    draw: function(ctx) {
                        // Main building (cream/white colonial)
                        ctx.fillStyle = '#F5F5DC';
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                        
                        // Colonial architectural details
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(this.x, this.y, this.width, 12); // Top trim
                        ctx.fillRect(this.x, this.y + this.height - 12, this.width, 12); // Bottom trim
                        
                        // Vertical columns
                        for (let col = 0; col < 3; col++) {
                            ctx.fillStyle = '#D2B48C';
                            ctx.fillRect(this.x + 20 + col * 40, this.y + 12, 8, this.height - 24);
                        }
                        
                        // Ornate windows with shutters
                        for (let floor = 0; floor < 6; floor++) {
                            for (let col = 0; col < 4; col++) {
                                const windowX = this.x + 15 + col * 30;
                                const windowY = this.y + 25 + floor * 40;
                                
                                // Window arch
                                ctx.fillStyle = '#8B4513';
                                ctx.fillRect(windowX - 2, windowY - 5, 24, 5);
                                ctx.fillRect(windowX - 2, windowY, 2, 25);
                                ctx.fillRect(windowX + 20, windowY, 2, 25);
                                ctx.fillRect(windowX - 2, windowY + 25, 24, 2);
                                
                                // Window glass
                                if (this.windowLights[floor] && this.windowLights[floor][col]) {
                                    ctx.fillStyle = '#FFFF99';
                                } else {
                                    ctx.fillStyle = '#2F4F4F';
                                }
                                ctx.fillRect(windowX, windowY, 20, 25);
                                
                                // Shutters
                                ctx.fillStyle = '#228B22';
                                ctx.fillRect(windowX - 6, windowY, 4, 25);
                                ctx.fillRect(windowX + 22, windowY, 4, 25);
                                
                                // Window bars (iron work)
                                ctx.fillStyle = '#444444';
                                ctx.fillRect(windowX + 9, windowY, 2, 25);
                                for (let bar = 0; bar < 3; bar++) {
                                    ctx.fillRect(windowX, windowY + 5 + bar * 8, 20, 1);
                                }
                            }
                        }
                        
                        // Balconies
                        for (let floor = 1; floor < 4; floor++) {
                            ctx.fillStyle = '#8B4513';
                            ctx.fillRect(this.x + 10, this.y + 15 + floor * 80, this.width - 20, 6);
                            
                            // Balcony railing
                            ctx.fillStyle = '#444444';
                            for (let r = 0; r < 12; r++) {
                                ctx.fillRect(this.x + 15 + r * 10, this.y + 10 + floor * 80, 2, 15);
                            }
                        }
                        
                        // Red tile roof
                        ctx.fillStyle = '#CD853F';
                        ctx.fillRect(this.x - 5, this.y, this.width + 10, 15);
                        ctx.fillStyle = '#A0522D';
                        for (let tile = 0; tile < 15; tile++) {
                            ctx.fillRect(this.x - 5 + tile * 10, this.y, 8, 15);
                        }
                    }
                };
            } else {
                // Modern mixed-use building
                building = {
                    x: 400 + i * 200,
                    y: this.canvas.height - 350 - Math.random() * 150,
                    width: 170,
                    height: 350 + Math.random() * 150,
                    type: 'mixed',
                    windowLights: this.generateWindowLights(5, 10),
                    update: function(speed) {
                        this.x -= speed;
                    },
                    draw: function(ctx) {
                        // Ground floor (commercial)
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(this.x, this.y + this.height - 60, this.width, 60);
                        
                        // Shop windows
                        ctx.fillStyle = '#FFFF99';
                        ctx.fillRect(this.x + 10, this.y + this.height - 45, 40, 30);
                        ctx.fillRect(this.x + 60, this.y + this.height - 45, 40, 30);
                        ctx.fillRect(this.x + 110, this.y + this.height - 45, 40, 30);
                        
                        // Shop signs
                        ctx.fillStyle = '#FF6B35';
                        ctx.fillRect(this.x + 10, this.y + this.height - 55, 40, 8);
                        ctx.fillRect(this.x + 60, this.y + this.height - 55, 40, 8);
                        ctx.fillRect(this.x + 110, this.y + this.height - 55, 40, 8);
                        
                        // Upper floors (residential)
                        ctx.fillStyle = '#696969';
                        ctx.fillRect(this.x, this.y, this.width, this.height - 60);
                        
                        // Residential windows
                        for (let floor = 0; floor < 8; floor++) {
                            for (let apt = 0; apt < 5; apt++) {
                                const windowX = this.x + 15 + apt * 30;
                                const windowY = this.y + 20 + floor * 35;
                                
                                // Window frame
                                ctx.fillStyle = '#444444';
                                ctx.fillRect(windowX - 1, windowY - 1, 22, 26);
                                
                                // Window
                                if (this.windowLights[floor] && this.windowLights[floor][apt]) {
                                    ctx.fillStyle = '#FFFF99';
                                } else {
                                    ctx.fillStyle = '#1A1A2E';
                                }
                                ctx.fillRect(windowX, windowY, 20, 24);
                                
                                // AC units
                                if (Math.random() > 0.7) {
                                    ctx.fillStyle = '#CCCCCC';
                                    ctx.fillRect(windowX + 22, windowY + 10, 8, 6);
                                }
                            }
                        }
                        
                        // Building entrance
                        ctx.fillStyle = '#654321';
                        ctx.fillRect(this.x + this.width/2 - 15, this.y + this.height - 60, 30, 60);
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(this.x + this.width/2 - 12, this.y + this.height - 55, 24, 50);
                    }
                };
            }
            
            this.buildings.push(building);
        }
        
        // Add enemies and bullets
        this.enemies = [];
        this.bullets = [];
        this.spawnTimer = 0;
        
        // Setup controls
        this.setupControls();
        
        console.log('Starting game loop...');
        this.gameLoop();
    }
    
    generateWindowLights(cols, rows) {
        const lights = [];
        for (let row = 0; row < rows; row++) {
            lights[row] = [];
            for (let col = 0; col < cols; col++) {
                lights[row][col] = Math.random() > 0.4; // 60% chance light is on
            }
        }
        return lights;
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
            } else if (e.key === 'x' || e.key === 'X') {
                e.preventDefault();
                this.shoot();
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
        
        // Attack button
        const attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shoot();
            });
            
            attackBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.shoot();
            });
        }
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
    
    shoot() {
        const bullet = {
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height / 2 - 3,
            width: 12,
            height: 6,
            speed: 10,
            
            update: function() {
                this.x += this.speed;
            },
            
            draw: function(ctx) {
                // Main bullet body
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Bullet core (brighter)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 2, this.y + 1, this.width - 4, this.height - 2);
                
                // Add bullet trail
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(this.x - 8, this.y + 2, 8, 2);
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(this.x - 12, this.y + 2, 4, 2);
            }
        };
        
        this.bullets.push(bullet);
    }
    
    spawnEnemy() {
        const enemy = {
            x: this.canvas.width + 50,
            y: this.canvas.height - 120,
            width: 60,
            height: 60,
            
            update: function(speed) {
                this.x -= speed * 1.5; // Enemies move faster than buildings
            },
            
            draw: function(ctx) {
                // Draw pixelated monster (larger)
                ctx.fillStyle = '#8B0000'; // Dark red
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Monster eyes (larger)
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(this.x + 12, this.y + 12, 8, 8);
                ctx.fillRect(this.x + 35, this.y + 12, 8, 8);
                
                // Monster pupils
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 14, this.y + 14, 4, 4);
                ctx.fillRect(this.x + 37, this.y + 14, 4, 4);
                
                // Monster mouth
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 15, this.y + 35, 30, 8);
                
                // Monster teeth (larger)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 8, this.y + 40, 6, 12);
                ctx.fillRect(this.x + 18, this.y + 40, 6, 12);
                ctx.fillRect(this.x + 28, this.y + 40, 6, 12);
                ctx.fillRect(this.x + 38, this.y + 40, 6, 12);
                ctx.fillRect(this.x + 48, this.y + 40, 6, 12);
                
                // Monster claws
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(this.x + 5, this.y + 55, 3, 8);
                ctx.fillRect(this.x + 52, this.y + 55, 3, 8);
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
    
    checkBulletCollisions() {
        for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
            const bullet = this.bullets[bulletIndex];
            
            for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                const enemy = this.enemies[enemyIndex];
                
                // More generous collision detection
                if (bullet.x + bullet.width >= enemy.x &&
                    bullet.x <= enemy.x + enemy.width &&
                    bullet.y + bullet.height >= enemy.y &&
                    bullet.y <= enemy.y + enemy.height) {
                    
                    // Hit! Remove both bullet and enemy
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    
                    // Add points for killing enemy
                    this.distance += 10;
                    
                    console.log('Enemy hit! Bullet collision detected');
                    break; // Exit enemy loop since bullet is destroyed
                }
            }
        }
    }
    
    update() {
        console.log('Game updating, distance:', this.distance);
        
        this.distance += this.gameSpeed * 0.1;
        
        // Update background buildings
        this.backgroundBuildings.forEach(building => {
            building.update(this.gameSpeed);
            if (building.x < -150) {
                building.x = this.canvas.width + Math.random() * 300;
            }
        });
        
        // Update buildings
        this.buildings.forEach(building => {
            building.update(this.gameSpeed);
        });
        
        // Reset buildings that go off screen
        this.buildings.forEach(building => {
            if (building.x < -200) {
                building.x = this.canvas.width + Math.random() * 400;
            }
        });
        
        // Update city elements (welcome sign)
        this.cityElements.forEach(element => {
            element.update(this.gameSpeed);
        });
        
        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.update();
        });
        
        // Remove off-screen bullets
        this.bullets = this.bullets.filter(bullet => bullet.x < this.canvas.width + 50);
        
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
        this.checkBulletCollisions();
        
        // Update UI
        document.getElementById('score').textContent = `Distance: ${Math.floor(this.distance)}m`;
        document.getElementById('energy').textContent = `Energy: 100%`;
        document.getElementById('characterName').textContent = `Character: ${this.getCharacterDisplayName(this.selectedCharacter)}`;
    }
    
    draw() {
        // Clear screen with enhanced night sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(0.7, '#1a1a2e');
        gradient.addColorStop(1, '#2a2a3e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add stars
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 13 + this.distance * 0.1) % this.canvas.width;
            const y = (i * 7) % (this.canvas.height * 0.4);
            if (Math.sin(this.distance * 0.01 + i) > 0.8) {
                this.ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Draw moon
        this.ctx.fillStyle = '#F0F0F0';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 80, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw background buildings (far layer for depth)
        this.backgroundBuildings.forEach(building => building.draw(this.ctx));
        
        // Draw city elements (welcome sign)
        this.cityElements.forEach(element => element.draw(this.ctx));
        
        // Draw main detailed buildings
        this.buildings.forEach(building => building.draw(this.ctx));
        
        // Enhanced ground with texture
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Sidewalk
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 10);
        
        // Street markings
        this.ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < this.canvas.width; i += 40) {
            const x = (i - this.distance * 2) % this.canvas.width;
            this.ctx.fillRect(x, this.canvas.height - 45, 20, 3);
        }
        
        // Street lights
        for (let i = 0; i < this.canvas.width; i += 150) {
            const x = (i - this.distance * 1.2) % this.canvas.width;
            
            // Light pole
            this.ctx.fillStyle = '#888888';
            this.ctx.fillRect(x, this.canvas.height - 120, 4, 70);
            
            // Light fixture
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.fillRect(x - 8, this.canvas.height - 125, 20, 8);
            
            // Light glow
            this.ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x + 2, this.canvas.height - 120, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        // Draw player
        console.log('About to draw player...');
        this.player.draw(this.ctx);
        
        // Add atmospheric fog effect
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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