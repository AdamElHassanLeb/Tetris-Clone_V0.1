//I left These as const and I am thinking of adding a few more here
//As through some research I found this as sort of a standard. Is this correct?
const ROWS = 20;
const COLS = 10;
const CELL_SIZE = 30;
const PIECES = [
  [[1, 1, 1, 1]],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
  ],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
];

class Sprite {
  constructor() {}

  update() {}

  draw() {}
}

class Man extends Sprite {
  constructor(x, y, canvas, size) {
    super();
    this.x = x;
    this.y = y;
    this.size = size;
    this.canvas = canvas;
    this.verticalSpeed = 2;
    this.horizontalSpeed = 5;
    this.gravity = 0.15;

    //Animation Stuff
    this.spriteSheet = new Image();
    this.spriteSheet.src = "./assets/photos/spriteSheet.png";
    this.spriteWidth = 144;
    this.spriteHeight = 144;
    this.frameIndexVer = 1;
    this.frameIndexHor = 0;
    this.numberOfFramesHor = 5;
    this.numberOfFramesVer = 0;
    this.timePerFrame = 100;
    this.lastUpdate = Date.now();
  }

  draw(ctx) {
    ctx.drawImage(
      this.spriteSheet,
      this.frameIndexHor * this.spriteWidth + 5,
      this.frameIndexVer * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.size,
      this.size
    );
  }

  update() {
    if (Date.now() - this.lastUpdate >= this.timePerFrame) {
      this.frameIndexHor++;
      if (this.frameIndexHor >= this.numberOfFramesHor) {
        this.frameIndexHor = 0;
        this.frameIndexVer++;
        if (this.frameIndexVer >= this.numberOfFramesVer) {
          this.frameIndexVer = 0;
        }
      }
      this.lastUpdate = Date.now();
    }
  }
}

class TetrisPiece extends Sprite {
  constructor(shape, color, game) {
    super();
    this.game = game;
    this.shape = shape;
    this.color = color;
    this.testCollision = true;
    this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
    this.y = 0;
    this.fallCounter = 0;
    this.fallSpeed = this.game.defaultFallSpeed;

    this.moveSound = new Audio("./assets/audio/moveSound.mp3");
    this.moveSound.volume = 0.2;

    this.rotateSound = new Audio("./assets/audio/rotateSound.mp3");

    this.contactSound = new Audio("./assets/audio/dropSound.mp3");
  }

  placePieceOnGrid() {
    this.contactSound.pause();
    this.contactSound.currentTime = 0;
    this.contactSound.play();

    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (
          this.shape[row][col] &&
          this.y + row >= 0 &&
          this.y + row < ROWS &&
          this.x + col >= 0 &&
          this.x + col < COLS
        ) {
          this.game.landedTetriminoArr[this.y + row][this.x + col] = this.color;
        }
      }
    }
  }

  update() {
    if (!this.isPaused) {
      this.movePieceDown();
    }
  }

  draw(ctx) {
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col]) {
          const x = (this.x + col) * CELL_SIZE;
          const y = (this.y + row) * CELL_SIZE;

          // Draw filled rectangle
          ctx.fillStyle = this.color;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

          // Draw black stroke
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }

  collisionControl() {
    this.fallCounter++;
    if (this.fallCounter >= this.fallSpeed) {
      this.y++;
      this.fallCounter = 0;
    }
    if (this.collides()) {
      this.y--; // Undo the move
      return true;
    }
    return false;
  }

  moveLeft() {
    this.x--;
    this.moveSound.pause();
    this.moveSound.currentTime = 0;
    this.moveSound.play();
    if (this.collides()) {
      this.x++; // Undo the move
    }
  }

  moveRight() {
    this.x++;
    this.moveSound.pause();
    this.moveSound.currentTime = 0;
    this.moveSound.play();
    if (this.collides()) {
      this.x--; // Undo the move
    }
  }

  movePieceDown() {
    if (
      this.collisionControl() ||
      this.y + this.shape.length >= ROWS ||
      this.y < 0
    ) {
      this.placePieceOnGrid();
      this.game.checkAndClearRows();
      //Change nextPiece X and Y for spawn
      this.game.nextPiece.testCollision = true;
      this.game.nextPiece.x =
        Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
      this.game.nextPiece.y = 0;
      //Swap In
      this.game.currentPiece = this.game.nextPiece;
      this.game.nextPiece = this.game.spawnPiece();
      //Change next Piece x and y for display
      if (
        this.game.nextPiece.shape.length === 1 &&
        this.game.nextPiece.shape[0].length > 1
      ) {
        this.game.nextPiece.testCollision = false;
        this.game.nextPiece.x *= 3.8;
        this.game.nextPiece.y = 2.8;
      } else {
        this.game.nextPiece.testCollision = false;
        this.game.nextPiece.x *= 3;
        this.game.nextPiece.y = 2.2;
      }

      if (this.y < 0 && this != this.game.currentPiece) {
        this.game.gameOver();
      }
    }

    this.increaseSpeed();
  }

  rotate() {
    const originalShape = this.shape;
    this.rotateSound.pause();
    this.rotateSound.currentTime = 0;
    this.rotateSound.play();
    this.shape = this.rotateMatrix(this.shape);
    if (this.collides()) {
      this.shape = originalShape;
    }
  }

  rotateMatrix(matrix) {
    const result = matrix[0]
      .map((_, i) => matrix.map((row) => row[i]))
      .reverse();
    return result;
  }

  collides() {
    if (this.testCollision == true) {
      for (let row = 0; row < this.shape.length; row++) {
        for (let col = 0; col < this.shape[row].length; col++) {
          if (
            this.shape[row][col] &&
            (this.y + row >= ROWS ||
              this.x + col < 0 ||
              this.x + col >= COLS ||
              this.y + row < 0 ||
              (this.x + col >= 0 &&
                this.game.landedTetriminoArr[this.y + row][this.x + col]))
          ) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  }

  increaseSpeed() {
    this.fallSpeed = this.game.fastFallSpeed; // Adjust the falling speed as needed
  }

  resetSpeed() {
    this.fallSpeed = this.game.defaultFallSpeed; // Reset to the original falling speed
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("tetrisCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.landedTetriminoArr = [];
    this.sprites = [];

    this.level = this.levelOne;

    this.levelOne = 1;
    this.levelTwo = 2;

    this.backgroundImage1 = new Image();
    this.backgroundImage1.src = "./assets/photos/wayBackground.png";

    this.backgroundImage = new Image();
    this.backgroundImage.src = "./assets/photos/background.png";
    this.backgroundSpeed = 1.5;
    this.backgroundY = 0;

    this.startScreenImage = new Image();
    this.startScreenImage.src = "./assets/photos/startScreen.png";

    this.gameOverImage = new Image();
    this.gameOverImage.src = "./assets/photos/loseScreen.png";

    this.stoppedImage = this.startScreenImage;

    this.controlsImage = new Image();
    this.controlsImage.src = "./assets/photos/controls.png";

    this.clearSound = new Audio("./assets/audio/clearRowSound.mp3");
    this.loseSound = new Audio("./assets/audio/loseSound.mp3");

    this.l1BackgroundMusic = new Audio("./assets/audio/bgMusic.mp3");
    this.l2BackgroundMusic = new Audio("./assets/audio/andrewStageMusic.mp3");

    this.l1BackgroundMusic.loop = true;
    this.l2BackgroundMusic.loop = true;

    this.l1BackgroundMusic.volume = 0.1;
    this.l2BackgroundMusic.volume = 0.1;

    this.backgroundMusic = this.l1BackgroundMusic;

    //Creates 2D Array
    for (let i = 0; i < ROWS; i++) {
      this.landedTetriminoArr.push(Array(COLS).fill(0));
    }

    this.startGame = false;
    this.currentPiece = this.spawnPiece();
    this.nextPiece = this.spawnPiece();
    //this.nextPiece.x *= 3;
    //this.nextPiece.y = 2.2;
    if (
      this.nextPiece.shape.length === 1 &&
      this.nextPiece.shape[0].length > 1
    ) {
      this.nextPiece.testCollision = false;
      this.nextPiece.x *= 3.8;
      this.nextPiece.y = 2.8;
    } else {
      this.nextPiece.testCollision = false;
      this.nextPiece.x *= 3;
      this.nextPiece.y = 2.2;
    }

    this.score = 0;
    this.gameOverScore = 0;
    this.isPaused = true;
    this.gameOver1 = false;
    this.lastTime = Date.now();
    this.defaultFallSpeed = 30;
    this.fastFallSpeed = 5;

    document.addEventListener("keydown", (event) => this.handleKeyPress(event));
    document.addEventListener("keyup", (event) => {
      if (event.code === "ArrowDown") {
        this.currentPiece.resetSpeed();
      }
    });
  }

  pushSprite(sprite) {
    this.sprites.push(sprite);
  }

  stopScreen() {
    switch (this.gameOver1) {
      case true:
        this.stoppedImage = this.gameOverImage;
        //Score
        break;

      case false:
        this.stoppedImage = this.startScreenImage;
        break;
    }
  }

  //Is this correct? this is the only logical way I found
  //As in the game class rather thane the TetrisPiece
  spawnPiece() {
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    const shape = PIECES[randomIndex];
    const color = this.getRandomColor();
    return new TetrisPiece(shape, color, this);
  }

  //Designed to generate colors in a color palette which contasts well with the background
  getRandomColor() {
    const baseColor = "#6A5ACD";
    const letters = "0123456789ABCDEF";
    let color = "#";

    for (let i = 0; i < 6; i++) {
      color += letters.includes(baseColor[i])
        ? letters[Math.floor(Math.random() * 6)]
        : letters[Math.floor(Math.random() * 10) + 6];
    }
    return color;
  }

  //Dr Should I move this to tetrisPiece Class?
  handleKeyPress(event) {
    switch (event.code) {
      case "ArrowUp":
        if (this.isPaused == false) this.currentPiece.rotate();
        break;
      case "ArrowDown":
        if (this.isPaused == false) this.currentPiece.movePieceDown();
        break;
      case "ArrowLeft":
        if (this.isPaused == false) this.currentPiece.moveLeft();
        break;
      case "ArrowRight":
        if (this.isPaused == false) this.currentPiece.moveRight();
        break;
      case "Space":
        if (this.isPaused == true) this.chooseLevel(this.levelOne);
        break;
      case "Digit1":
        if (this.isPaused == true) this.chooseLevel(this.levelOne);
        break;
      case "Digit2":
        if (this.isPaused == true) this.chooseLevel(this.levelTwo);
        break;
      case "KeyP":
        this.pause();
        break;
      case "KeyT":
        if (this.isPaused == true) this.chooseLevel(this.levelTwo);
        break;
    }
  }

  checkAndClearRows() {
    const clearedLines = this.checkClearedLines();
    if (clearedLines.length > 0) {
      this.clearLines(clearedLines);
      this.applyGravity();
    }
  }

  checkClearedLines() {
    const clearedLines = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.landedTetriminoArr[row].every((cell) => cell !== 0)) {
        clearedLines.push(row);
      }
    }
    return clearedLines;
  }

  applyGravity() {
    for (let col = 0; col < COLS; col++) {
      for (let row = ROWS - 2; row >= 0; row--) {
        if (this.landedTetriminoArr[row][col] !== 0) {
          let newRow = row + 1;
          while (newRow < ROWS && this.landedTetriminoArr[newRow][col] === 0) {
            this.landedTetriminoArr[newRow][col] =
              this.landedTetriminoArr[newRow - 1][col];
            this.landedTetriminoArr[newRow - 1][col] = 0;
            newRow++;
          }
        }
      }
    }
  }

  clearLines(clearedLines) {
    this.clearSound.pause();
    this.clearSound.currentTime = 0;
    this.clearSound.play();
    for (const row of clearedLines) {
      for (let col = 0; col < COLS; col++) {
        this.landedTetriminoArr[row][col] = 0;
      }
    }
    this.landedTetriminoArr.unshift(
      ...Array(clearedLines.length).fill(Array(COLS).fill(0))
    );
    this.score += 100 * clearedLines.length;
  }

  //Will be changed to screen this is for testing
  gameOver() {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    this.gameOverScore = this.score;
    this.loseSound.pause();
    this.loseSound.currentTime = 0;
    this.loseSound.play();

    this.isPaused = true;
    this.gameOver1 = true;
    //alert("Game Over! Your score: " + this.score);
    this.reset();
  }

  pause() {
    switch (this.isPaused) {
      case true:
        this.isPaused = false;
        this.backgroundMusic.play();
        break;

      case false:
        this.isPaused = true;
        this.backgroundMusic.pause();
        break;
    }
  }

  chooseLevel(levelChosen) {
    switch (levelChosen) {
      case this.levelOne:
        this.level = this.levelOne;
        this.isPaused = false;
        this.gameOver1 = false;

        this.backgroundMusic = this.l1BackgroundMusic;
        this.backgroundMusic.play();
        this.backgroundImage.src = "./assets/photos/background.png";
        break;

      case this.levelTwo:
        this.level = this.levelTwo;
        this.isPaused = false;
        this.gameOver1 = false;

        this.backgroundMusic = this.l2BackgroundMusic;
        this.backgroundMusic.play();
        this.backgroundImage.src = "./assets/photos/andrewStageBackground.jpg";
        break;

      default:
        this.level = this.levelOne;
        this.isPaused = false;
        this.gameOver1 = false;
        this.backgroundImage.src = "./assets/photos/background.png";
        break;
    }
  }

  update() {
    if (this.isPaused == false) {
      for (var i = 0; i < this.sprites.length; i++) {
        this.sprites[i].update();
      }
      this.currentPiece.update();
      this.checkAndClearRows();
    }

    switch (this.level) {
      case this.levelOne:
        this.defaultFallSpeed = 50;
        this.fastFallSpeed = 10;

        break;

      case this.levelTwo:
        this.defaultFallSpeed = 30;
        this.fastFallSpeed = 5;
        break;

      default:
        this.level = this.levelOne;
        break;
    }

    //this.backgroundY += this.backgroundSpeed;
    //if (this.backgroundY > this.canvas.height) this.backgroundY = 0;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isPaused == false) {
      this.drawGameAdditions();

      //Draw Next Tetrimino
      this.nextPiece.draw(this.ctx);

      //Current State Of the Game
      this.drawGameTetriminos();

      //Draw Current Piece
      this.currentPiece.draw(this.ctx);

      //Draw sprites in array
      for (var i = 0; i < this.sprites.length; i++) {
        this.sprites[i].draw(this.ctx);
      }
    } else {
      this.stopScreen();
      this.drawStopScreen();
    }
  }

  drawGameAdditions() {


    //Back Background
    this.ctx.drawImage(
      this.backgroundImage1,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    //Background
    this.ctx.drawImage(
      this.backgroundImage,
      0,
      this.backgroundY,
      COLS * CELL_SIZE + 3,
      this.canvas.height
    );

    this.ctx.drawImage(
      this.controlsImage,
      COLS * CELL_SIZE + 3,
      230,
      this.canvas.width - 300,
      this.canvas.height - COLS * CELL_SIZE
    );

    // Draw Line to separate play area and info
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(COLS * CELL_SIZE + 3, 0);
    this.ctx.lineTo(COLS * CELL_SIZE + 3, ROWS * CELL_SIZE);

    //Draw Score
    var currentStyle = this.ctx.fillStyle;
    this.ctx.fillStyle = "Black";
    this.ctx.fillText(`Your Score: ${this.score}`, COLS * CELL_SIZE + 35, 200);
    this.ctx.fillText(`Next Tetrimino:`, COLS * CELL_SIZE + 30, 40);
    this.ctx.fillStyle = currentStyle;
    this.ctx.lineWidth = 2;
    this.ctx.rect(COLS * CELL_SIZE + 30, 183, 85, 30);
    this.ctx.stroke();

    //Draw Next Tetrimino Box
    this.ctx.lineWidth = 4;
    this.ctx.rect(COLS * CELL_SIZE + 30, 50, 150, 100);
    this.ctx.stroke();
  }

  drawGameTetriminos() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cellColor = this.landedTetriminoArr[row][col];
        if (cellColor !== 0) {
          this.ctx.fillStyle = cellColor;
          this.ctx.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
  }

  drawStopScreen() {
    this.ctx.drawImage(
      this.stoppedImage,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    if (this.gameOver1 == true) {
      var currentFont = this.ctx.font;
      var currentStyle = this.ctx.fillStyle;
      this.ctx.fillStyle = "White";
      this.ctx.font = "40px Verdana";
      this.ctx.fillText(
        `Your Score: ${this.gameOverScore}`,
        this.canvas.width / 2 - 160,
        this.canvas.height - 50
      );
      this.ctx.fillStyle = currentStyle;
      this.ctx.lineWidth = 2;
      this.ctx.rect(COLS * CELL_SIZE + 30, 183, 85, 30);
      this.ctx.font = currentFont;
    }
  }

  animate() {
    const now = Date.now();
    const elapsed = now - this.lastTime;
    //For 60FPS
    if (elapsed > 16.67) {
      this.update();
      this.draw();
      this.lastTime = now;
    }

    requestAnimationFrame(() => this.animate());
  }

  reset() {
    this.clearlandedTetriminoArr();
    this.resetGameState();
    this.animate();
  }

  clearlandedTetriminoArr() {
    // Clear the landedTetriminoArr array
    for (let i = 0; i < ROWS; i++) {
      this.landedTetriminoArr[i].fill(0);
    }
  }

  resetGameState() {
    // Reset other game state variables
    this.score = 0;
    this.isPaused = true;
    this.startGame = false;
    this.currentPiece = this.spawnPiece();
    this.nextPiece = this.spawnPiece();
    this.nextPiece.x *= 3;
    this.nextPiece.y = 2.2;
    this.defaultFallSpeed = 30;
    this.fastFallSpeed = 5;
  }
}

const game = new Game();
this.man = new Man(380, 160, this.canvas, 160);
game.pushSprite(man);
game.stopScreen();
game.animate();
