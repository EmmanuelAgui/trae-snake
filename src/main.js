import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="game-container">
    <div class="game-header">
      <h1>贪吃蛇游戏</h1>
      <div class="score-container">
        <span>分数: </span>
        <span id="score">0</span>
      </div>
    </div>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <div class="game-controls">
      <button id="startButton">开始游戏</button>
      <p class="game-instructions">使用方向键或WASD控制蛇的移动</p>
    </div>
  </div>
`

// 游戏状态
let snake = [
  {x: 10, y: 10},
];
let food = {x: 5, y: 5};
let dx = 0;
let dy = 0;
let score = 0;
let gameInterval = null;
let gameStarted = false;

// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;

// 音效对象
const sounds = {
  move: null,
  eat: null,
  gameOver: null
};

// 初始化音频
async function initAudio() {
  try {
    const soundFiles = {
      move: '/sounds/move.mp3',
      eat: '/sounds/eat.mp3',
      gameOver: '/sounds/gameover.mp3'
    };

    // 创建并加载所有音频
    for (const [name, path] of Object.entries(soundFiles)) {
      sounds[name] = new Audio(path);
      sounds[name].volume = 0.3;
      if (name === 'move') {
        sounds[name].loop = true;
      }
      await sounds[name].load();
    }

    console.log('音频初始化成功');
  } catch (error) {
    console.error('音频初始化失败:', error);
  }
}

// 播放音效
async function playSound(soundName) {
  if (!sounds[soundName]) {
    console.error(`未找到音效: ${soundName}`);
    return;
  }

  try {
    const sound = sounds[soundName];
    if (soundName === 'move') {
      if (!sound.paused) return; // 如果已经在播放就不重复播放
      await sound.play();
    } else {
      let moveCurrentTime = 0;
      if (sounds.move && !sounds.move.paused) {
        moveCurrentTime = sounds.move.currentTime;
        sounds.move.pause(); // 暂停移动音效
      }
      sound.currentTime = 0;
      await sound.play();
      
      // 立即恢复移动音效的播放，不等待当前音效播放完成
      if (sounds.move && gameStarted) {
        sounds.move.currentTime = moveCurrentTime;
        sounds.move.play();
      }
    }
  } catch (error) {
    console.error(`播放${soundName}音效失败:`, error);
  }
}

// 初始化游戏
function initGame() {
  snake = [{x: 10, y: 10}];
  food = generateFood();
  dx = 0;
  dy = 0;
  score = 0;
  document.getElementById('score').textContent = score;
}

// 生成食物
function generateFood() {
  let x, y;
  do {
    x = Math.floor(Math.random() * (canvas.width / gridSize));
    y = Math.floor(Math.random() * (canvas.height / gridSize));
  } while (snake.some(segment => segment.x === x && segment.y === y));
  return {x, y};
}

// 绘制游戏
function draw() {
  // 清空画布
  ctx.fillStyle = '#242424';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制蛇
  ctx.fillStyle = '#4CAF50';
  snake.forEach(segment => {
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
  });

  // 绘制食物
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

// 更新游戏状态
function update() {
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  // 检查碰撞
  if (head.x < 0 || head.x >= canvas.width / gridSize ||
      head.y < 0 || head.y >= canvas.height / gridSize ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // 检查是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    playSound('eat');
    score += 10;
    document.getElementById('score').textContent = score;
    food = generateFood();
  } else {
    snake.pop();
  }
}

// 游戏结束
function gameOver() {
  if (!gameStarted) return; // 防止重复调用
  clearInterval(gameInterval);
  gameStarted = false;
  playSound('gameOver');
  
  // 创建游戏结束提示
  const gameOverDiv = document.createElement('div');
  gameOverDiv.className = 'game-over';
  gameOverDiv.innerHTML = `
    <div class="game-over-content">
      <h2>游戏结束！</h2>
      <p>得分：${score}</p>
    </div>
  `;
  document.querySelector('.game-container').appendChild(gameOverDiv);
  
  // 更新按钮状态
  document.getElementById('startButton').textContent = '重新开始';
  
  // 点击任意位置移除游戏结束提示
  setTimeout(() => {
    const removeGameOver = () => {
      gameOverDiv.remove();
      document.removeEventListener('click', removeGameOver);
    };
    document.addEventListener('click', removeGameOver);
  }, 100);
}

// 开始游戏
async function startGame() {
  if (gameStarted) return;
  
  // 移除可能存在的游戏结束提示
  const existingGameOver = document.querySelector('.game-over');
  if (existingGameOver) {
    existingGameOver.remove();
  }
  
  // 等待音频初始化完成
  await initAudio();
  
  gameStarted = true;
  initGame();
  // 设置初始移动方向为向右
  dx = 1;
  dy = 0;
  // 开始播放移动音效
  playSound('move');
  gameInterval = setInterval(() => {
    update();
    draw();
  }, 150);
  document.getElementById('startButton').textContent = '游戏中';
}

// 事件监听
document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (dy !== 1) { dx = 0; dy = -1; }
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (dy !== -1) { dx = 0; dy = 1; }
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (dx !== 1) { dx = -1; dy = 0; }
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (dx !== -1) { dx = 1; dy = 0; }
      break;
  }
});

document.getElementById('startButton').addEventListener('click', startGame);

// 初始绘制
draw();
