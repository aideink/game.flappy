const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Load images
const birdImg = new Image();
birdImg.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="#FFD700"/>
        <circle cx="28" cy="14" r="4" fill="white"/>
        <circle cx="28" cy="14" r="2" fill="black"/>
        <path d="M 30 20 Q 35 25 30 30" stroke="#FF6B6B" fill="none" stroke-width="3"/>
    </svg>
`);

// Game variables
const bird = {
    x: 50,
    y: 200,
    velocity: 0,
    gravity: 0.5,
    jump: -8,
    size: 20,
    rotation: 0
};

const particles = [];
const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
const pipeSpacing = 200;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameStarted = false;
let frameCount = 0;

highScoreElement.textContent = highScore;

// Particle system
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.life = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        this.size *= 0.99;
    }

    draw() {
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Event listeners
startButton.addEventListener('click', () => {
    startGame();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameOver) {
            resetGame();
        } else if (!gameStarted) {
            startGame();
        } else {
            jump();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameOver) {
        resetGame();
    } else if (!gameStarted) {
        startGame();
    } else {
        jump();
    }
});

function startGame() {
    gameStarted = true;
    startScreen.style.display = 'none';
    gameLoop();
}

function jump() {
    bird.velocity = bird.jump;
    // Add jump particles
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(bird.x, bird.y, '255, 255, 255'));
    }
}

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        height: height,
        scored: false
    });
}

function resetGame() {
    bird.y = 200;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes.length = 0;
    particles.length = 0;
    score = 0;
    scoreElement.textContent = score;
    gameOver = false;
    gameLoop();
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    frameCount++;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        const x = ((frameCount * 0.5 + i * 200) % (canvas.width + 100)) - 50;
        const y = 50 + i * 40;
        drawCloud(x, y);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipe(x, height, isTop) {
    const gradient = ctx.createLinearGradient(x, 0, x + pipeWidth, 0);
    gradient.addColorStop(0, '#2ECC71');
    gradient.addColorStop(0.5, '#27AE60');
    gradient.addColorStop(1, '#2ECC71');
    
    ctx.fillStyle = gradient;
    
    if (isTop) {
        ctx.fillRect(x, 0, pipeWidth, height);
        // Pipe cap
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(x - 5, height - 20, pipeWidth + 10, 20);
    } else {
        ctx.fillRect(x, height + pipeGap, pipeWidth, canvas.height - height - pipeGap);
        // Pipe cap
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(x - 5, height + pipeGap, pipeWidth + 10, 20);
    }
}

function gameLoop() {
    if (!gameStarted) return;
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1));

    // Draw bird with rotation
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    ctx.drawImage(birdImg, -bird.size, -bird.size, bird.size * 2, bird.size * 2);
    ctx.restore();

    // Update and draw particles
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.life <= 0) particles.splice(index, 1);
    });

    // Create new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x <= canvas.width - pipeSpacing) {
        createPipe();
    }

    // Update and draw pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 2;

        drawPipe(pipe.x, pipe.height, true);
        drawPipe(pipe.x, pipe.height, false);

        // Check collision
        if (
            bird.x + bird.size > pipe.x &&
            bird.x - bird.size < pipe.x + pipeWidth &&
            (bird.y - bird.size < pipe.height || bird.y + bird.size > pipe.height + pipeGap)
        ) {
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                highScoreElement.textContent = highScore;
            }
            showGameOver();
        }

        // Score points
        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            score++;
            scoreElement.textContent = score;
            pipe.scored = true;
            // Add score particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(bird.x, bird.y, '255, 215, 0'));
            }
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    // Check boundaries
    if (bird.y + bird.size > canvas.height || bird.y - bird.size < 0) {
        gameOver = true;
        showGameOver();
    }

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Best: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Click or press Space to restart', canvas.width / 2, canvas.height / 2 + 80);
}

// Start screen animation
function startScreenAnimation() {
    if (gameStarted) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    // Animate bird on start screen
    const hoverY = 200 + Math.sin(Date.now() / 500) * 20;
    ctx.drawImage(birdImg, 30, hoverY - bird.size, bird.size * 2, bird.size * 2);
    
    requestAnimationFrame(startScreenAnimation);
}

startScreenAnimation(); 