// Minimal working game to test
class SimpleGame {
    constructor() {
        console.log('Starting simple game...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Simple properties
        this.playerX = 100;
        this.playerY = 400;
        this.gameRunning = true;
        
        // Setup canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        console.log('Canvas setup complete');
        
        // Start game loop
        this.gameLoop();
    }
    
    update() {
        // Simple movement
        this.playerX += 1; // Move right slowly
        if (this.playerX > this.canvas.width) {
            this.playerX = -50; // Reset position
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw simple ground
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw simple player (red square)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.playerX, this.playerY, 50, 50);
        
        // Draw position text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Player at: ${this.playerX}, ${this.playerY}`, 10, 30);
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the simple game
window.addEventListener('load', () => {
    console.log('Window loaded, starting simple game...');
    new SimpleGame();
});