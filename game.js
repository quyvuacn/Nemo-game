const GAME_CONFIG = {
  CANVAS_WIDTH: 0,
  CANVAS_HEIGHT: 0,

  INITIAL_HEARTS: 5,
  BASKET_MOVE_DISTANCE: 0,
  BASKET_START_POSITION: 0,
  BASKET_MAX_POSITION: 0,
  BASKET_WIDTH: 75,
  BASKET_HEIGHT: 60,

  HEART_SPAWN_INTERVAL: 800,
  HEART_COLUMNS: 6,
  HEART_VARIANTS: 15,
  SPECIAL_HEART_CHANCE: 0.1,
  HEART_SIZE: 80,

  NORMAL_POINTS: 10,
  SPECIAL_POINTS: 50,

  SPEED_LEVELS: {
    INITIAL: 8000,
    LEVEL_1: 6000,
    LEVEL_2: 5500,
    LEVEL_3: 5000,
    LEVEL_4: 4500,
    LEVEL_5: 4000,
    LEVEL_6: 3500,
  },

  COLORS: {
    BASKET: "#ff6f9c",
    BASKET_HIGHLIGHT: "#ff86b3",
    BASKET_BORDER: "#ff0066",
    SPECIAL_HEART: "#FFD700",
    NORMAL_HEART: "#FF69B4",
  },

  CATCH_START_Y: 2800,
  CATCH_END_Y: 2980,

  FPS: 60,
  FRAME_TIME: 16.67,
};

let canvas, ctx;
let score = 0;
let hearts = GAME_CONFIG.INITIAL_HEARTS;
let level = GAME_CONFIG.SPEED_LEVELS.INITIAL;
let gameStarted = false;
let highScore = localStorage.getItem("highScore") || 0;
let lastFrameTime = 0;
let lastHeartTime = 0;
let animationFrameId = null;
let basketPosition = 0;
let currentLevel = 1;
let levelProgress = 0;
let fallingHearts = [];

const heartImages = [];
const loadHeartImages = () => {
  for (let i = 1; i <= GAME_CONFIG.HEART_VARIANTS; i++) {
    const img = new Image();
    img.src = `img/ld${i}.jpg`;
    heartImages.push(img);
  }
};

class Heart {
  constructor(column, isSpecial = false) {
    this.x = column * (GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.HEART_COLUMNS);
    this.y = 0;
    this.isSpecial = isSpecial;
    this.width = GAME_CONFIG.HEART_SIZE;
    this.height = GAME_CONFIG.HEART_SIZE;
    this.speed = GAME_CONFIG.CANVAS_HEIGHT / (level / GAME_CONFIG.FRAME_TIME);
    this.caught = false;
    this.imageIndex = Math.floor(Math.random() * GAME_CONFIG.HEART_VARIANTS);
    this.rotation = (Math.random() - 0.5) * 0.2;
    this.scale = 0.95 + Math.random() * 0.1;
  }

  update(deltaTime) {
    if (this.caught) return false;
    this.y += this.speed * (deltaTime / GAME_CONFIG.FRAME_TIME);

    const basketY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BASKET_HEIGHT;
    if (
      this.y + this.height > basketY &&
      this.y < GAME_CONFIG.CANVAS_HEIGHT &&
      Math.abs(this.x - basketPosition) < GAME_CONFIG.BASKET_WIDTH / 2
    ) {
      this.caught = true;
      const points = this.isSpecial
        ? GAME_CONFIG.SPECIAL_POINTS
        : GAME_CONFIG.NORMAL_POINTS;
      score += points;
      createHeartCaughtEffect(this.x, this.y, this.isSpecial);
      showScoreIncrement(this.x, this.y, points);
      return false;
    }

    if (this.y > GAME_CONFIG.CANVAS_HEIGHT) {
      hearts--;
      if (hearts <= 0) {
        gameOver();
      }
      return false;
    }

    return true;
  }

  draw() {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-centerX, -centerY);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY + this.height / 4);
    ctx.bezierCurveTo(
      centerX - this.width / 2,
      centerY,
      centerX - this.width / 2,
      centerY - this.height / 2,
      centerX,
      centerY - this.height / 3
    );
    ctx.bezierCurveTo(
      centerX + this.width / 2,
      centerY - this.height / 2,
      centerX + this.width / 2,
      centerY,
      centerX,
      centerY + this.height / 4
    );
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.clip();

    const image = heartImages[this.imageIndex];
    if (image && image.complete) {
      const padding = 2;
      ctx.drawImage(
        image,
        this.x + padding,
        this.y + padding,
        this.width - padding * 2,
        this.height - padding * 2
      );
      if (this.isSpecial) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.drawSparkles(centerX, centerY);
      }
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.isSpecial
      ? "rgba(255, 215, 0, 0.8)"
      : "rgba(255, 51, 133, 0.8)";
    ctx.stroke();
    ctx.restore();
  }

  drawSparkles(centerX, centerY) {
    ctx.save();
    const time = performance.now() / 1000;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + time;
      const distance = (this.width / 2) * 0.8;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      ctx.beginPath();
      ctx.fillStyle = "#FFD700";
      const sparkSize = 3 + Math.sin(time * 3 + i) * 1;
      ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function initCanvas() {
  canvas = document.getElementById("gameCanvas");
  canvas.width = Math.min(450, window.innerWidth * 0.9);
  canvas.height = Math.min(650, window.innerHeight * 0.7);
  ctx = canvas.getContext("2d");

  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
  GAME_CONFIG.BASKET_MAX_POSITION = canvas.width - GAME_CONFIG.BASKET_WIDTH;
  GAME_CONFIG.BASKET_MOVE_DISTANCE = canvas.width / GAME_CONFIG.HEART_COLUMNS;

  canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const canvasRect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - canvasRect.left;
    const columnWidth = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.HEART_COLUMNS;
    const column = Math.floor(touchX / columnWidth);
    basketPosition = Math.min(
      Math.max(
        0,
        column * (GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.HEART_COLUMNS)
      ),
      GAME_CONFIG.BASKET_MAX_POSITION
    );
  });
}

function clearCanvas() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#ffeaf2");
  gradient.addColorStop(1, "#ffd6e7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBackgroundDecorations();
}

function drawBackgroundDecorations() {
  ctx.save();
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 20 + 10;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.bezierCurveTo(x - size, y, x - size, y - size, x, y - size / 2);
    ctx.bezierCurveTo(x + size, y - size, x + size, y, x, y + size / 2);
    ctx.fillStyle = "#ff7eb9";
    ctx.fill();
  }
  ctx.restore();
}

function drawBasket() {
  const basketY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BASKET_HEIGHT;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  const gradient = ctx.createLinearGradient(
    basketPosition,
    basketY,
    basketPosition + GAME_CONFIG.BASKET_WIDTH,
    basketY + GAME_CONFIG.BASKET_HEIGHT
  );
  gradient.addColorStop(0, GAME_CONFIG.COLORS.BASKET);
  gradient.addColorStop(1, GAME_CONFIG.COLORS.BASKET_HIGHLIGHT);
  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.moveTo(basketPosition, basketY);
  ctx.lineTo(basketPosition + GAME_CONFIG.BASKET_WIDTH, basketY);
  ctx.lineTo(
    basketPosition + GAME_CONFIG.BASKET_WIDTH - 5,
    GAME_CONFIG.CANVAS_HEIGHT
  );
  ctx.lineTo(basketPosition + 5, GAME_CONFIG.CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GAME_CONFIG.COLORS.BASKET_BORDER;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = GAME_CONFIG.COLORS.BASKET_BORDER;
  ctx.lineWidth = 3;
  ctx.arc(
    basketPosition + GAME_CONFIG.BASKET_WIDTH / 2,
    basketY,
    GAME_CONFIG.BASKET_WIDTH / 2.2,
    Math.PI,
    0
  );
  ctx.stroke();
  ctx.beginPath();
  const heartX = basketPosition + GAME_CONFIG.BASKET_WIDTH / 2;
  const heartY = basketY + GAME_CONFIG.BASKET_HEIGHT / 2;
  const heartSize = GAME_CONFIG.BASKET_WIDTH / 4;
  ctx.moveTo(heartX, heartY + heartSize / 2);
  ctx.bezierCurveTo(
    heartX - heartSize,
    heartY,
    heartX - heartSize,
    heartY - heartSize,
    heartX,
    heartY - heartSize / 2
  );
  ctx.bezierCurveTo(
    heartX + heartSize,
    heartY - heartSize,
    heartX + heartSize,
    heartY,
    heartX,
    heartY + heartSize / 2
  );
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
}

function createNewHeart() {
  const column = Math.floor(Math.random() * GAME_CONFIG.HEART_COLUMNS);
  const isSpecial = Math.random() < GAME_CONFIG.SPECIAL_HEART_CHANCE;
  fallingHearts.push(new Heart(column, isSpecial));
}

function updateDifficulty() {
  const oldLevel = currentLevel;
  if (score >= 5000) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_6;
    currentLevel = 7;
    levelProgress = Math.min(100, (score - 5000) / 10);
  } else if (score >= 4000) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_5;
    currentLevel = 6;
    levelProgress = (score - 4000) / 10;
  } else if (score >= 3000) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_4;
    currentLevel = 5;
    levelProgress = (score - 3000) / 10;
  } else if (score >= 2000) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_3;
    currentLevel = 4;
    levelProgress = (score - 2000) / 10;
  } else if (score >= 1000) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_2;
    currentLevel = 3;
    levelProgress = (score - 1000) / 10;
  } else if (score >= 500) {
    level = GAME_CONFIG.SPEED_LEVELS.LEVEL_1;
    currentLevel = 2;
    levelProgress = (score - 500) / 5;
  } else {
    level = GAME_CONFIG.SPEED_LEVELS.INITIAL;
    currentLevel = 1;
    levelProgress = score / 5;
  }
  if (oldLevel !== currentLevel) {
    showLevelUp();
  }
  document.getElementById("level-progress").style.width = `${levelProgress}%`;
}

function showLevelUp() {
  const levelText = document.getElementById("level-text");
  levelText.textContent = currentLevel;
  levelText.style.transition = "none";
  levelText.style.transform = "scale(1.5)";
  levelText.style.color = "#ff6b6b";
  setTimeout(() => {
    levelText.style.transition = "all 0.5s";
    levelText.style.transform = "scale(1)";
    levelText.style.color = "";
  }, 50);
}

function createFloatingHearts() {
  const container = document.getElementById("floating-hearts");
  for (let i = 0; i < 20; i++) {
    const heart = document.createElement("div");
    heart.innerHTML = "♥";
    heart.className = "floating-heart";
    const size = Math.random() * 30 + 10;
    heart.style.fontSize = `${size}px`;
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.top = `${Math.random() * 100}%`;
    heart.style.setProperty("--translateX", `${(Math.random() - 0.5) * 200}px`);
    heart.style.setProperty("--translateY", `${Math.random() * 200}px`);
    heart.style.setProperty("--rotate", `${(Math.random() - 0.5) * 360}deg`);
    heart.style.animationDelay = `${Math.random() * 15}s`;
    container.appendChild(heart);
  }
}

function createHeartCaughtEffect(x, y, isSpecial) {
  const container = document.getElementById("game-screen");
  const heartEffect = document.createElement("div");
  heartEffect.className = "heart-caught";
  heartEffect.innerHTML = "❤️";
  heartEffect.style.left = `${x + GAME_CONFIG.HEART_SIZE / 2}px`;
  heartEffect.style.top = `${y + GAME_CONFIG.HEART_SIZE / 2}px`;
  heartEffect.style.fontSize = "60px";
  if (isSpecial) {
    heartEffect.style.color = "#FFD700";
  }
  container.appendChild(heartEffect);
  setTimeout(() => {
    if (heartEffect.parentNode) {
      heartEffect.parentNode.removeChild(heartEffect);
    }
  }, 500);
}

function showScoreIncrement(x, y, points) {
  const container = document.getElementById("game-screen");
  const scoreText = document.createElement("div");
  scoreText.className = "score-increment";
  scoreText.textContent = `+${points}`;
  scoreText.style.left = `${x + GAME_CONFIG.HEART_SIZE / 2}px`;
  scoreText.style.top = `${y}px`;
  if (points >= GAME_CONFIG.SPECIAL_POINTS) {
    scoreText.style.color = "#FFD700";
    scoreText.style.fontSize = "24px";
  }
  container.appendChild(scoreText);
  setTimeout(() => {
    if (scoreText.parentNode) {
      scoreText.parentNode.removeChild(scoreText);
    }
  }, 1000);
}

function updateUI() {
  document.getElementById("score").textContent = `Điểm: ${score}`;
  document.getElementById("heart").textContent = `Heart: ${hearts}`;
  document.getElementById("level-text").textContent = currentLevel;
}

function gameLoop(currentTime) {
  if (!gameStarted) return;
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;
  if (currentTime - lastHeartTime > GAME_CONFIG.HEART_SPAWN_INTERVAL) {
    createNewHeart();
    lastHeartTime = currentTime;
  }
  clearCanvas();
  fallingHearts = fallingHearts.filter((heart) => heart.update(deltaTime));
  fallingHearts.forEach((heart) => heart.draw());
  drawBasket();
  updateUI();
  updateDifficulty();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
  score = 0;
  hearts = GAME_CONFIG.INITIAL_HEARTS;
  level = GAME_CONFIG.SPEED_LEVELS.INITIAL;
  currentLevel = 1;
  levelProgress = 0;
  fallingHearts = [];
  basketPosition = GAME_CONFIG.BASKET_START_POSITION;
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  document.getElementById("game-over-screen").classList.add("hidden");
  gameStarted = true;
  lastFrameTime = performance.now();
  lastHeartTime = lastFrameTime;
  animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameStarted = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("game-over-screen").classList.remove("hidden");
  document.getElementById("final-score").textContent = score;
  document.getElementById("high-score").textContent = highScore;
  document.getElementById("bg-music").pause();
}

document.addEventListener("keydown", (event) => {
  if (!gameStarted) return;
  switch (event.key) {
    case "ArrowLeft":
      if (basketPosition > 0) {
        basketPosition -= GAME_CONFIG.BASKET_MOVE_DISTANCE;
      }
      break;
    case "ArrowRight":
      if (basketPosition < GAME_CONFIG.BASKET_MAX_POSITION) {
        basketPosition += GAME_CONFIG.BASKET_MOVE_DISTANCE;
      }
      break;
  }
});

document
  .getElementById("left-button")
  .addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (basketPosition > 0) {
      basketPosition -= GAME_CONFIG.BASKET_MOVE_DISTANCE;
    }
  });

document
  .getElementById("right-button")
  .addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (basketPosition < GAME_CONFIG.BASKET_MAX_POSITION) {
      basketPosition += GAME_CONFIG.BASKET_MOVE_DISTANCE;
    }
  });

window.addEventListener("load", () => {
  initCanvas();
  loadHeartImages();
  createFloatingHearts();
  document.getElementById("start-button").addEventListener("click", startGame);
  document
    .getElementById("restart-button")
    .addEventListener("click", startGame);
  document.getElementById("high-score").textContent = highScore;
});
