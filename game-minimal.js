console.log('Game script loading... VERSION 2.0 - DEPLOYMENT FIX');

class Game {
    constructor() {
        console.log('Game constructor called');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Basic setup
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.distance = 0;
        this.gameSpeed = this.isMobile ? 24 : 4; // 2x faster overall (12 * 2 = 24, 2 * 2 = 4)
        this.gameRunning = true;
        this.lives = 5;
        this.maxLives = 5;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.energy = 0; // Start with 0% energy
        this.maxEnergy = 100;

        // Special power system
        this.specialPowerActive = false;
        this.specialPowerTimer = 0;
        this.specialPowerDuration = 600; // 10 seconds at 60fps
        this.canUseSpecialPower = false;

        // Level transition system
        this.levelTransitionActive = false;
        this.levelTransitionTimer = 0;
        this.carAppeared = false;
        this.carX = this.canvas.width + 50; // Start closer to screen
        this.playerMovingToCar = false;
        this.targetCarX = 350; // Closer target position
        this.lastLoggedDistance = 0; // For debug logging

        // Mobile performance settings
        this.isMobile = this.detectMobile();
        this.performanceMode = this.isMobile ? 'low' : 'high';
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.targetFPS = 30; // Lower target FPS for better performance
        this.skipFrames = 0;

        // Performance optimization variables
        this.timeCache = 0; // Cache for expensive time calculations
        this.effectsUpdateCounter = 0; // Counter for effect updates

        // Emergency performance mode - disable expensive features
        this.emergencyPerformanceMode = true;
        this.disableShadows = true;
        this.disableParticles = false; // Keep some particles
        this.disableComplexBackground = true;

        // Mobile optimizations - wider view for better gameplay
        if (this.isMobile) {
            // Much wider canvas so you can see enemies coming from far away
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.ctx.imageSmoothingEnabled = false;
            this.mobileOptimizations = true;

            // Aggressive performance optimizations for mobile
            this.maxParticles = 20; // Limit particles on mobile
            this.lightSpacing = 300; // Fewer street lights
        } else {
            this.mobileOptimizations = false;
        }

        // Load saved character or default to Juan
        this.selectedCharacter = this.loadSavedCharacter() || 'juan';

        // Create character with jumping
        this.player = this.createPlayer();

        // City elements including welcome sign
        this.buildings = [];
        this.cityElements = [];

        // Add Welcome to Medellin sign at the beginning (bigger and clearer)
        this.cityElements.push({
            x: 200,
            y: this.canvas.height - 300,
            width: 220,
            height: 140,
            type: 'welcome_sign',
            update: function(speed) {
                this.x -= speed;
            },
            draw: function(ctx) {
                // Sign post (bigger)
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 105, this.y + 100, 15, 100);

                // Sign board (bigger)
                ctx.fillStyle = '#2F4F2F';
                ctx.fillRect(this.x, this.y, this.width, 100);

                // Sign border
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x - 3, this.y - 3, this.width + 6, 106);
                ctx.fillStyle = '#2F4F2F';
                ctx.fillRect(this.x, this.y, this.width, 100);

                // Colombian flag (bigger)
                ctx.fillStyle = '#FFFF00'; // Yellow
                ctx.fillRect(this.x + 15, this.y + 8, 190, 25);
                ctx.fillStyle = '#0033A0'; // Blue
                ctx.fillRect(this.x + 15, this.y + 33, 190, 25);
                ctx.fillStyle = '#CE1126'; // Red
                ctx.fillRect(this.x + 15, this.y + 58, 190, 25);

                // Text (bigger and clearer)
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('WELCOME TO', this.x + 65, this.y + 25);

                ctx.font = 'bold 18px Arial';
                ctx.fillText('MEDELLÍN', this.x + 70, this.y + 50);

                ctx.font = 'bold 14px Arial';
                ctx.fillText('COLOMBIA', this.x + 75, this.y + 75);

                // Add decorative elements
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x + 10, this.y + 5, 5, 90); // Left border
                ctx.fillRect(this.x + 205, this.y + 5, 5, 90); // Right border
            }
        });

        // Create multiple parallax background layers
        this.backgroundLayers = this.createParallaxLayers();

        // Create main detailed buildings (reduce count on mobile)
        const mainBuildingCount = this.performanceMode === 'low' ? 6 : 12;
        for (let i = 0; i < mainBuildingCount; i++) {
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
                        // Keep building details but optimize for mobile
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
                        // Keep building details but optimize for mobile
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
                        ctx.fillStyle = '#0066FF';
                        ctx.fillRect(this.x + 20, this.y + 30, this.width - 40, 25);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 12px Arial';
                        ctx.fillText('CHANCES GANA', this.x + 30, this.y + 47);

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
                        // Keep building details but optimize for mobile
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
                        // Keep building details but optimize for mobile
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

        // Power-ups and collectibles
        this.powerUps = [];
        this.collectibles = [];
        this.powerUpSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;

        // Visual effects
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: '#FFFFFF', alpha: 0, duration: 0, maxDuration: 0 };

        // Audio system
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();

        // Setup controls
        this.setupControls();

        // Inject CSS to fix button layout on mobile phones
        this.injectMobileStyles();

        console.log('Starting game loop...');

        // Set global reference for particle effects
        window.gameInstance = this;

        // Verify critical UI elements exist before starting
        console.log('Checking for required UI elements...');
        const scoreEl = document.getElementById('score');
        const energyEl = document.getElementById('energy');
        const heartsEl = document.getElementById('hearts');
        const canvasEl = document.getElementById('gameCanvas');

        console.log('Score element found:', !!scoreEl);
        console.log('Energy element found:', !!energyEl);
        console.log('Hearts element found:', !!heartsEl);
        console.log('Canvas element found:', !!canvasEl);

        if (!scoreEl || !energyEl || !heartsEl || !canvasEl) {
            throw new Error('Missing required UI elements');
        }

        this.gameLoop();

        // Initialize character selection UI to match saved character
        this.updateCharacterSelectionUI();

        // Initialize hearts display
        try {
            this.updateHeartsDisplay();
        } catch (error) {
            console.error('Error initializing hearts display:', error);
        }
    }

    createParallaxLayers() {
        const layers = [];

        // Reduce background complexity on mobile
        const mountainCount = this.performanceMode === 'low' ? 8 : 15;
        const buildingCount = this.performanceMode === 'low' ? 10 : 20;
        const cloudCount = this.performanceMode === 'low' ? 4 : 8;

        // Far mountains layer (slowest)
        const mountains = [];
        for (let i = 0; i < mountainCount; i++) {
            mountains.push({
                x: i * 200,
                y: this.canvas.height - 300 - Math.random() * 100,
                width: 180 + Math.random() * 100,
                height: 200 + Math.random() * 150,
                speed: 0.1
            });
        }
        layers.push({
            name: 'mountains',
            objects: mountains,
            draw: (ctx, objects) => {
                ctx.fillStyle = '#1A1A2E';
                objects.forEach(mountain => {
                    ctx.fillRect(mountain.x, mountain.y, mountain.width, mountain.height);
                    // Mountain peaks
                    ctx.fillStyle = '#0F0F23';
                    ctx.fillRect(mountain.x + mountain.width/3, mountain.y - 20, mountain.width/3, 20);
                    ctx.fillStyle = '#1A1A2E';
                });
            }
        });

        // Distant city layer (medium slow)
        const distantBuildings = [];
        for (let i = 0; i < buildingCount; i++) {
            distantBuildings.push({
                x: 400 + i * 150,
                y: this.canvas.height - 200 - Math.random() * 100,
                width: 120,
                height: 200 + Math.random() * 100,
                speed: 0.3
            });
        }
        layers.push({
            name: 'distantBuildings',
            objects: distantBuildings,
            draw: (ctx, objects) => {
                objects.forEach(building => {
                    ctx.fillStyle = '#2A2A2A';
                    ctx.fillRect(building.x, building.y, building.width, building.height);

                    // Distant windows
                    ctx.fillStyle = '#444444';
                    for (let row = 0; row < 8; row++) {
                        for (let col = 0; col < 4; col++) {
                            if (Math.random() > 0.6) {
                                ctx.fillRect(building.x + 10 + col * 25, building.y + 10 + row * 20, 15, 12);
                            }
                        }
                    }
                });
            }
        });

        // Clouds layer (very slow)
        const clouds = [];
        for (let i = 0; i < cloudCount; i++) {
            clouds.push({
                x: i * 300 + Math.random() * 200,
                y: 50 + Math.random() * 150,
                width: 80 + Math.random() * 40,
                height: 30 + Math.random() * 20,
                speed: 0.05
            });
        }
        layers.push({
            name: 'clouds',
            objects: clouds,
            draw: (ctx, objects) => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                objects.forEach(cloud => {
                    // Draw fluffy cloud shape
                    ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
                    ctx.fillRect(cloud.x - 10, cloud.y + 5, cloud.width * 0.7, cloud.height * 0.8);
                    ctx.fillRect(cloud.x + cloud.width * 0.3, cloud.y + 8, cloud.width * 0.6, cloud.height * 0.6);
                });
            }
        });

        return layers;
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               ('ontouchstart' in window);
    }

    verifyUIElements() {
        console.log('Verifying UI elements...');
        const requiredElements = ['score', 'energy', 'hearts', 'gameCanvas'];
        const missing = [];

        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missing.push(id);
                console.error(`Missing UI element: ${id}`);
            } else {
                console.log(`Found UI element: ${id}`);
            }
        });

        if (missing.length > 0) {
            console.error('Missing UI elements:', missing);
            throw new Error(`Missing required UI elements: ${missing.join(', ')}`);
        }

        console.log('All UI elements verified successfully');
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.audioContext = null;
        }
    }

    // Resume audio context if needed (for browser autoplay policies)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate sound effects using Web Audio API
    createTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return;

        // Resume audio context if suspended
        this.resumeAudioContext();

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    playJumpSound() {
        // Higher pitch jump sound
        this.createTone(400, 0.2, 'square', 0.15);
    }

    playShootSound() {
        // Shooting sound effect
        this.createTone(800, 0.1, 'sawtooth', 0.1);
    }

    playHitSound() {
        // Enemy hit sound
        this.createTone(300, 0.3, 'square', 0.2);
        setTimeout(() => this.createTone(200, 0.2, 'triangle', 0.15), 100);
    }

    playDamageSound() {
        // Player damage sound
        this.createTone(150, 0.5, 'sawtooth', 0.25);
    }

    playGameOverSound() {
        // Game over sound sequence
        this.createTone(200, 0.3, 'triangle', 0.2);
        setTimeout(() => this.createTone(150, 0.4, 'sine', 0.2), 300);
        setTimeout(() => this.createTone(100, 0.6, 'triangle', 0.2), 600);
    }

    playPowerUpSound() {
        // Power-up sound - ascending tones
        this.createTone(400, 0.2, 'sine', 0.3);
        setTimeout(() => this.createTone(600, 0.2, 'sine', 0.3), 100);
        setTimeout(() => this.createTone(800, 0.3, 'sine', 0.3), 200);
    }

    playCollectibleSound() {
        // Collectible sound - gentle chimes
        this.createTone(523, 0.2, 'sine', 0.2); // C5
        setTimeout(() => this.createTone(659, 0.2, 'sine', 0.2), 150); // E5
        setTimeout(() => this.createTone(784, 0.2, 'sine', 0.2), 300); // G5
    }

    playSpecialPowerReadySound() {
        // Special power ready sound - magical chimes
        this.createTone(880, 0.3, 'sine', 0.4); // A5
        setTimeout(() => this.createTone(1108, 0.3, 'sine', 0.4), 200); // C#6
        setTimeout(() => this.createTone(1318, 0.4, 'sine', 0.4), 400); // E6
    }

    playSpecialPowerActivateSound() {
        // Special power activation sound - epic power-up
        this.createTone(220, 0.2, 'sawtooth', 0.5);
        setTimeout(() => this.createTone(440, 0.2, 'sawtooth', 0.5), 100);
        setTimeout(() => this.createTone(880, 0.3, 'sawtooth', 0.5), 200);
        setTimeout(() => this.createTone(1760, 0.4, 'sine', 0.5), 300);
    }

    activateSpecialPower() {
        if (!this.canUseSpecialPower || this.specialPowerActive) return;

        // Activate special power
        this.specialPowerActive = true;
        this.specialPowerTimer = this.specialPowerDuration;
        this.canUseSpecialPower = false;
        this.energy = 0; // Reset energy after use

        // Play activation sound
        this.playSpecialPowerActivateSound();

        // Create epic visual effect
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#FFD700', 50);
        this.addScreenShake(7, 250);
        this.addFlashEffect('#FFFFFF', 0.8, 300);

        console.log('SPECIAL POWER ACTIVATED! Invincible for 10 seconds!');
    }

    updateSpecialPower() {
        if (this.specialPowerActive) {
            this.specialPowerTimer--;

            if (this.specialPowerTimer <= 0) {
                this.specialPowerActive = false;
                console.log('Special power ended.');
            }
        }
    }

    startLevelTransition() {
        this.levelTransitionActive = true;
    // The line "this.gameRunning = false;" has been removed.
        this.carAppeared = true;
        this.levelTransitionTimer = 60;
        console.log('Level transition started! Car approaching...');

        this.showTransitionMessage();
    }

    updateLevelTransition() {
        if (!this.levelTransitionActive) return;

        this.levelTransitionTimer--;
        console.log('Transition timer:', this.levelTransitionTimer);

        // Phase 1: Car moves into view
        if (this.carX > this.targetCarX) {
            this.carX -= 8; // Much faster car movement
            console.log('Car moving, position:', this.carX);
        }

        // Phase 2: After short pause, start player movement
        if (this.levelTransitionTimer <= 30 && !this.playerMovingToCar) {
            this.playerMovingToCar = true;
            console.log('Player starting to move toward car');
        }

        // Phase 3: Move player toward car
        if (this.playerMovingToCar) {
            if (this.player.x < this.targetCarX - 80) {
                this.player.x += 3; // Faster player movement
                console.log('Player moving, position:', this.player.x);
            } else {
                // Transition complete - redirect to level 2
                console.log('Transition complete! Redirecting to Level 2...');
                this.transitionToLevel2();
            }
        }

        // Emergency fallback - if timer runs out, force transition
        if (this.levelTransitionTimer <= -60) {
            console.log('Emergency transition fallback!');
            this.transitionToLevel2();
        }
    }

    showTransitionMessage() {
        // Create and show transition overlay
        const overlay = document.createElement('div');
        overlay.id = 'transitionOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            color: #00FF00;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        overlay.innerHTML = `
            <h2>LEVEL 2 UNLOCKED!</h2>
            <p>Get in the car!</p>
        `;
        document.body.appendChild(overlay);
    }

    transitionToLevel2() {
        console.log('Saving progress and transitioning to Level 2...');

        // Save game progress
        try {
            localStorage.setItem('noobCentralLevel', '2');
            localStorage.setItem('noobCentralCharacter', this.selectedCharacter || 'juan');
            localStorage.setItem('noobCentralLives', this.lives.toString());
            localStorage.setItem('noobCentralEnergy', this.energy.toString());
            console.log('Progress saved successfully');
        } catch (error) {
            console.error('Error saving progress:', error);
        }

        // Show loading message
        const overlay = document.getElementById('transitionOverlay');
        if (overlay) {
            overlay.innerHTML = '<h2>Loading Level 2...</h2>';
        }

        // Redirect to level 2 with slight delay
        setTimeout(() => {
            console.log('Redirecting to level2.html');
            window.location.href = 'level2.html';
        }, 1000);
    }

    drawCar() {
        console.log('Drawing car at position:', this.carX);
        const carY = this.canvas.height - 120;

        // Car body (bigger and more visible)
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(this.carX, carY, 120, 50);

        // Car roof
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.carX + 20, carY - 25, 80, 25);

        // Car windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(this.carX + 25, carY - 20, 25, 18);
        this.ctx.fillRect(this.carX + 70, carY - 20, 25, 18);

        // Car wheels (bigger)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.carX + 25, carY + 50, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.carX + 95, carY + 50, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Car headlights (bigger)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(this.carX + 115, carY + 10, 10, 10);
        this.ctx.fillRect(this.carX + 115, carY + 30, 10, 10);

        // Car glowing outline for visibility
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.carX, carY - 25, 120, 75);
    }

    injectMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @media only screen and (max-width: 768px) {
                #characterSelectionContainer {
                    position: fixed !important;
                    /* MODIFICATION: Increased from 85px to 130px to move it up and avoid covering other buttons. */
                    bottom: 130px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    justify-content: center;
                    gap: 5px;
                    width: 95%;
                    max-width: 500px;
                    padding: 10px;
                    background-color: rgba(10, 10, 20, 0.75);
                    border-radius: 15px;
                    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
                    border: 1px solid #00ff00;
                    z-index: 50;
                }

                #characterSelectionContainer .character-btn {
                    padding: 8px 12px;
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('Mobile-specific styles for button positioning have been injected.');
    }

    loadSavedCharacter() {
        try {
            const savedCharacter = localStorage.getItem('noobCentralSelectedCharacter');
            if (savedCharacter && ['juan', 'kim', 'julian', 'jay'].includes(savedCharacter)) {
                console.log(`Loading saved character: ${savedCharacter}`);
                return savedCharacter;
            }
        } catch (error) {
            console.log('Could not load saved character:', error);
        }
        return null;
    }

    saveSelectedCharacter(character) {
        try {
            localStorage.setItem('noobCentralSelectedCharacter', character);
            console.log(`Saved character preference: ${character}`);
        } catch (error) {
            console.log('Could not save character preference:', error);
        }
    }

    updateCharacterSelectionUI() {
        // Update button styles to match current selection
        document.querySelectorAll('.character-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-character="${this.selectedCharacter}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Character name removed from UI
    }

    updateHeartsDisplay() {
        try {
            console.log('Updating hearts display...');
            const heartsContainer = document.getElementById('hearts');
            console.log('Hearts container:', heartsContainer);

            if (!heartsContainer) {
                console.warn('Hearts container not found!');
                return; // Exit if element doesn't exist
            }

            heartsContainer.innerHTML = '';

            for (let i = 0; i < this.maxLives; i++) {
                const heart = document.createElement('span');
                heart.className = 'heart';
                heart.textContent = '❤️';

                if (i >= this.lives) {
                    heart.classList.add('lost');
                    heart.textContent = '🤍';
                }

                heartsContainer.appendChild(heart);
            }
            console.log('Hearts display updated successfully');
        } catch (error) {
            console.error('Error updating hearts display:', error);
            console.error('Stack trace:', error.stack);
        }
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
            x: this.isMobile ? 60 : 100, // Move player more to the left on mobile for better view distance
            y: this.canvas.height - 170,
            width: 80,
            height: 120,
            jumpVelocity: 0,
            onGround: true,
            gravity: 0.8,
            jumpPower: -18,
            groundY: this.canvas.height - 170,
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

                    // Create jump particles and play sound (access parent game instance)
                    if (window.gameInstance) {
                        window.gameInstance.createJumpParticles(this.x + this.width/2, this.y + this.height);
                        window.gameInstance.playJumpSound();
                    }
                }
            },

            draw: function(ctx) {
                // Enhanced animation calculations
                const legOffset = Math.floor(this.animFrame / 8) % 2 === 0 ? 3 : -3;
                const armOffset = Math.floor(this.animFrame / 6) % 2 === 0 ? 2 : -2;
                const breatheOffset = Math.sin(this.animFrame * 0.1) * 1;
                const blinkFrame = Math.floor(this.animFrame / 60) % 10 === 0;
                const hairSway = Math.sin(this.animFrame * 0.08) * 1;
                const isJumping = !this.onGround;

                // Handle invulnerability flashing
                if (window.gameInstance && window.gameInstance.invulnerable) {
                    const flashRate = Math.floor(this.animFrame / 5) % 2;
                    if (flashRate === 0) {
                        ctx.save();
                        ctx.globalAlpha = 0.5;
                    }
                }

                // Draw character shadow first
                this.drawShadow(ctx);

                if (this.character === 'juan') {
                    this.drawJuan(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping);
                } else if (this.character === 'kim') {
                    this.drawKim(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping);
                } else if (this.character === 'julian') {
                    this.drawJulian(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping);
                } else if (this.character === 'jay') {
                    this.drawJay(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping);
                }

                // Restore context if we were flashing
                if (window.gameInstance && window.gameInstance.invulnerable) {
                    const flashRate = Math.floor(this.animFrame / 5) % 2;
                    if (flashRate === 0) {
                        ctx.restore();
                    }
                }
            },

            drawShadow: function(ctx) {
                // Character shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(this.x + this.width/2, this.y + this.height + 5,
                                this.width * 0.4, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            },

            drawSimpleCharacter: function(ctx, hairColor, skinColor, shirtColor, legOffset, isJumping) {
                // Super simplified character for mobile performance
                // Hair
                ctx.fillStyle = hairColor;
                ctx.fillRect(this.x + 20, this.y + 10, 40, 20);

                // Head
                ctx.fillStyle = skinColor;
                ctx.fillRect(this.x + 25, this.y + 15, 30, 30);

                // Eyes
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 30, this.y + 23, 4, 4);
                ctx.fillRect(this.x + 46, this.y + 23, 4, 4);

                // Body
                ctx.fillStyle = shirtColor;
                ctx.fillRect(this.x + 20, this.y + 45, 40, 50);

                // Arms
                ctx.fillStyle = skinColor;
                ctx.fillRect(this.x + 5, this.y + 50, 18, 30);
                ctx.fillRect(this.x + 57, this.y + 50, 18, 30);

                // Legs with animation
                ctx.fillStyle = '#0066CC';
                if (isJumping) {
                    ctx.fillRect(this.x + 25, this.y + 90, 12, 30);
                    ctx.fillRect(this.x + 43, this.y + 90, 12, 30);
                } else {
                    ctx.fillRect(this.x + 25 + legOffset, this.y + 95, 12, 25);
                    ctx.fillRect(this.x + 43 - legOffset, this.y + 95, 12, 25);
                }

                // Shoes
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 23 + (isJumping ? 0 : legOffset), this.y + 115, 16, 8);
                ctx.fillRect(this.x + 41 + (isJumping ? 0 : -legOffset), this.y + 115, 16, 8);
            },

            drawJuan: function(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping) {
                // Keep full character detail on all devices
                // Long BLACK hair for Juan with sway animation
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 15 + hairSway, this.y + 10, 50, 25); // Top hair
                ctx.fillRect(this.x + 10 + hairSway, this.y + 20, 60, 20); // Side hair
                ctx.fillRect(this.x + 5 + hairSway * 1.5, this.y + 30, 70, 25);  // Long flowing hair
                ctx.fillRect(this.x + 8 + hairSway * 2, this.y + 50, 64, 15);  // Hair continues down back

                // Head with breathing animation
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x + 25, this.y + 15 + breatheOffset, 30, 30);

                // Eyes with blinking animation
                ctx.fillStyle = '#000000';
                if (blinkFrame) {
                    // Closed eyes (blinking)
                    ctx.fillRect(this.x + 29, this.y + 25 + breatheOffset, 7, 2);
                    ctx.fillRect(this.x + 44, this.y + 25 + breatheOffset, 7, 2);
                } else {
                    // Open eyes
                    ctx.fillRect(this.x + 30, this.y + 23 + breatheOffset, 5, 5);
                    ctx.fillRect(this.x + 45, this.y + 23 + breatheOffset, 5, 5);

                    // Eye pupils with slight movement
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 31, this.y + 24 + breatheOffset, 2, 2);
                    ctx.fillRect(this.x + 46, this.y + 24 + breatheOffset, 2, 2);
                }

                // Eyebrows with expression
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 29, this.y + 21 + breatheOffset, 7, 2);
                ctx.fillRect(this.x + 44, this.y + 21 + breatheOffset, 7, 2);

                // Nose
                ctx.fillStyle = '#C8A882';
                ctx.fillRect(this.x + 38, this.y + 28 + breatheOffset, 4, 6);

                // Mouth with expression
                ctx.fillStyle = '#8B4513';
                if (isJumping) {
                    // Excited expression when jumping
                    ctx.fillRect(this.x + 35, this.y + 35 + breatheOffset, 10, 4);
                } else {
                    // Normal expression
                    ctx.fillRect(this.x + 35, this.y + 36 + breatheOffset, 10, 3);
                }

                // Facial hair
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 36, this.y + 34 + breatheOffset, 8, 2);

                // Body with breathing animation
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 20, this.y + 45 + breatheOffset, 40, 50);

                // Arms with swinging animation
                ctx.fillStyle = '#D2B48C';
                if (isJumping) {
                    // Arms up when jumping
                    ctx.fillRect(this.x + 5, this.y + 45 + armOffset, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 45 - armOffset, 18, 30);
                } else {
                    // Normal swinging arms
                    ctx.fillRect(this.x + 5, this.y + 50 + armOffset, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 50 - armOffset, 18, 30);
                }

                // Hands
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x + 7, this.y + 78 + armOffset, 14, 12);
                ctx.fillRect(this.x + 59, this.y + 78 - armOffset, 14, 12);

                // Jeans with proper leg animation
                ctx.fillStyle = '#0066CC';
                ctx.fillRect(this.x + 20, this.y + 95, 40, 25);

                // Enhanced leg animation
                if (isJumping) {
                    // Legs together when jumping
                    ctx.fillRect(this.x + 25, this.y + 90, 12, 30);
                    ctx.fillRect(this.x + 43, this.y + 90, 12, 30);
                } else {
                    // Running animation
                    ctx.fillRect(this.x + 25 + legOffset, this.y + 95, 12, 25);
                    ctx.fillRect(this.x + 43 - legOffset, this.y + 95, 12, 25);
                }

                // Shoes with better positioning
                ctx.fillStyle = '#654321';
                if (isJumping) {
                    ctx.fillRect(this.x + 23, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41, this.y + 115, 16, 8);
                } else {
                    ctx.fillRect(this.x + 23 + legOffset, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41 - legOffset, this.y + 115, 16, 8);
                }

                // Guitar with animation
                const guitarSway = Math.sin(this.animFrame * 0.1) * 2;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 15 + guitarSway, this.y + 60, 30, 12);
                ctx.fillRect(this.x - 20 + guitarSway, this.y + 55, 20, 22);

                // Guitar neck
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(this.x - 12 + guitarSway, this.y + 50, 4, 35);

                // Guitar strings with subtle vibration
                ctx.fillStyle = '#FFD700';
                for (let i = 0; i < 6; i++) {
                    const stringVibration = Math.sin(this.animFrame * 0.3 + i) * 0.5;
                    ctx.fillRect(this.x - 18 + i * 2 + guitarSway + stringVibration, this.y + 57, 1, 18);
                }

                // Guitar sound hole
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x - 10 + guitarSway, this.y + 63, 8, 8);

                // Add musical notes effect occasionally
                if (Math.floor(this.animFrame / 30) % 20 === 0) {
                    this.drawMusicalNotes(ctx);
                }
            },

            drawMusicalNotes: function(ctx) {
                // Musical notes floating around Juan
                ctx.fillStyle = '#FFD700';
                ctx.font = '16px Arial';
                ctx.fillText('♪', this.x - 25, this.y + 30);
                ctx.fillText('♫', this.x + 75, this.y + 40);
                ctx.fillText('♪', this.x - 30, this.y + 70);
            },

            drawKim: function(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping) {
                // Keep full character detail on all devices
                // Long BROWN hair with bounce animation
                const hairBounce = Math.sin(this.animFrame * 0.12) * 1.5;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 18 + hairSway, this.y + 10 + hairBounce, 44, 30);
                ctx.fillRect(this.x + 12 + hairSway * 1.2, this.y + 25 + hairBounce, 56, 25);
                ctx.fillRect(this.x + 15 + hairSway * 1.5, this.y + 45 + hairBounce, 50, 20);

                // Head with breathing animation
                ctx.fillStyle = '#FDBCB4';
                ctx.fillRect(this.x + 25, this.y + 15 + breatheOffset, 30, 30);

                // Eyes with blinking and makeup
                if (blinkFrame) {
                    // Closed eyes with eyelashes
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 28, this.y + 25 + breatheOffset, 8, 2);
                    ctx.fillRect(this.x + 44, this.y + 25 + breatheOffset, 8, 2);
                } else {
                    // Open eyes with makeup
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 30, this.y + 23 + breatheOffset, 5, 5);
                    ctx.fillRect(this.x + 45, this.y + 23 + breatheOffset, 5, 5);

                    // Eye pupils with sparkle
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 31, this.y + 24 + breatheOffset, 2, 2);
                    ctx.fillRect(this.x + 46, this.y + 24 + breatheOffset, 2, 2);

                    // Eye sparkle effect
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(this.x + 32, this.y + 25 + breatheOffset, 1, 1);
                    ctx.fillRect(this.x + 47, this.y + 25 + breatheOffset, 1, 1);
                }

                // Enhanced eyelashes
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 28, this.y + 21 + breatheOffset, 8, 2);
                ctx.fillRect(this.x + 44, this.y + 21 + breatheOffset, 8, 2);

                // Shaped eyebrows
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 29, this.y + 19 + breatheOffset, 7, 2);
                ctx.fillRect(this.x + 44, this.y + 19 + breatheOffset, 7, 2);

                // Nose with highlighting
                ctx.fillStyle = '#F5A9A9';
                ctx.fillRect(this.x + 38, this.y + 28 + breatheOffset, 4, 6);

                // Glossy lipstick with expression
                ctx.fillStyle = '#FF69B4';
                if (isJumping) {
                    // Excited smile when jumping
                    ctx.fillRect(this.x + 34, this.y + 34 + breatheOffset, 12, 5);
                } else {
                    ctx.fillRect(this.x + 35, this.y + 35 + breatheOffset, 10, 4);
                }

                // Cheek blush with glow
                ctx.fillStyle = '#FFB6C1';
                ctx.fillRect(this.x + 27, this.y + 30 + breatheOffset, 4, 3);
                ctx.fillRect(this.x + 49, this.y + 30 + breatheOffset, 4, 3);

                // Body with breathing animation
                ctx.fillStyle = '#FF1493';
                ctx.fillRect(this.x + 20, this.y + 45 + breatheOffset, 40, 50);

                // Dress details with movement
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(this.x + 22, this.y + 47 + breatheOffset, 36, 4);
                ctx.fillRect(this.x + 22, this.y + 70 + breatheOffset, 36, 4);

                // Arms with graceful movement
                ctx.fillStyle = '#FDBCB4';
                if (isJumping) {
                    // Graceful arms when jumping
                    ctx.fillRect(this.x + 5, this.y + 45 + armOffset/2, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 45 - armOffset/2, 18, 30);
                } else {
                    // Elegant arm swinging
                    ctx.fillRect(this.x + 5, this.y + 50 + armOffset/2, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 50 - armOffset/2, 18, 30);
                }

                // Hands with nail polish
                ctx.fillStyle = '#FDBCB4';
                ctx.fillRect(this.x + 7, this.y + 78 + armOffset/2, 14, 12);
                ctx.fillRect(this.x + 59, this.y + 78 - armOffset/2, 14, 12);

                // Nail polish
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(this.x + 9, this.y + 80 + armOffset/2, 3, 2);
                ctx.fillRect(this.x + 61, this.y + 80 - armOffset/2, 3, 2);

                // Animated jewelry with sparkles
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x + 8, this.y + 65, 12, 4);  // Left bracelet
                ctx.fillRect(this.x + 60, this.y + 65, 12, 4); // Right bracelet

                // Sparkling jewelry effect
                if (Math.floor(this.animFrame / 20) % 3 === 0) {
                    this.drawJewelrySparkles(ctx);
                }

                // Necklace
                ctx.fillRect(this.x + 35, this.y + 47 + breatheOffset, 10, 3);

                // Earrings with sway
                ctx.fillRect(this.x + 22, this.y + 30 + breatheOffset + hairBounce/2, 3, 6);
                ctx.fillRect(this.x + 55, this.y + 30 + breatheOffset + hairBounce/2, 3, 6);

                // Enhanced leg animation
                ctx.fillStyle = '#FDBCB4';
                if (isJumping) {
                    // Legs together when jumping
                    ctx.fillRect(this.x + 25, this.y + 90, 12, 30);
                    ctx.fillRect(this.x + 43, this.y + 90, 12, 30);
                } else {
                    // Elegant running
                    ctx.fillRect(this.x + 25 + legOffset/2, this.y + 95, 12, 25);
                    ctx.fillRect(this.x + 43 - legOffset/2, this.y + 95, 12, 25);
                }

                // High heels with better animation
                ctx.fillStyle = '#800080';
                if (isJumping) {
                    ctx.fillRect(this.x + 23, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41, this.y + 115, 16, 8);
                } else {
                    ctx.fillRect(this.x + 23 + legOffset/2, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41 - legOffset/2, this.y + 115, 16, 8);
                }

                // Heel details
                ctx.fillStyle = '#4B0082';
                if (!isJumping) {
                    ctx.fillRect(this.x + 32 + legOffset/2, this.y + 118, 3, 5);
                    ctx.fillRect(this.x + 50 - legOffset/2, this.y + 118, 3, 5);
                }

                // Handbag with sway
                const bagSway = Math.sin(this.animFrame * 0.15) * 2;
                ctx.fillStyle = '#FF1493';
                ctx.fillRect(this.x - 8 + bagSway, this.y + 55, 12, 15);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x - 6 + bagSway, this.y + 52, 8, 3);
            },

            drawJewelrySparkles: function(ctx) {
                // Sparkle effects around jewelry
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.fillText('✨', this.x + 15, this.y + 60);
                ctx.fillText('✨', this.x + 65, this.y + 60);
                ctx.fillText('✨', this.x + 40, this.y + 40);

                // Diamond sparkles
                ctx.fillStyle = '#FFD700';
                ctx.fillText('◊', this.x + 8, this.y + 50);
                ctx.fillText('◊', this.x + 70, this.y + 55);
            },

            drawJulian: function(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping) {
                // Keep full character detail on all devices
                // Head with breathing animation
                ctx.fillStyle = '#FDBCB4';
                ctx.fillRect(this.x + 25, this.y + 15 + breatheOffset, 30, 30);

                // Short BROWN hair with slight movement
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 22 + hairSway/3, this.y + 12, 36, 18);
                ctx.fillRect(this.x + 25 + hairSway/3, this.y + 10, 30, 8);

                // Eyes with blinking and nature-loving expression
                if (blinkFrame) {
                    // Closed eyes
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 29, this.y + 27 + breatheOffset, 7, 2);
                    ctx.fillRect(this.x + 44, this.y + 27 + breatheOffset, 7, 2);
                } else {
                    // Open eyes with kind expression
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 30, this.y + 25 + breatheOffset, 4, 4);
                    ctx.fillRect(this.x + 46, this.y + 25 + breatheOffset, 4, 4);

                    // Eye pupils
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 31, this.y + 26 + breatheOffset, 2, 2);
                    ctx.fillRect(this.x + 47, this.y + 26 + breatheOffset, 2, 2);

                    // Green glint in eyes (nature lover)
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(this.x + 32, this.y + 27 + breatheOffset, 1, 1);
                    ctx.fillRect(this.x + 48, this.y + 27 + breatheOffset, 1, 1);
                }

                // Friendly eyebrows
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 29, this.y + 23 + breatheOffset, 6, 2);
                ctx.fillRect(this.x + 45, this.y + 23 + breatheOffset, 6, 2);

                // Nose
                ctx.fillStyle = '#F5A9A9';
                ctx.fillRect(this.x + 38, this.y + 30 + breatheOffset, 4, 4);

                // Mouth with happy expression
                ctx.fillStyle = '#8B4513';
                if (isJumping) {
                    // Big smile when jumping
                    ctx.fillRect(this.x + 34, this.y + 36 + breatheOffset, 12, 3);
                } else {
                    // Content smile
                    ctx.fillRect(this.x + 35, this.y + 35 + breatheOffset, 10, 2);
                }

                // Body with breathing animation
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x + 20, this.y + 45 + breatheOffset, 40, 50);

                // Animated leaf pattern on shirt
                const leafSway = Math.sin(this.animFrame * 0.1);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(this.x + 25 + leafSway, this.y + 55 + breatheOffset, 6, 8);
                ctx.fillRect(this.x + 35 - leafSway, this.y + 65 + breatheOffset, 6, 8);
                ctx.fillRect(this.x + 45 + leafSway, this.y + 75 + breatheOffset, 6, 8);

                // Arms with gentle movement
                ctx.fillStyle = '#FDBCB4';
                if (isJumping) {
                    // Arms spread like embracing nature
                    ctx.fillRect(this.x + 5, this.y + 40 + armOffset, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 40 - armOffset, 18, 30);
                } else {
                    // Gentle arm swinging
                    ctx.fillRect(this.x + 5, this.y + 50 + armOffset, 18, 30);
                    ctx.fillRect(this.x + 57, this.y + 50 - armOffset, 18, 30);
                }

                // Hands with garden gloves
                ctx.fillStyle = '#90EE90';
                ctx.fillRect(this.x + 7, this.y + 78 + armOffset, 14, 12);
                ctx.fillRect(this.x + 59, this.y + 78 - armOffset, 14, 12);

                // Dirt stains on gloves
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 9, this.y + 80 + armOffset, 3, 2);
                ctx.fillRect(this.x + 61, this.y + 80 - armOffset, 3, 2);

                // Khaki pants
                ctx.fillStyle = '#C3B091';
                ctx.fillRect(this.x + 20, this.y + 95, 40, 25);

                // Enhanced leg animation
                if (isJumping) {
                    // Legs together when jumping
                    ctx.fillStyle = '#C3B091';
                    ctx.fillRect(this.x + 25, this.y + 90, 12, 30);
                    ctx.fillRect(this.x + 43, this.y + 90, 12, 30);
                } else {
                    // Running with pants
                    ctx.fillStyle = '#C3B091';
                    ctx.fillRect(this.x + 25 + legOffset, this.y + 95, 12, 25);
                    ctx.fillRect(this.x + 43 - legOffset, this.y + 95, 12, 25);
                }

                // Hiking boots
                ctx.fillStyle = '#654321';
                if (isJumping) {
                    ctx.fillRect(this.x + 23, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41, this.y + 115, 16, 8);
                } else {
                    ctx.fillRect(this.x + 23 + legOffset, this.y + 115, 16, 8);
                    ctx.fillRect(this.x + 41 - legOffset, this.y + 115, 16, 8);
                }

                // Animated plant collection
                const plantGrow = Math.sin(this.animFrame * 0.08) * 2;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 15, this.y + 65, 15, 12);

                // Growing plants with animation
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x - 12, this.y + 55 - plantGrow, 4, 15 + plantGrow);
                ctx.fillRect(this.x - 8, this.y + 50 - plantGrow * 1.5, 4, 20 + plantGrow * 1.5);
                ctx.fillRect(this.x - 4, this.y + 58 - plantGrow * 0.5, 4, 12 + plantGrow * 0.5);

                // Swaying leaves
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(this.x - 14 + leafSway, this.y + 52 - plantGrow, 8, 6);
                ctx.fillRect(this.x - 10 - leafSway, this.y + 47 - plantGrow * 1.5, 8, 6);
                ctx.fillRect(this.x - 6 + leafSway, this.y + 55 - plantGrow * 0.5, 8, 6);

                // Add nature particles occasionally
                if (Math.floor(this.animFrame / 40) % 15 === 0) {
                    this.drawNatureParticles(ctx);
                }
            },

            drawNatureParticles: function(ctx) {
                // Nature-themed particles around Julian
                ctx.fillStyle = '#32CD32';
                ctx.font = '14px Arial';
                ctx.fillText('🌱', this.x - 25, this.y + 35);
                ctx.fillText('🍃', this.x + 75, this.y + 45);

                // Dirt particles
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 20, this.y + 80, 2, 2);
                ctx.fillRect(this.x + 70, this.y + 85, 2, 2);
                ctx.fillRect(this.x - 15, this.y + 90, 1, 1);
            },

            drawJay: function(ctx, legOffset, armOffset, breatheOffset, blinkFrame, hairSway, isJumping) {
                // Keep full character detail on all devices
                // Head (LATINO skin tone)
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x + 25, this.y + 15, 30, 30);

                // BLACK hair for Jay (short and neat)
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 22, this.y + 12, 36, 18); // Short hair
                ctx.fillRect(this.x + 25, this.y + 10, 30, 8);  // Hair top

                // ROUNDED glasses (bigger and more detailed)
                ctx.fillStyle = '#000000';
                // Left lens frame
                ctx.fillRect(this.x + 28, this.y + 22, 12, 10);
                ctx.fillRect(this.x + 27, this.y + 23, 14, 8);
                // Right lens frame
                ctx.fillRect(this.x + 44, this.y + 22, 12, 10);
                ctx.fillRect(this.x + 43, this.y + 23, 14, 8);
                // Bridge
                ctx.fillRect(this.x + 40, this.y + 25, 4, 3);
                // Arms
                ctx.fillRect(this.x + 20, this.y + 26, 8, 2);
                ctx.fillRect(this.x + 56, this.y + 26, 8, 2);

                // Lens glass (white with reflection)
                ctx.fillStyle = '#F0F0F0';
                ctx.fillRect(this.x + 29, this.y + 24, 10, 6);
                ctx.fillRect(this.x + 45, this.y + 24, 10, 6);

                // Eyes behind glasses
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 31, this.y + 26, 3, 3);
                ctx.fillRect(this.x + 47, this.y + 26, 3, 3);

                // Nose
                ctx.fillStyle = '#C8A882';
                ctx.fillRect(this.x + 38, this.y + 32, 4, 4);

                // Mouth
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 35, this.y + 38, 10, 2);

                // MUSCULAR body (much wider and more defined)
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(this.x + 15, this.y + 45, 50, 50); // Wider torso

                // Chest muscles definition
                ctx.fillStyle = '#1E90FF';
                ctx.fillRect(this.x + 20, this.y + 50, 18, 20); // Left pec
                ctx.fillRect(this.x + 42, this.y + 50, 18, 20); // Right pec

                // Abs
                ctx.fillStyle = '#0073E6';
                ctx.fillRect(this.x + 35, this.y + 72, 10, 8);  // Upper abs
                ctx.fillRect(this.x + 35, this.y + 82, 10, 8);  // Lower abs

                // MUSCULAR arms (much bigger)
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x - 2, this.y + 50, 20, 35);  // Left arm (bigger)
                ctx.fillRect(this.x + 62, this.y + 50, 20, 35); // Right arm (bigger)

                // Bicep definition
                ctx.fillStyle = '#C8A882';
                ctx.fillRect(this.x + 2, this.y + 55, 12, 15);  // Left bicep
                ctx.fillRect(this.x + 66, this.y + 55, 12, 15); // Right bicep

                // Hands
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x + 5, this.y + 83, 14, 12);  // Left hand
                ctx.fillRect(this.x + 61, this.y + 83, 14, 12); // Right hand

                // Jeans
                ctx.fillStyle = '#000080';
                ctx.fillRect(this.x + 20, this.y + 95, 40, 25);

                // MUSCULAR legs (bigger)
                // Use the passed-in legOffset for running animation
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(this.x + 23 + legOffset, this.y + 95, 15, 25);  // Left leg (bigger)
                ctx.fillRect(this.x + 42 - legOffset, this.y + 95, 15, 25);  // Right leg (bigger)

                // Sneakers
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 21 + legOffset, this.y + 115, 19, 8);  // Left sneaker
                ctx.fillRect(this.x + 40 - legOffset, this.y + 115, 19, 8);  // Right sneaker

                // Sneaker details
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 23 + legOffset, this.y + 117, 15, 2);  // Left stripe
                ctx.fillRect(this.x + 42 - legOffset, this.y + 117, 15, 2);  // Right stripe

                // Laptop accessory (larger and more detailed)
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(this.x - 18, this.y + 60, 20, 15); // Laptop base
                ctx.fillRect(this.x - 16, this.y + 50, 16, 12); // Laptop screen

                // Screen content
                ctx.fillStyle = '#000080';
                ctx.fillRect(this.x - 15, this.y + 52, 14, 8);

                // Code lines on screen
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(this.x - 14, this.y + 53, 8, 1);
                ctx.fillRect(this.x - 14, this.y + 55, 6, 1);
                ctx.fillRect(this.x - 14, this.y + 57, 10, 1);

                // Keyboard
                ctx.fillStyle = '#808080';
                ctx.fillRect(this.x - 16, this.y + 72, 16, 3);
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
            } else if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                this.activateSpecialPower();
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

        // *** MODIFICATION: Add an ID to the button container for CSS targeting ***
        if (characterBtns.length > 0 && characterBtns[0].parentElement) {
            characterBtns[0].parentElement.id = 'characterSelectionContainer';
        }

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

        // Special power button
        const specialBtn = document.getElementById('specialBtn');
        if (specialBtn) {
            specialBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.activateSpecialPower();
            });

            specialBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.activateSpecialPower();
            });
        }
    }

    selectCharacter(character) {
        this.selectedCharacter = character;
        this.player.character = character;

        // Save character preference
        this.saveSelectedCharacter(character);

        // Character name removed from UI

        // Update button styles
        document.querySelectorAll('.character-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-character="${character}"]`).classList.add('active');

        // Show character video if available
        if (character === 'juan' || character === 'kim' || character === 'julian') {
            this.showCharacterVideo(character);
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

    showCharacterVideo(character) {
        // Remove existing video if any
        this.hideVideo();

        // First, let's test if we can access files at all
        console.log(`=== CHARACTER VIDEO DEBUG ===`);
        console.log(`Selected character: ${character}`);
        console.log(`Current URL: ${window.location.href}`);
        console.log(`Base URL: ${window.location.origin}`);

        // Video file mapping (updated with correct filenames)
        const videoFiles = {
            'juan': 'JuanIntro.mp4',
            'kim': 'KimIntro.mp4',
            'julian': 'JulianIntro.mp4'
        };

        // Check if video file exists for this character
        if (!videoFiles[character]) {
            console.log(`No video available for ${character}`);
            return;
        }

        // Simple test - try to fetch the file first
        const testPath = `public/${videoFiles[character]}`;
        console.log(`Testing file access: ${testPath}`);

        fetch(testPath)
            .then(response => {
                console.log(`Fetch response for ${testPath}:`, response.status, response.statusText);
                if (response.ok) {
                    console.log(`✅ File exists! Loading video...`);
                    this.loadVideo(character, testPath);
                } else {
                    console.log(`❌ File not found at ${testPath}, trying alternatives...`);
                    this.tryAlternativePaths(character, videoFiles[character]);
                }
            })
            .catch(error => {
                console.error(`❌ Fetch failed for ${testPath}:`, error);
                this.tryAlternativePaths(character, videoFiles[character]);
            });
    }

    tryAlternativePaths(character, filename) {
        const possiblePaths = [
            `./${filename}`,
            `../${filename}`,
            `./public/${filename}`,
            `../public/${filename}`,
            filename
        ];

        console.log(`Trying alternative paths for ${character}:`, possiblePaths);

        let pathIndex = 0;
        const testNextPath = () => {
            if (pathIndex >= possiblePaths.length) {
                console.error(`❌ All paths failed for ${character}`);
                this.showCharacterMessage(character);
                return;
            }

            const path = possiblePaths[pathIndex];
            console.log(`Testing path ${pathIndex + 1}/${possiblePaths.length}: ${path}`);

            fetch(path)
                .then(response => {
                    if (response.ok) {
                        console.log(`✅ Found video at: ${path}`);
                        this.loadVideo(character, path);
                    } else {
                        pathIndex++;
                        testNextPath();
                    }
                })
                .catch(error => {
                    pathIndex++;
                    testNextPath();
                });
        };

        testNextPath();
    }

    loadVideo(character, videoPath) {
        console.log(`Loading video for ${character} from: ${videoPath}`);

        // Create video element
        const video = document.createElement('video');
        video.id = 'characterVideo';
        video.src = videoPath;
        video.autoplay = true;
        video.loop = true;
        video.muted = false; // Enable sound
        video.controls = false; // Remove video controls
        video.volume = 0.7; // Set volume to 70%
        video.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 350px;
            height: 350px;
            z-index: 100;
            border: 4px solid #00ff00;
            border-radius: 15px;
            background: rgba(0,0,0,0.9);
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
        `;

        // Add character name overlay
        const overlay = document.createElement('div');
        overlay.id = 'videoOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: calc(50% - 200px);
            left: 50%;
            transform: translateX(-50%);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            z-index: 101;
            background: rgba(0,0,0,0.8);
            padding: 10px 20px;
            border-radius: 10px;
            border: 2px solid #00ff00;
        `;
        overlay.textContent = `${this.getCharacterDisplayName(character)} Selected!`;

        // Add video event listeners
        video.addEventListener('loadstart', () => {
            console.log(`✅ Video started loading: ${video.src}`);
        });

        video.addEventListener('canplay', () => {
            console.log(`✅ Video can start playing`);
        });

        video.addEventListener('playing', () => {
            console.log(`✅ Video is now playing!`);
        });

        video.addEventListener('error', () => {
            console.error(`❌ Video error occurred:`, video.error);
            this.hideVideo();
            this.showCharacterMessage(character);
        });

        video.addEventListener('loadeddata', () => {
            console.log(`✅ Video data loaded successfully`);
        });

        console.log(`📹 Appending video element to page...`);
        document.body.appendChild(video);
        document.body.appendChild(overlay);

        // Auto-hide after 7 seconds (extended duration)
        setTimeout(() => {
            this.hideVideo();
        }, 7000);
    }

    showCharacterMessage(character) {
        // Fallback message if video fails to load
        const message = document.createElement('div');
        message.id = 'characterMessage';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            z-index: 100;
            background: rgba(0,0,0,0.9);
            padding: 30px;
            border-radius: 15px;
            border: 4px solid #00ff00;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
        `;
        message.innerHTML = `
            <div>${this.getCharacterDisplayName(character)} Selected!</div>
            <div style="font-size: 14px; margin-top: 10px; color: #CCCCCC;">
                Video loading...
            </div>
        `;

        document.body.appendChild(message);

        // Auto-hide after 2 seconds
        setTimeout(() => {
            if (document.getElementById('characterMessage')) {
                document.getElementById('characterMessage').remove();
            }
        }, 2000);
    }

    hideVideo() {
        // Remove character video
        const existingVideo = document.getElementById('characterVideo');
        if (existingVideo) {
            existingVideo.remove();
        }

        // Remove old Juan video (legacy)
        const oldVideo = document.getElementById('juanVideo');
        if (oldVideo) {
            oldVideo.remove();
        }

        // Remove video overlay
        const overlay = document.getElementById('videoOverlay');
        if (overlay) {
            overlay.remove();
        }

        // Remove character message
        const message = document.getElementById('characterMessage');
        if (message) {
            message.remove();
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
                // Enhanced bullet with glow effect
                ctx.save();

                // Outer glow
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

                // Main bullet body with gradient
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(this.x, this.y, this.width, this.height);

                // Bullet core (brighter)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 2, this.y + 1, this.width - 4, this.height - 2);

                // Enhanced bullet trail with transparency
                ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
                ctx.fillRect(this.x - 8, this.y + 2, 8, 2);
                ctx.fillStyle = 'rgba(255, 69, 0, 0.6)';
                ctx.fillRect(this.x - 12, this.y + 2, 4, 2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.fillRect(this.x - 16, this.y + 2, 4, 2);

                ctx.restore();
            }
        };

        // Create muzzle flash effect
        this.createMuzzleFlash(this.player.x + this.player.width, this.player.y + this.player.height / 2);

        // Add slight screen shake for shooting
        this.addScreenShake(1, 50);

        // Play shooting sound
        this.playShootSound();

        this.bullets.push(bullet);
    }

    spawnEnemy() {
        const enemyType = Math.random();
        let enemy;

        if (enemyType < 0.4) {
            // Regular monster (bigger)
            enemy = {
                x: this.canvas.width + 50,
                y: this.canvas.height - 140,
                width: 80,
                height: 80,
                type: 'monster',

                update: function(speed) {
                    this.x -= speed * 1.5;
                },

                draw: function(ctx) {
                    // Improved larger monster with better design
                    // Main body (darker, more menacing)
                    ctx.fillStyle = '#4B0000';
                    ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, this.height - 10);

                    // Muscle definition
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(this.x + 10, this.y + 15, 25, 30);
                    ctx.fillRect(this.x + 45, this.y + 15, 25, 30);

                    // Glowing eyes (much more prominent)
                    ctx.fillStyle = '#FF4500';
                    ctx.fillRect(this.x + 12, this.y + 20, 16, 16);
                    ctx.fillRect(this.x + 42, this.y + 20, 16, 16);

                    // Simple eyes only - no shadows for performance
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(this.x + 16, this.y + 24, 8, 8);
                    ctx.fillRect(this.x + 46, this.y + 24, 8, 8);

                    // Menacing mouth with drool
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 15, this.y + 50, 50, 15);

                    // Sharp fangs
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 18, this.y + 50, 6, 20);
                    ctx.fillRect(this.x + 28, this.y + 52, 4, 15);
                    ctx.fillRect(this.x + 36, this.y + 52, 4, 15);
                    ctx.fillRect(this.x + 46, this.y + 50, 6, 20);
                    ctx.fillRect(this.x + 56, this.y + 50, 6, 20);

                    // Drool
                    ctx.fillStyle = '#90EE90';
                    ctx.fillRect(this.x + 25, this.y + 65, 2, 8);
                    ctx.fillRect(this.x + 50, this.y + 67, 2, 6);

                    // Massive claws
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(this.x, this.y + 65, 8, 15);
                    ctx.fillRect(this.x + 72, this.y + 65, 8, 15);

                    // Prominent spikes
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(this.x + 10, this.y - 8, 8, 15);
                    ctx.fillRect(this.x + 22, this.y - 12, 8, 20);
                    ctx.fillRect(this.x + 34, this.y - 10, 8, 18);
                    ctx.fillRect(this.x + 46, this.y - 11, 8, 19);
                    ctx.fillRect(this.x + 58, this.y - 7, 8, 14);

                    // Chest scars
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(this.x + 30, this.y + 25, 20, 2);
                    ctx.fillRect(this.x + 25, this.y + 35, 30, 2);
                }
            };
        } else {
            // Jumping hooded figure
            enemy = {
                x: this.canvas.width + 50,
                y: this.canvas.height - 140,
                width: 70,
                height: 100,
                type: 'jumper',
                jumpVelocity: 0,
                onGround: true,
                gravity: 0.6,
                jumpPower: -12,
                groundY: this.canvas.height - 140,
                jumpTimer: 0,

                update: function(speed) {
                    this.x -= speed * 1.2;

                    // Jumping behavior
                    this.jumpTimer++;
                    if (this.jumpTimer > 90 && this.onGround && Math.random() > 0.7) {
                        this.jumpVelocity = this.jumpPower;
                        this.onGround = false;
                        this.jumpTimer = 0;
                    }

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

                draw: function(ctx) {
                    // Improved hooded figure with clearer backwards cap
                    // Body (hoodie) - brighter to stand out
                    ctx.fillStyle = '#404040';
                    ctx.fillRect(this.x + 10, this.y + 30, 50, 60);

                    // Hoodie details
                    ctx.fillStyle = '#555555';
                    ctx.fillRect(this.x + 12, this.y + 32, 46, 8); // Chest stripe

                    // Head (more visible)
                    ctx.fillStyle = '#DDBEA9';
                    ctx.fillRect(this.x + 22, this.y + 18, 26, 22);

                    // BACKWARDS CAP - much more obvious
                    ctx.fillStyle = '#DC143C'; // Bright red cap
                    ctx.fillRect(this.x + 18, this.y + 15, 34, 12); // Main cap

                    // Cap brim pointing BACKWARDS (key feature)
                    ctx.fillStyle = '#B22222';
                    ctx.fillRect(this.x + 12, this.y + 20, 12, 6); // Backwards brim
                    ctx.fillRect(this.x + 10, this.y + 22, 8, 4); // Extended brim tip

                    // Cap logo/design
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 28, this.y + 18, 12, 6);
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 30, this.y + 20, 8, 2);

                    // Cool sunglasses (more prominent)
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 24, this.y + 28, 20, 10);
                    // Reflective lens effect
                    ctx.fillStyle = '#4169E1';
                    ctx.fillRect(this.x + 26, this.y + 30, 6, 6);
                    ctx.fillRect(this.x + 36, this.y + 30, 6, 6);

                    // Hood (less prominent so cap shows better)
                    ctx.fillStyle = 'rgba(26, 26, 26, 0.7)';
                    ctx.fillRect(this.x + 8, this.y + 8, 54, 25);

                    // Arms with sleeve details
                    ctx.fillStyle = '#404040';
                    ctx.fillRect(this.x, this.y + 35, 15, 25);
                    ctx.fillRect(this.x + 55, this.y + 35, 15, 25);

                    // Sleeve cuffs
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(this.x, this.y + 55, 15, 5);
                    ctx.fillRect(this.x + 55, this.y + 55, 15, 5);

                    // Hands
                    ctx.fillStyle = '#DDBEA9';
                    ctx.fillRect(this.x + 2, this.y + 58, 11, 12);
                    ctx.fillRect(this.x + 57, this.y + 58, 11, 12);

                    // Jeans with details
                    ctx.fillStyle = '#000080';
                    ctx.fillRect(this.x + 15, this.y + 85, 15, 25);
                    ctx.fillRect(this.x + 40, this.y + 85, 15, 25);

                    // Jean seams
                    ctx.fillStyle = '#4682B4';
                    ctx.fillRect(this.x + 17, this.y + 87, 1, 21);
                    ctx.fillRect(this.x + 42, this.y + 87, 1, 21);

                    // Branded sneakers
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(this.x + 12, this.y + 105, 21, 8);
                    ctx.fillRect(this.x + 37, this.y + 105, 21, 8);

                    // Sneaker stripes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 15, this.y + 107, 3, 1);
                    ctx.fillRect(this.x + 40, this.y + 107, 3, 1);

                    // Hoodie strings (more visible)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(this.x + 30, this.y + 35, 2, 10);
                    ctx.fillRect(this.x + 38, this.y + 35, 2, 10);
                }
            };
        }

        this.enemies.push(enemy);
    }

    spawnPowerUp() {
        const powerUp = {
            x: this.canvas.width + 50,
            y: this.canvas.height - 200 - Math.random() * 100, // Random height
            width: 40,
            height: 40,
            type: 'energy',

            update: function(speed) {
                this.x -= speed * 0.8; // Slower than enemies
            },

            draw: function(ctx) {
                // Energy power-up (lightning bolt)
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y);
                ctx.lineTo(this.x + 20, this.y + 15);
                ctx.lineTo(this.x + 15, this.y + 15);
                ctx.lineTo(this.x + 25, this.y + 40);
                ctx.lineTo(this.x + 15, this.y + 25);
                ctx.lineTo(this.x + 20, this.y + 25);
                ctx.closePath();
                ctx.fill();

                // No glow effects for performance
            }
        };

        this.powerUps.push(powerUp);
    }

    spawnCollectible() {
        const collectible = {
            x: this.canvas.width + 50,
            y: this.canvas.height - 180 - Math.random() * 80, // Random height
            width: 25,
            height: 25,
            type: 'joint',

            update: function(speed) {
                this.x -= speed * 0.6; // Even slower
            },

            draw: function(ctx) {
                // Marihuana plant leaf design
                const centerX = this.x + 12;
                const centerY = this.y + 12;

                // Main stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(centerX - 1, centerY + 5, 2, 8);

                // Central leaf (largest)
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 8, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // Side leaves (serrated cannabis leaf shape)
                ctx.fillStyle = '#228B22';

                // Left side leaves
                ctx.beginPath();
                ctx.ellipse(centerX - 6, centerY - 2, 4, 8, -0.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(centerX - 4, centerY + 3, 3, 6, -0.1, 0, Math.PI * 2);
                ctx.fill();

                // Right side leaves
                ctx.beginPath();
                ctx.ellipse(centerX + 6, centerY - 2, 4, 8, 0.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(centerX + 4, centerY + 3, 3, 6, 0.1, 0, Math.PI * 2);
                ctx.fill();

                // Leaf details (serrated edges effect)
                ctx.fillStyle = '#006400';
                ctx.fillRect(centerX - 2, centerY - 3, 1, 2);
                ctx.fillRect(centerX + 1, centerY - 5, 1, 2);
                ctx.fillRect(centerX - 1, centerY + 2, 1, 2);
                ctx.fillRect(centerX + 2, centerY, 1, 2);

                // No glow effects for performance
            }
        };

        this.collectibles.push(collectible);
    }

    checkPowerUpCollisions() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];

            if (this.player.x < powerUp.x + powerUp.width &&
                this.player.x + this.player.width > powerUp.x &&
                this.player.y < powerUp.y + powerUp.height &&
                this.player.y + this.player.height > powerUp.y) {

                // Give 100% energy
                this.energy = 100;

                // Enable special power
                if (!this.canUseSpecialPower) {
                    this.canUseSpecialPower = true;
                    this.playSpecialPowerReadySound();
                    console.log('Special power ready! Press Z or SPECIAL button!');
                }

                // Create particles effect
                this.createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#FFD700');

                // Play sound effect
                this.playPowerUpSound();

                // Remove power-up
                this.powerUps.splice(i, 1);
            }
        }
    }

    checkCollectibleCollisions() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];

            if (this.player.x < collectible.x + collectible.width &&
                this.player.x + this.player.width > collectible.x &&
                this.player.y < collectible.y + collectible.height &&
                this.player.y + this.player.height > collectible.y) {

                // Increase hearts (max 5)
                if (this.lives < this.maxLives) {
                    this.lives++;
                    this.updateHeartsDisplay();
                }

                // Create particles effect
                this.createExplosion(collectible.x + collectible.width/2, collectible.y + collectible.height/2, '#228B22');

                // Play sound effect
                this.playCollectibleSound();

                // Remove collectible
                this.collectibles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        if (this.invulnerable) return; // Skip collision check if invulnerable

        this.enemies.forEach(enemy => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {

                // Take damage instead of instant death
                this.takeDamage();
            }
        });
    }

    takeDamage() {
        if (this.invulnerable || this.specialPowerActive) return; // No damage during special power

        this.lives--;
        this.invulnerable = true;
        this.invulnerabilityTimer = 120; // 2 seconds at 60fps

        // Update hearts display
        this.updateHeartsDisplay();

        // Create damage effect
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        this.addScreenShake(2, 150);
        this.addFlashEffect('#FF0000', 0.4, 200);

        // Play damage sound
        this.playDamageSound();

        // Check if game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateInvulnerability() {
        if (this.invulnerable) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    gameOver() {
        this.gameRunning = false;

        const finalScoreEl = document.getElementById('finalScore');
        const gameOverEl = document.getElementById('gameOver');

        if (finalScoreEl) finalScoreEl.textContent = Math.floor(this.distance);
        if (gameOverEl) gameOverEl.style.display = 'block';

        // Play game over sound
        this.playGameOverSound();
    }

    // Particle Effects System
    createParticle(x, y, vx, vy, color, size, life, gravity = 0) {
        return {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            size: size,
            maxLife: life,
            life: life,
            gravity: gravity,

            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.gravity;
                this.life--;

                // Fade out over time
                this.alpha = this.life / this.maxLife;
            },

            draw: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                ctx.restore();
            }
        };
    }

    createExplosion(x, y) {
        // Emergency performance mode - minimal particles
        if (this.disableParticles) return;

        const particleCount = 3; // Very few particles
        const sparkCount = 2;

        // Create multiple explosion particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const colors = ['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#FF0000'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(this.createParticle(x, y, vx, vy, color, 3 + Math.random() * 3, 30 + Math.random() * 20));
        }

        // Add some sparks
        for (let i = 0; i < sparkCount; i++) {
            const vx = (Math.random() - 0.5) * 8;
            const vy = (Math.random() - 0.5) * 8;
            this.particles.push(this.createParticle(x, y, vx, vy, '#FFFFFF', 1, 15 + Math.random() * 10));
        }
    }

    createJumpParticles(x, y) {
        // Smart particle reduction for mobile performance
        const particleCount = this.mobileOptimizations ? 2 : 5;

        // Dust particles when jumping
        for (let i = 0; i < particleCount; i++) {
            const vx = (Math.random() - 0.5) * 4;
            const vy = Math.random() * -2;
            this.particles.push(this.createParticle(x + Math.random() * 40, y, vx, vy, '#8B4513', 2 + Math.random() * 2, 20 + Math.random() * 10, 0.1));
        }
    }

    createMuzzleFlash(x, y) {
        // Smart particle reduction for mobile performance
        const particleCount = this.mobileOptimizations ? 1 : 3;

        // Muzzle flash when shooting
        for (let i = 0; i < particleCount; i++) {
            const vx = 2 + Math.random() * 3;
            const vy = (Math.random() - 0.5) * 2;
            this.particles.push(this.createParticle(x, y, vx, vy, '#FFFF00', 3 + Math.random() * 2, 8 + Math.random() * 5));
        }
    }

    addScreenShake(intensity, duration) {
        // Reduce screen shake by 50% for better performance
        const reducedIntensity = intensity * 0.5;
        const reducedDuration = duration * 0.5;

        this.screenShake.intensity = reducedIntensity;
        this.screenShake.duration = reducedDuration;
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

    addFlashEffect(color, alpha, duration) {
        // Reduce flash effect intensity on mobile
        const mobileAlpha = this.mobileOptimizations ? alpha * 0.5 : alpha;
        const mobileDuration = this.mobileOptimizations ? duration * 0.6 : duration;

        this.flashEffect.active = true;
        this.flashEffect.color = color;
        this.flashEffect.alpha = mobileAlpha;
        this.flashEffect.duration = mobileDuration;
        this.flashEffect.maxDuration = mobileDuration;
    }

    updateFlashEffect() {
        if (this.flashEffect.active) {
            this.flashEffect.duration--;
            this.flashEffect.alpha = (this.flashEffect.duration / this.flashEffect.maxDuration) * 0.3;

            if (this.flashEffect.duration <= 0) {
                this.flashEffect.active = false;
            }
        }
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

                    // Create explosion effect
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);

                    // Minimal screen shake for enemy death
                    this.addScreenShake(1, 100);

                    // Flash effect
                    this.addFlashEffect('#FFFF00', 0.3, 100);

                    // Play enemy hit sound
                    this.playHitSound();

                    // Hit! Remove both bullet and enemy
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);

                    // Add points for killing enemy
                    this.distance += 10;
                    // Increase energy when killing enemies
                    this.energy = Math.min(this.maxEnergy, this.energy + 10);

                    // Check if player reached 100% energy for special power
                    if (this.energy >= 100 && !this.canUseSpecialPower) {
                        this.canUseSpecialPower = true;
                        this.playSpecialPowerReadySound();
                        console.log('Special power ready! Press SPECIAL button!');
                    }

                    console.log('Enemy hit! Bullet collision detected');
                    break; // Exit enemy loop since bullet is destroyed
                }
            }
        }
    }

    update() {
        // Removed expensive console.log for performance

        // Emergency check for deployment issue - check elements exist before using them
        const scoreCheck = document.getElementById('score');
        const energyCheck = document.getElementById('energy');
        console.log('DEPLOYMENT DEBUG - Score element exists:', !!scoreCheck);
        console.log('DEPLOYMENT DEBUG - Energy element exists:', !!energyCheck);

        if (!scoreCheck || !energyCheck) {
            console.error('CRITICAL: UI elements missing during update - stopping game');
            this.gameRunning = false;
            return;
        }

        // Check for level transition at 600m
        if (this.distance >= 600 && !this.levelTransitionActive && !this.carAppeared) {
            console.log('LEVEL TRANSITION TRIGGERED at distance:', this.distance);
            this.startLevelTransition();
        }

        // Only update distance if not in transition
        if (!this.levelTransitionActive) {
            this.distance += this.gameSpeed * 0.1;
            // Debug distance every 10 meters
            if (Math.floor(this.distance) % 10 === 0 && Math.floor(this.distance) !== this.lastLoggedDistance) {
                console.log('Current distance:', Math.floor(this.distance));
                this.lastLoggedDistance = Math.floor(this.distance);
            }
        }

        // Update visual effects
        this.updateScreenShake();
        this.updateFlashEffect();
        this.updateInvulnerability();
        this.updateSpecialPower();
        this.updateLevelTransition();

        // Update particles (emergency performance mode)
        if (!this.disableParticles) {
            const maxParticles = 10; // Very low limit
            if (this.particles.length > maxParticles) {
                this.particles = this.particles.slice(-5);
            }
            // Update every other frame only
            if (this.frameCount % 2 === 0) {
                this.particles.forEach(particle => particle.update());
                this.particles = this.particles.filter(particle => particle.life > 0);
            }
        } else {
            this.particles = []; // Clear all particles
        }

        // Background layers - emergency performance mode
        if (!this.disableComplexBackground) {
            this.effectsUpdateCounter++;
            // Update background much less frequently
            if (this.effectsUpdateCounter % 8 === 0) {
                this.backgroundLayers.forEach(layer => {
                    // Only update 1 object per layer per frame
                    if (layer.objects.length > 0) {
                        const obj = layer.objects[this.frameCount % layer.objects.length];
                        obj.x -= this.gameSpeed * obj.speed;

                        if (obj.x < -obj.width - 100) {
                            obj.x = this.canvas.width + 300;
                        }
                    }
                });
            }
        }

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

        // Spawn power-ups (less frequent)
        this.powerUpSpawnTimer++;
        if (this.powerUpSpawnTimer > 900) { // Spawn every 15 seconds
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }

        // Spawn collectibles (moderate frequency)
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer > 300) { // Spawn every 5 seconds
            this.spawnCollectible();
            this.collectibleSpawnTimer = 0;
        }

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.gameSpeed);
        });

        // Remove off-screen enemies
        this.enemies = this.enemies.filter(enemy => enemy.x > -100);

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.update(this.gameSpeed);
        });
        this.powerUps = this.powerUps.filter(powerUp => powerUp.x > -100);

        // Update collectibles
        this.collectibles.forEach(collectible => {
            collectible.update(this.gameSpeed);
        });
        this.collectibles = this.collectibles.filter(collectible => collectible.x > -100);

        // Check collisions
        this.checkCollisions();
        this.checkBulletCollisions();
        this.checkPowerUpCollisions();
        this.checkCollectibleCollisions();

        // TEMPORARY: Disable UI updates to fix deployment error
        console.log('DEPLOYMENT FIX: UI updates disabled temporarily');

        // Update UI
        try {
            const scoreEl = document.getElementById('score');
            const energyEl = document.getElementById('energy');

            if (scoreEl) {
                scoreEl.textContent = `Distance: ${Math.floor(this.distance)}m`;
            }

            if (energyEl) {
                let energyText = `Energy: ${Math.floor(this.energy)}%`;
                if (this.specialPowerActive) {
                    energyText += ' [INVINCIBLE!]';
                } else if (this.canUseSpecialPower) {
                    energyText += ' [SPECIAL READY!]';
                }
                energyEl.textContent = energyText;
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    draw() {
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        // Clear screen with enhanced night sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(0.7, '#1a1a2e');
        gradient.addColorStop(1, '#2a2a3e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add stars (reduce on mobile)
        const starCount = this.performanceMode === 'low' ? 20 : 50;
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < starCount; i++) {
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

        // Draw parallax background layers (simplified)
        if (!this.disableComplexBackground && this.frameCount % 4 === 0) {
            // Only draw background every 4th frame
            this.backgroundLayers.forEach(layer => {
                layer.draw(this.ctx, layer.objects);
            });
        }

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

        // Street lights (emergency performance mode)
        if (this.frameCount % 8 === 0) { // Only draw every 8th frame
            const lightSpacing = 400; // Much fewer lights
            for (let i = 0; i < this.canvas.width; i += lightSpacing) {
                const x = (i - this.distance * 1.2) % this.canvas.width;

                // Simple light pole only
                this.ctx.fillStyle = '#888888';
                this.ctx.fillRect(x, this.canvas.height - 120, 4, 70);
                this.ctx.fillStyle = '#CCCCCC';
                this.ctx.fillRect(x - 8, this.canvas.height - 125, 20, 8);
            }
        }

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw level transition car
        if (this.carAppeared) {
            this.drawCar();
        }

        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

        // Draw collectibles
        this.collectibles.forEach(collectible => collectible.draw(this.ctx));

        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(this.ctx));

        // Draw player
        // Player drawing (console.log removed for performance)

        // Special power effect (simplified for performance)
        if (this.specialPowerActive) {
            this.ctx.save();
            // Simple color overlay instead of glow
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(this.player.x - 5, this.player.y - 5, this.player.width + 10, this.player.height + 10);
        }

        this.player.draw(this.ctx);

        if (this.specialPowerActive) {
            this.ctx.restore();
        }

        // Draw particles (emergency performance mode)
        if (!this.disableParticles && this.frameCount % 2 === 0) {
            this.particles.forEach(particle => particle.draw(this.ctx));
        }

        // Add atmospheric fog effect
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Restore context (end screen shake)
        this.ctx.restore();

        // Draw flash effect (after restore so it's not affected by shake)
        if (this.flashEffect.active) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashEffect.alpha;
            this.ctx.fillStyle = this.flashEffect.color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        const targetFrameTime = 1000 / this.targetFPS;

        // Throttle frame rate on mobile
        if (deltaTime >= targetFrameTime) {
            if (this.levelTransitionActive) {
              this.updateLevelTransition(); // Continue updating only the transition animation
            } else if (this.gameRunning) {
              this.update(); // Otherwise, update the main game
            }
            this.draw(); // Always draw the screen
            this.lastFrameTime = currentTime - (deltaTime % targetFrameTime);
            this.frameCount++;
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    console.log('Window loaded, creating game...');

    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        try {
            new Game();
            console.log('Game created successfully');
        } catch (error) {
            console.error('Error creating game:', error);
            alert('Error creating game: ' + error.message);
        }
    }, 100);
});
