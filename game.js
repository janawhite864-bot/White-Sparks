// Pong Game Logic

class PongGame {
    constructor(canvasId, isAIMode = false) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isAIMode = isAIMode;
        this.isPaused = false;
        this.gameActive = false;

        // Game dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Paddle dimensions
        this.paddleWidth = 10;
        this.paddleHeight = 80;
        this.paddleSpeed = 6;

        // Ball dimensions
        this.ballSize = 8;
        this.ballSpeedX = 5;
        this.ballSpeedY = 5;
        this.maxBallSpeed = 8;

        // Scores
        this.player1Score = 0;
        this.player2Score = 0;
        this.maxScore = 11; // First to 11 wins

        // Paddles
        this.player1 = {
            x: 10,
            y: this.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            dy: 0
        };

        this.player2 = {
            x: this.width - 20,
            y: this.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            dy: 0
        };

        // Ball
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            size: this.ballSize,
            dx: this.ballSpeedX,
            dy: this.ballSpeedY
        };

        // Input handling
        this.keys = {};
        this.setupInputListeners();

        // AI difficulty
        this.aiDifficulty = 0.7; // 0-1, higher = harder
    }

    setupInputListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update() {
        if (this.isPaused || !this.gameActive) return;

        // Update player 1 (human)
        this.updatePlayer1();

        // Update player 2
        if (this.isAIMode) {
            this.updateAI();
        } else {
            this.updatePlayer2();
        }

        // Update ball
        this.updateBall();

        // Check collisions
        this.checkCollisions();

        // Check win condition
        this.checkWinCondition();
    }

    updatePlayer1() {
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player1.y = Math.max(0, this.player1.y - this.paddleSpeed);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player1.y = Math.min(this.height - this.paddleHeight, this.player1.y + this.paddleSpeed);
        }
    }

    updatePlayer2() {
        if (this.keys['arrowup']) {
            this.player2.y = Math.max(0, this.player2.y - this.paddleSpeed);
        }
        if (this.keys['arrowdown']) {
            this.player2.y = Math.min(this.height - this.paddleHeight, this.player2.y + this.paddleSpeed);
        }
    }

    updateAI() {
        const aiSpeed = this.paddleSpeed * this.aiDifficulty;
        const paddleCenter = this.player2.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y;

        // AI predicts ball position
        let predictedY = ballCenter;
        
        // Simple prediction: extrapolate ball path
        if (this.ball.dx > 0) {
            const timeToReach = (this.player2.x - this.ball.x) / Math.abs(this.ball.dx);
            predictedY = ballCenter + this.ball.dy * timeToReach;
        }

        // Add some randomness to make it beatable
        const error = (Math.random() - 0.5) * 30 * (1 - this.aiDifficulty);
        predictedY += error;

        // Move paddle towards predicted position
        if (paddleCenter < predictedY - 5) {
            this.player2.y = Math.min(this.height - this.paddleHeight, this.player2.y + aiSpeed);
        } else if (paddleCenter > predictedY + 5) {
            this.player2.y = Math.max(0, this.player2.y - aiSpeed);
        }
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collisions (top and bottom)
        if (this.ball.y - this.ballSize <= 0 || this.ball.y + this.ballSize >= this.height) {
            this.ball.dy *= -1;
            this.ball.y = Math.max(this.ballSize, Math.min(this.height - this.ballSize, this.ball.y));
        }

        // Out of bounds (left and right) - scoring
        if (this.ball.x < 0) {
            this.player2Score++;
            this.resetBall();
        } else if (this.ball.x > this.width) {
            this.player1Score++;
            this.resetBall();
        }
    }

    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ballSpeedX;
        this.ball.dy = (Math.random() - 0.5) * this.ballSpeedY;

        this.updateScoreDisplay();
    }

    checkCollisions() {
        // Player 1 collision
        if (this.isColliding(this.ball, this.player1)) {
            this.ball.dx *= -1;
            this.ball.x = this.player1.x + this.paddleWidth + this.ballSize;
            this.increaseBallSpeed();
        }

        // Player 2 collision
        if (this.isColliding(this.ball, this.player2)) {
            this.ball.dx *= -1;
            this.ball.x = this.player2.x - this.ballSize;
            this.increaseBallSpeed();
        }
    }

    isColliding(ball, paddle) {
        return (
            ball.x - ball.size < paddle.x + paddle.width &&
            ball.x + ball.size > paddle.x &&
            ball.y - ball.size < paddle.y + paddle.height &&
            ball.y + ball.size > paddle.y
        );
    }

    increaseBallSpeed() {
        const currentSpeed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
        if (currentSpeed < this.maxBallSpeed) {
            const speedIncrease = 1.02;
            this.ball.dx *= speedIncrease;
            this.ball.dy *= speedIncrease;
        }

        // Add spin based on where ball hits paddle
        const hitPos = (this.ball.y - (this.player1.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
        this.ball.dy += hitPos * 2;
    }

    checkWinCondition() {
        if (this.player1Score >= this.maxScore || this.player2Score >= this.maxScore) {
            this.gameActive = false;
            return true;
        }
        return false;
    }

    updateScoreDisplay() {
        document.getElementById('player1Score').textContent = this.player1Score;
        document.getElementById('player2Score').textContent = this.player2Score;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw center line
        this.ctx.strokeStyle = '#444';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw paddles
        this.drawPaddle(this.player1);
        this.drawPaddle(this.player2);

        // Draw ball
        this.drawBall();

        // Draw pause indicator
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        }
    }

    drawPaddle(paddle) {
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
        this.ctx.shadowBlur = 10;
    }

    drawBall() {
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ballSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 10;
    }

    start() {
        this.gameActive = true;
        this.player1Score = 0;
        this.player2Score = 0;
        this.resetBall();
        this.updateScoreDisplay();
        this.gameLoop();
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    reset() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.resetBall();
        this.updateScoreDisplay();
    }

    gameLoop = () => {
        this.update();
        this.draw();

        if (this.gameActive) {
            requestAnimationFrame(this.gameLoop);
        }
    }

    getWinner() {
        if (this.player1Score > this.player2Score) {
            return 'Player 1 Wins!';
        } else {
            return this.isAIMode ? 'AI Wins!' : 'Player 2 Wins!';
        }
    }

    getScores() {
        return {
            player1: this.player1Score,
            player2: this.player2Score
        };
    }
}

// Global game instance
let game = null;

// UI Functions
function startAIGame() {
    showScreen('paymentScreen');
    window.selectedMode = 'ai';
    document.getElementById('modeDisplay').textContent = 'Play vs AI';
}

function startMultiplayerGame() {
    showScreen('paymentScreen');
    window.selectedMode = 'multiplayer';
    document.getElementById('modeDisplay').textContent = 'Play vs Player';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function initializeGame() {
    const isAI = window.selectedMode === 'ai';
    game = new PongGame('pongCanvas', isAI);
    
    // Update labels
    document.getElementById('player1Label').textContent = 'Player 1: W/S or ↑/↓';
    document.getElementById('player2Label').textContent = isAI ? 'AI' : 'Player 2: ↑/↓';
    
    showScreen('gameScreen');
    game.start();
}

function pauseGame() {
    if (game) {
        game.pause();
        document.getElementById('pauseBtn').textContent = game.isPaused ? 'Resume' : 'Pause';
    }
}

function resetGame() {
    if (game) {
        game.reset();
    }
}

function endGame() {
    if (game) {
        game.gameActive = false;
        const scores = game.getScores();
        const winner = game.getWinner();
        
        document.getElementById('finalScore1').textContent = scores.player1;
        document.getElementById('finalScore2').textContent = scores.player2;
        document.getElementById('winner').textContent = winner;
        
        showScreen('gameOverScreen');
    }
}

function exitToMenu() {
    if (game) {
        game.gameActive = false;
    }
    showScreen('welcomeScreen');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('aiModeBtn').addEventListener('click', startAIGame);
    document.getElementById('multiplayerModeBtn').addEventListener('click', startMultiplayerGame);
    
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('exitGameBtn').addEventListener('click', endGame);
    
    document.getElementById('playAgainBtn').addEventListener('click', initializeGame);
    document.getElementById('backToMenuBtn').addEventListener('click', exitToMenu);

    // Check if payment was successful
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        initializeGame();
    }
});