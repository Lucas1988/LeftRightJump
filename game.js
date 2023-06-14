const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const GRAVITY = 0.04;
const JUMP_STRENGTH = 4;

const skyColor = "rgb(135, 206, 235)";
const grassColor = "rgb(0, 128, 0)";

let score = 0;
let catFrequency = 0.1;
let bulletFrequency = 0.05;
let gameLoopCounter = 0;
let showStartButton = true;

canvas.addEventListener("click", function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const buttonX = SCREEN_WIDTH / 2 - 50;
  const buttonY = SCREEN_HEIGHT / 2 - 25;
  const buttonWidth = 100;
  const buttonHeight = 50;

  if (
    x >= buttonX &&
    x <= buttonX + buttonWidth &&
    y >= buttonY &&
    y <= buttonY + buttonHeight
  ) {
    initializeSpeechRecognition();
    showStartButton = false; // Hide the start button
    canvas.removeEventListener("click", arguments.callee);
  }
});

class Rabbit {
    constructor() {
        this.image = new Image();
        this.image.src = "rabbit.png";
        this.width = 100;
        this.height = 100;
        this.x = SCREEN_WIDTH / 2;
        this.y = SCREEN_HEIGHT / 2;
        this.dy = 0;
        this.onGround = false;
    }

    update() {
        this.dy += GRAVITY;
        this.y += this.dy;

        if (this.y >= SCREEN_HEIGHT - this.height) {
            this.y = SCREEN_HEIGHT - this.height;
            this.dy = 0;
            this.onGround = true;
        }
    }

    moveLeft() {
        this.x -= 80;
        if (this.x < 10) {
            this.x = 10;
        }
    }

    moveRight() {
        this.x += 80;
        if (this.x > SCREEN_WIDTH - this.width) {
            this.x = SCREEN_WIDTH - this.width;
        }
    }

    jump() {
        if (this.onGround) {
            this.dy -= JUMP_STRENGTH;
            this.onGround = false;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Cloud {
    constructor() {
        this.image = new Image();
        this.image.src = "cloud.png";
        this.width = 150;
        this.height = 100;
        this.x = Math.random() * (SCREEN_WIDTH - this.width);
        this.y = Math.random() * (SCREEN_HEIGHT / 2 - this.height);
    }

    update() {
        this.x += 1; // Adjust the speed of the clouds by changing this value

        if (this.x > SCREEN_WIDTH) {
            this.x = -this.width;
            this.y = Math.random() * (SCREEN_HEIGHT / 2 - this.height);
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Cat {
    constructor() {
        this.image = new Image();
        this.image.src = "cat.png";
        this.width = 200;
        this.height = 200;
        this.x = Math.random() * (SCREEN_WIDTH - this.width);
        this.y = -this.height;
    }

    update() {
        this.y += 0.8; // Reduce the speed of the cats

        if (this.y > SCREEN_HEIGHT) {
            // Handle cat removal here
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Bullet {
    constructor() {
        this.width = 10;
        this.height = 10;
        this.y = SCREEN_HEIGHT - this.height - 40;
        this.direction = Math.random() > 0.5 ? -1 : 1;
        this.speed = 1;
        this.x = this.direction === -1 ? SCREEN_WIDTH : -this.width;
        // Add bullet sound logic here
    }

    update() {
        this.x += this.direction * this.speed;

        if (this.x < -this.width || this.x > SCREEN_WIDTH) {
            // Handle bullet removal here
        }
    }

    draw(ctx) {
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function drawScore(ctx, score) {
    ctx.font = "80px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(score, 50, 50);
}

let clouds = [];
let cats = [];
let bullets = [];

function createClouds() {
    for (let i = 0; i < 3; i++) {
        let cloud = new Cloud();
        clouds.push(cloud);
    }
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.update();
    });
}

function drawClouds(ctx) {
    clouds.forEach(cloud => {
        cloud.draw(ctx);
    });
}

function createCat() {
    let cat = new Cat();
    cats.push(cat);

    const meowAudio = document.getElementById('meowAudio');
    meowAudio.currentTime = 0; // Reset the audio to the beginning
    meowAudio.volume = 0.5; // set the volume to 50%
    meowAudio.play();

    score += 10;
}

function updateCats() {
    cats.forEach(cat => {
        cat.update();
    });

    cats = cats.filter(cat => cat.y <= SCREEN_HEIGHT);
}

function drawCats(ctx) {
    cats.forEach(cat => {
        cat.draw(ctx);
    });
}

function createBullet() {
    let bullet = new Bullet();
    bullets.push(bullet);

    const bulletAudio = document.getElementById('bulletAudio');
    bulletAudio.currentTime = 0; // Reset the audio to the beginning
    bulletAudio.volume = 0.5; // set the volume to 50%
    bulletAudio.play();

    score += 20;
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.update();
    });

    bullets = bullets.filter(bullet => bullet.x >= -bullet.width && bullet.x <= SCREEN_WIDTH);
}

function drawBullets(ctx) {
    bullets.forEach(bullet => {
        bullet.draw(ctx);
    });
}

function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function customCollision(a, b) {
    let ratio = 0.4;
    let scaledWidthA = a.width * ratio;
    let scaledHeightA = a.height * ratio;
    let scaledWidthB = b.width * ratio;
    let scaledHeightB = b.height * ratio;

    let offsetXA = (a.width - scaledWidthA) / 2;
    let offsetYA = (a.height - scaledHeightA) / 2;
    let offsetXB = (b.width - scaledWidthB) / 2;
    let offsetYB = (b.height - scaledHeightB) / 2;

    let adjustedA = {
        x: a.x + offsetXA,
        y: a.y + offsetYA,
        width: scaledWidthA,
        height: scaledHeightA,
    };

    let adjustedB = {
        x: b.x + offsetXB,
        y: b.y + offsetYB,
        width: scaledWidthB,
        height: scaledHeightB,
    };

    return checkCollision(adjustedA, adjustedB);
}

function checkCollisions() {
    let rabbitHit = false;

    cats.forEach(cat => {
        if (customCollision(rabbit, cat)) {
            rabbitHit = true;
        }
    });

    bullets.forEach(bullet => {
        if (customCollision(rabbit, bullet)) {
            rabbitHit = true;
        }
    });

    if (rabbitHit) {
        // Handle game over logic, such as displaying a game over message and restarting the game
        gameOver();
    }
}

function gameOver() {
    // Stop the game loop
    cancelAnimationFrame(gameLoop);

    // Display the game over message
    ctx.fillStyle = "black";
    ctx.font = "bold 48px Arial";
    ctx.fillText("Game Over", SCREEN_WIDTH / 2 - 120, SCREEN_HEIGHT / 2);

    // Wait for 3 seconds before restarting the game
    setTimeout(() => {
        isGameOver = true;
        score = 0;
        cats = [];
        bullets = [];
        gameLoopCounter = 0;
    }, 3000);
}


function drawScore(ctx, score) {
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 10, 30);
}

let recognition = null;
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        console.error('Speech recognition not supported');
        return;
    }

    if (recognition && recognition.isActive()) {
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        console.log('Speech recognition started');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
    };

    recognition.onend = () => {
        console.log('Speech recognition ended');
        // Restart recognition after it ends
        setTimeout(() => {
            initializeSpeechRecognition();
        }, 1000);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          const leftCount = (transcript.match(/\bleft\b/g) || []).length;

          for (let j = 0; j < leftCount; j++) {
            rabbit.moveLeft();
          }

          const rightCount = (transcript.match(/\bright\b/g) || []).length;

          for (let j = 0; j < rightCount; j++) {
            rabbit.moveRight();
          }

          if (transcript.includes("jump")) {
            rabbit.jump();
          }
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };


    recognition.start();
}

function drawStartButton(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(SCREEN_WIDTH / 2 - 50, SCREEN_HEIGHT / 2 - 25, 100, 50);
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Start", SCREEN_WIDTH / 2 - 20, SCREEN_HEIGHT / 2 + 5);
}

function gameLoop() {
    // Clear the canvas and set the background colors
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    // Update and draw clouds
    updateClouds();
    drawClouds(ctx);

    // Update and draw cats
    updateCats();
    drawCats(ctx);

    // Update and draw bullets
    updateBullets();
    drawBullets(ctx);

    // Update and draw the rabbit
    rabbit.update();
    rabbit.draw(ctx);

    // Other game logic, such as input handling, collision detection, and score display
    checkCollisions();

    // Stop the recognition only if the game is not over
    if (!gameOver) {
        recognition.stop();
    }

    // Create a cat every catFrequency frames
    if (gameLoopCounter % Math.floor(60 / catFrequency) === 0) {
        createCat();
    }

    // Create a bullet every bulletFrequency frames
    if (gameLoopCounter % Math.floor(60 / bulletFrequency) === 0) {
        createBullet();
    }
    // Draw the score
    drawScore(ctx, score);

    // Increment the game loop counter
    gameLoopCounter++;

    // Call the game loop again
    requestAnimationFrame(gameLoop);

    if (showStartButton) {
        drawStartButton(ctx);
    }
}

const rabbit = new Rabbit();
createClouds();
gameLoop();
