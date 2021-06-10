const paddleCanvas = document.querySelector("#paddle-layer");
const ballCanvas = document.querySelector("#ball-layer");
const itfCanvas = document.querySelector("#interface-layer");

const paddleLayer = paddleCanvas.getContext("2d"); // paddle, scoreBoard
const ballLayer = ballCanvas.getContext("2d"); // ball
const itfLayer = itfCanvas.getContext("2d"); // mainMenu, pauseMenu

const CVS_WIDTH = parseInt(paddleCanvas.getAttribute("width"));
const CVS_HEIGHT = parseInt(paddleCanvas.getAttribute("height"));

const player1Key = [];
const player2Key = [];
const ballArr = [];

let isInGame = false; // 이후 pause 구현시
let isMatchEnd = false;

class OriginalMode {
  constructor(ballList, leftPaddle, rightPaddle, scoreBoard) {
    this.ballList = ballList;
    this.leftPaddle = leftPaddle;
    this.rightPaddle = rightPaddle;
    this.scoreBoard = scoreBoard;

    this.mainLoopId = null;
    this.init();
  }

  init() {
    this.main();
  }

  main() {
    let ball = this.ballList[0];

    switch (ball.gamePhase) {
      case 0:
        this.respawnPhase(ball);
        break;
      case 2:
        this.gameStart(ball);
        break;
      case 4:
        this.initPhase(ball);
        break;

      default:
        break;
    }

    this.mainLoopId = requestAnimationFrame(this.main.bind(this));
  }

  setBallInitPos(ball, initXPos, initYPos) {
    const isInXRange = initXPos >= 0 && initXPos <= CVS_WIDTH - ball.width;
    const isInYRange = initYPos >= 0 && initYPos <= CVS_HEIGHT - ball.height;
    if (!isInXRange || !isInYRange) {
      console.error("initPos must be in canvas range.");
      return;
    }

    ball.initXPos = initXPos;
    ball.initYPos = initYPos;
  }

  initPhase(ball) {
    ball.gamePhase = 0;
  }

  respawnPhase(ball) {
    ball.gamePhase = 1;
    ball.blink();
    this.scoreBoard.updateBoard();
  }

  gameStart(ball) {
    ball.gamePhase = 3;
    isInGame = true;

    ball.start();
  }
}

class ManyBallsMode extends OriginalMode {
  constructor(ballList, leftPaddle, rightPaddle, scoreBoard) {
    super(ballList, leftPaddle, rightPaddle, scoreBoard);

    this.twoBallModeScore = 2;
    this.threeBallModeScore = 5;
    this.fourBallModeScore = 8;
  }

  init() {
    this.scoreBoard.setMatchEndScore(12);
    let ball;
    for (let i = 0; i < this.ballList.length; i++) {
      ball = this.ballList[i];
      switch (i) {
        case 0:
          // oneBallMode에서 중심 위치 유지. twoBallMode부터 변경.
          break;
        case 1:
          this.setBallInitPos(ball, 550, CVS_HEIGHT / 2 - ball.height / 2);
          break;
        case 2:
          this.setBallInitPos(
            ball,
            CVS_WIDTH / 2 - ball.width / 2,
            150 - ball.height
          );
          break;
        case 3:
          this.setBallInitPos(ball, CVS_WIDTH / 2 - ball.width / 2, 450);
          break;
        default:
          break;
      }
    }

    this.main();
  }

  main() {
    let ball;

    const isTwoBallMode =
      this.scoreBoard.leftScore >= this.twoBallModeScore ||
      this.scoreBoard.rightScore >= this.twoBallModeScore;
    const isThreeBallMode =
      this.scoreBoard.leftScore >= this.threeBallModeScore ||
      this.scoreBoard.rightScore >= this.threeBallModeScore;
    const isFourBallMode =
      this.scoreBoard.leftScore >= this.fourBallModeScore ||
      this.scoreBoard.rightScore >= this.fourBallModeScore;

    for (let i = 0; i < this.ballList.length; i++) {
      ball = this.ballList[i];

      if (!isTwoBallMode && i >= 1) {
        continue;
      }
      if (!isThreeBallMode && i >= 2) {
        continue;
      }
      if (!isFourBallMode && i >= 3) {
        continue;
      }

      if (isTwoBallMode && this.ballList.length >= 2) {
        if (i === 0) {
          this.setBallInitPos(
            ball,
            250 - ball.width,
            CVS_HEIGHT / 2 - ball.height / 2
          );
        }
      }

      switch (ball.gamePhase) {
        case 0:
          this.respawnPhase(ball);
          break;
        case 2:
          this.gameStart(ball);
          break;
        case 4:
          this.initPhase(ball);
          break;

        default:
          break;
      }
    }
    this.mainLoopId = requestAnimationFrame(this.main.bind(this));
  }
}

class ScoreBoard {
  constructor() {
    this.textSize = "100px";
    this.font = "sans-serif";

    this.leftScore = 0;
    this.rightScore = 0;
    this.matchEndScore = 5;

    this.xPos = CVS_WIDTH / 2;
    this.yPos = CVS_HEIGHT / 2;

    this.sounds = {
      matchEnd: new Audio("./soundEffect/MatchEnd.wav"),
    };
  }

  setMatchEndScore(value) {
    this.matchEndScore = value;
  }

  addScore(winner) {
    if (winner === "left") {
      this.leftScore += 1;
    } else if (winner === "right") {
      this.rightScore += 1;
    } else {
      return false;
    }
  }

  checkMatchResult() {
    const isLeftWinner = this.leftScore === this.matchEndScore;
    const isRightWinner = this.rightScore === this.matchEndScore;

    if (isLeftWinner || isRightWinner) {
      this.sounds.matchEnd.play();
      return isLeftWinner ? "Left player" : "Right player";
    } else {
      return false;
    }
  }

  updateBoard() {
    this.clearBoard();
    this.drawScore();
  }

  clearBoard() {
    paddleLayer.font = `${this.textSize} ${this.font}`;
    const metric = paddleLayer.measureText(
      `${this.leftScore}      ${this.rightScore}`
    );
    const textSize = parseInt(this.textSize.slice(0, 3));

    const PADDING = 20;
    paddleLayer.clearRect(
      this.xPos - metric.width / 2 - PADDING,
      this.yPos - textSize / 2 - PADDING,
      metric.width + PADDING * 2,
      textSize + 20
    );
  }

  drawScore() {
    paddleLayer.font = `${this.textSize} ${this.font}`;
    paddleLayer.textBaseline = "middle";
    paddleLayer.textAlign = "center";
    paddleLayer.fillStyle = "rgba(0, 0, 0, 0.2)";
    paddleLayer.fillText(
      `${this.leftScore}      ${this.rightScore}`,
      this.xPos,
      this.yPos
    );
  }

  drawMatchWinner(winner) {
    const textSize = "50px";
    paddleLayer.font = `${textSize} ${this.font}`;
    paddleLayer.fillStyle = "rgba(0, 0, 0, 0.8)";
    paddleLayer.fillText(`${winner} wins!`, this.xPos, this.yPos + 200);
  }
}

class Ball {
  constructor(leftPaddle, rightPaddle, scoreBoard) {
    this.leftPaddle = leftPaddle;
    this.rightPaddle = rightPaddle;
    this.scoreBoard = scoreBoard;

    this.width = 20;
    this.height = 20;

    this.xPos = 0;
    this.yPos = 0;
    this.initXPos = null;
    this.initYPos = null;

    this.speed = 0;
    this.initSpeed = 6;

    this.acceleration = 1;
    this.accelCycle = 1;
    this.bounceCount = 0;
    this.angle = 0;

    this.color = "#4BA68C";

    this.inGameLoopId;

    this.lastHitObject = null;
    this.lastHitPaddle = null;
    this.isDrop = false;

    this.drawForBlink = false;
    this.blinkId;

    this.gamePhase = 0;
    // 0 : init
    // 1 : respawnPhase
    // 2 : respawnEnd
    // 3 : gameStart
    // 4 : gameEnd

    this.sounds = {
      paddleFaceBounce: new Audio("./soundEffect/PaddleFaceBounce.wav"),
      paddleEdgeBounce: new Audio("./soundEffect/PaddleEdgeBounce.wav"),
      hitWall: new Audio("./soundEffect/WallBounce.wav"),
      hitWallSpare: new Audio("./soundEffect/WallBounce.wav"),
      respawn: new Audio("./soundEffect/Respawn.wav"),
      drop: new Audio("./soundEffect/drop.wav"),
    };
  }

  start() {
    if (this.initXPos === null && this.initYPos === null) {
      this.setBallLocation();
    } else {
      this.setBallLocation(this.initXPos, this.initYPos);
    }
    this.setBallSpeed(this.initSpeed);
    this.lastHitObject = null;
    this.lastHitPaddle = null;
    this.bounceCount = 0;

    if (this.isDrop === false) {
      const randomDirect = Math.floor(Math.random() * 10) % 2;
      if (randomDirect === 1) {
        this.setBallAngle(0);
      } else {
        this.setBallAngle(180);
      }
    } else {
      if (this.isDrop === "left") {
        this.setBallAngle(0);
      } else {
        this.setBallAngle(180);
      }
    }

    this.move();
  }

  setBallLocation(
    xPos = CVS_WIDTH / 2 - this.width / 2,
    yPos = CVS_HEIGHT / 2 - this.height / 2
  ) {
    this.xPos = xPos;
    this.yPos = yPos;
  }

  setBallAngle(angle) {
    if (angle < -360 || angle > 360) {
      console.error("BallAngle must be -360 ~ 360.");
      return;
    }
    this.angle = angle;
  }

  setBallSpeed(speed) {
    this.speed = speed;
  }

  sayWhereIAm() {
    console.log(this.xPos + ", " + this.yPos);
  }

  clearBall() {
    ballLayer.clearRect(this.xPos, this.yPos, this.width, this.height);
  }

  drawBall() {
    ballLayer.beginPath();
    ballLayer.fillStyle = this.color;
    ballLayer.rect(
      this.xPos + 1,
      this.yPos + 1,
      this.width - 2,
      this.height - 2
    );
    ballLayer.fill();
    ballLayer.closePath();
  }

  getTrigonWithAngle(angle) {
    // angle 계산 방향이 역방향이라 마이너스 처리.
    const xcos = Math.cos((Math.PI / 180) * -angle);
    const ysin = Math.sin((Math.PI / 180) * -angle);

    return {
      xcos,
      ysin,
    };
  }

  getTan(angle) {
    return Math.tan((Math.PI / 180) * angle);
  }

  hitObject(posListBetweenNextPos, object) {
    let restHeight;
    let restWidth;
    const tan = this.getTan(this.angle);

    let hitBallTop = false;
    let hitBallBottom = false;
    let hitBallLeft = false;
    let hitBallRight = false;
    for (let i = 0; i < posListBetweenNextPos.length; i++) {
      hitBallTop =
        posListBetweenNextPos[i].y <= object.bottomSideYpos &&
        object.bottomSideYpos !== null;
      hitBallBottom =
        posListBetweenNextPos[i].y + this.height >= object.topSideYpos &&
        object.topSideYpos !== null;
      hitBallLeft =
        posListBetweenNextPos[i].x <= object.rightSideXpos &&
        object.rightSideXpos !== null;
      hitBallRight =
        posListBetweenNextPos[i].x + this.width >= object.leftSideXpos &&
        object.leftSideXpos !== null;

      if (hitBallTop || hitBallBottom || hitBallLeft || hitBallRight) {
        break;
      }
    }

    // 블록 아랫면, 공 윗면 충돌처리.
    if (hitBallTop && object.bottomSideYpos !== null) {
      restHeight = this.yPos - object.bottomSideYpos;
      this.setBallLocation(this.xPos + restHeight / tan, object.bottomSideYpos);
      // 밑변(x) = 높이 / tan(angle)
      this.horizontalBounce();
      this.lastHitObject = object.objectName;
      this.soundPlay("wall");
      return true;
    } //블록 윗면, 공 아랫면 충돌처리.
    else if (hitBallBottom && object.topSideYpos !== null) {
      restHeight = object.topSideYpos - (this.yPos + this.height);
      this.setBallLocation(
        this.xPos + restHeight / -tan,
        object.topSideYpos - this.height
      );
      this.horizontalBounce();
      this.lastHitObject = object.objectName;
      this.soundPlay("wall");
      return true;
    } // 블록 오른쪽면, 공 왼쪽면 충돌처리.
    else if (hitBallLeft && object.rightSideXpos !== null) {
      restWidth = this.xPos - object.rightSideXpos;
      this.setBallLocation(object.rightSideXpos, this.yPos + restWidth * tan);
      // 높이 = 밑변 * tan(angle)
      this.verticalBounce();
      this.lastHitObject = object.objectName;
      this.soundPlay("wall");
      return true;
    } // 블록 왼쪽면, 공 오른쪽면 충돌처리.
    else if (hitBallRight && object.leftSideXpos !== null) {
      restWidth = object.leftSideXpos - (this.xPos + this.width);
      this.setBallLocation(
        object.leftSideXpos - this.width,
        this.yPos + restWidth * -tan
      );
      this.verticalBounce();
      this.lastHitObject = object.objectName;
      this.soundPlay("wall");
      return true;
    }

    return false;
  }

  hitPaddle(posListBetweenNextPos) {
    let isLeft;
    let isInPaddleXRange = false;

    const rightPaddleFloorXpos = rightPaddle.leftFace;
    const leftPaddleFloorXpos = leftPaddle.rightFace;
    const tan = this.getTan(this.angle);

    // X범위 검사
    for (let i = 0; i < posListBetweenNextPos.length; i++) {
      if (
        posListBetweenNextPos[i].x <= leftPaddleFloorXpos &&
        posListBetweenNextPos[i].x + this.width > leftPaddle.xPos
      ) {
        isInPaddleXRange = true;
        isLeft = true;
        break;
      } else if (
        posListBetweenNextPos[i].x + this.width >= rightPaddleFloorXpos &&
        posListBetweenNextPos[i].x < rightPaddle.xPos + rightPaddle.thickness
      ) {
        isInPaddleXRange = true;
        isLeft = false;
        break;
      } else {
        continue;
      }
    }

    if (!isInPaddleXRange) {
      return false;
    }

    const isDuplHit = isLeft
      ? this.lastHitObject === "leftPaddle"
      : this.lastHitObject === "rightPaddle";
    if (isDuplHit) {
      return false;
    }

    // Y범위 검사
    let isInPaddleYRange = false;
    let isBallBottomInPaddleRange = false;
    let isBallTopInPaddleRange = false;
    for (let i = 0; i < posListBetweenNextPos.length; i++) {
      isBallBottomInPaddleRange =
        posListBetweenNextPos[i].y + this.height >=
          (isLeft ? leftPaddle.yPos : rightPaddle.yPos) &&
        posListBetweenNextPos[i].y + this.height <=
          (isLeft
            ? leftPaddle.yPos + leftPaddle.length
            : rightPaddle.yPos + rightPaddle.length);
      isBallTopInPaddleRange =
        posListBetweenNextPos[i].y <=
          (isLeft
            ? leftPaddle.yPos + leftPaddle.length
            : rightPaddle.yPos + rightPaddle.length) &&
        posListBetweenNextPos[i].y >=
          (isLeft ? leftPaddle.yPos : rightPaddle.yPos);
      if (isBallBottomInPaddleRange || isBallTopInPaddleRange) {
        isInPaddleYRange = true;
        break;
      }
    }

    if (!isInPaddleYRange) {
      return false;
    }

    const rangeAndAngle = isLeft
      ? leftPaddle.getPaddleRange()
      : rightPaddle.getPaddleRange();
    const rangeList = rangeAndAngle.rangeList;
    const angleList = rangeAndAngle.angleList;

    // 앞면 히트 여부 검사
    let isHitPaddleFace = false;

    const checkPaddle = isLeft ? leftPaddle : rightPaddle;
    const checkPaddleXposFloor = isLeft
      ? checkPaddle.rightFace
      : checkPaddle.leftFace;
    const checkBallXposToPaddle = isLeft ? this.xPos : this.xPos + this.width;
    const restWidth = isLeft
      ? checkBallXposToPaddle - checkPaddleXposFloor
      : checkPaddleXposFloor - checkBallXposToPaddle;

    const checkFloorResultXpos = isLeft
      ? checkPaddleXposFloor
      : checkPaddleXposFloor - this.width;
    const checkFloorResultYpos = isLeft
      ? this.yPos + restWidth * tan
      : this.yPos + restWidth * -tan;

    isHitPaddleFace =
      checkFloorResultYpos + this.height > checkPaddle.topFace &&
      checkFloorResultYpos < checkPaddle.bottomFace;

    if (isHitPaddleFace) {
      this.setBallLocation(checkFloorResultXpos, checkFloorResultYpos);
      this.lastHitObject = isLeft ? "leftPaddle" : "rightPaddle";
      this.lastHitPaddle = isLeft ? "leftPaddle" : "rightPaddle";
      this.fasterByBouncing();
      const hitPoint = this.yPos + this.height / 2;
      this.soundPlay("paddleFace");

      let result = false;
      switch (true) {
        // 패들 가장 양 끝 부분은 hitPoint(공 중심)뿐만 아니라 공의 끝부분이 패들 끝에 걸치기만해도 튕겨질 수 있도록 함.
        // 패들 양 끝처리 조건이 제일 우선순위가 낮게 하기 위해 맨 위쪽 처리 case를 맨 아래로 위치시킴.

        case hitPoint >= rangeList[1] && hitPoint < rangeList[2]:
          this.setBallAngle(isLeft ? angleList[4] : 180 - angleList[4]);
          result = true;
          break;

        case hitPoint >= rangeList[2] && hitPoint < rangeList[3]:
          this.setBallAngle(isLeft ? angleList[3] : 180 - angleList[3]);
          result = true;
          break;

        case hitPoint >= rangeList[3] && hitPoint < rangeList[4]:
          this.setBallAngle(isLeft ? angleList[2] : 180 - angleList[2]);
          result = true;
          break;

        case hitPoint >= rangeList[4] && hitPoint < rangeList[5]:
          this.setBallAngle(isLeft ? angleList[1] : 180 - angleList[1]);
          result = true;
          break;

        case hitPoint >= rangeList[5] && hitPoint < rangeList[6]:
          this.setBallAngle(isLeft ? angleList[0] : 180 - angleList[0]);
          result = true;
          break;

        case hitPoint >= rangeList[6] && hitPoint < rangeList[7]:
          this.setBallAngle(isLeft ? -angleList[0] : 180 + angleList[0]);
          result = true;
          break;

        case hitPoint >= rangeList[7] && hitPoint < rangeList[8]:
          this.setBallAngle(isLeft ? -angleList[1] : 180 + angleList[1]);
          result = true;
          break;

        case hitPoint >= rangeList[8] && hitPoint < rangeList[9]:
          this.setBallAngle(isLeft ? -angleList[2] : 180 + angleList[2]);
          result = true;
          break;

        case hitPoint >= rangeList[9] && hitPoint < rangeList[10]:
          this.setBallAngle(isLeft ? -angleList[3] : 180 + angleList[3]);
          result = true;
          break;

        case hitPoint >= rangeList[10] && hitPoint < rangeList[11]:
          this.setBallAngle(isLeft ? -angleList[4] : 180 + angleList[4]);
          result = true;
          break;

        case (hitPoint >= rangeList[0] && hitPoint < rangeList[1]) ||
          (hitPoint + this.height / 2 >= rangeList[0] &&
            hitPoint + this.height / 2 <= rangeList[0] + this.height):
          this.setBallAngle(isLeft ? angleList[5] : 180 - angleList[5]);
          result = true;
          break;

        case (hitPoint >= rangeList[11] && hitPoint < rangeList[12]) ||
          (hitPoint - this.height / 2 <= rangeList[12] &&
            hitPoint - this.height / 2 >= rangeList[12] - this.height):
          this.setBallAngle(isLeft ? -angleList[5] : 180 + angleList[5]);
          result = true;
          break;
        default:
          result = false;
      }
      return result;
    }

    // 엣지여부 검사
    let isHitEdgeSafe = false;
    let isHitEdgeOut = false;

    let isBallGoToBottom =
      (this.angle < 0 && this.angle > -180) ||
      (this.angle > 180 && this.angle < 360);
    let isBallGoToTop =
      (this.angle > 0 && this.angle < 180) ||
      (this.angle < -180 && this.angle > -360);

    const checkPaddleYpos = isBallGoToTop
      ? checkPaddle.yPos + checkPaddle.length
      : checkPaddle.yPos;
    const checkPaddleXposCenter = checkPaddle.xPos + checkPaddle.thickness / 2;
    const checkBallYposToPaddle = isBallGoToTop
      ? this.yPos
      : this.yPos + this.height;
    const restHeight = isBallGoToTop
      ? checkBallYposToPaddle - checkPaddle.bottomFace
      : checkPaddle.topFace - checkBallYposToPaddle;

    const checkEdgeResultXpos = isBallGoToTop
      ? this.xPos + restHeight / tan
      : this.xPos + restHeight / -tan;
    const checkEdgeResultYpos = isBallGoToTop
      ? checkPaddleYpos
      : checkPaddleYpos - this.height;
    const checkEdgeResultXposCenter = checkEdgeResultXpos + this.width / 2;

    if (isLeft) {
      isHitEdgeSafe =
        checkEdgeResultXposCenter >= checkPaddleXposCenter &&
        checkEdgeResultXpos <= checkPaddleXposFloor;
      isHitEdgeOut =
        checkEdgeResultXposCenter < checkPaddleXposCenter &&
        checkEdgeResultXpos + this.width >= checkPaddle.xPos;
    } else {
      isHitEdgeSafe =
        checkEdgeResultXposCenter <= checkPaddleXposCenter &&
        checkEdgeResultXpos + this.width >= checkPaddleXposFloor;
      isHitEdgeOut =
        checkEdgeResultXposCenter > checkPaddleXposCenter &&
        checkEdgeResultXpos <= checkPaddle.xPos + checkPaddle.thickness;
    }

    if (isHitEdgeSafe) {
      this.setBallLocation(checkEdgeResultXpos, checkEdgeResultYpos);
      this.lastHitObject = isLeft ? "leftPaddle" : "rightPaddle";
      this.lastHitPaddle = isLeft ? "leftPaddle" : "rightPaddle";
      this.fasterByBouncing();
      if (isBallGoToTop) {
        this.setBallAngle(isLeft ? -angleList[5] : 180 + angleList[5]);
      } else {
        this.setBallAngle(isLeft ? angleList[5] : 180 - angleList[5]);
      }
      this.soundPlay("paddleEdge");

      return true;
    } else if (isHitEdgeOut) {
      this.setBallLocation(checkEdgeResultXpos, checkEdgeResultYpos);
      this.lastHitObject = isLeft ? "leftPaddle" : "rightPaddle";
      this.lastHitPaddle = isLeft ? "leftPaddle" : "rightPaddle";
      this.fasterByBouncing();
      this.setBallAngle(-1 * this.angle);
      this.soundPlay("paddleEdge");

      return true;
    }

    return false;
  }

  checkDrop() {
    const isOverLeft = this.xPos + this.width < 0;
    const isOverRight = this.xPos > CVS_WIDTH;

    if (isOverLeft) {
      return "left";
    } else if (isOverRight) {
      return "right";
    } else {
      return false;
    }
  }

  move() {
    if (!isInGame) {
      return;
    }

    if (isMatchEnd) {
      return;
    }

    this.clearBall();
    const trigon = this.getTrigonWithAngle(this.angle);
    const nextXpos = this.xPos + this.speed * trigon.xcos;
    const nextYpos = this.yPos + this.speed * trigon.ysin;

    const posListBetweenNextPos = [];
    let btwX;
    let btwY;

    for (
      let i = this.acceleration;
      i <= this.speed;
      i = i + this.acceleration
    ) {
      btwX = this.xPos + i * trigon.xcos;
      btwY = this.yPos + i * trigon.ysin;
      posListBetweenNextPos.push({ x: btwX, y: btwY });
    }

    const wall = {
      topSideYpos: CVS_HEIGHT,
      bottomSideYpos: 0,
      leftSideXpos: null,
      rightSideXpos: null,
      objectName: "wall",
    };

    const isHit =
      this.hitObject(posListBetweenNextPos, wall) ||
      this.hitPaddle(posListBetweenNextPos);

    if (!isHit) {
      this.setBallLocation(nextXpos, nextYpos);
    }

    this.drawBall();

    this.isDrop = this.checkDrop();
    if (this.isDrop) {
      this.inGameLoopStop();
      this.calcPoint(this.isDrop);

      return;
    }

    this.inGameLoopId = requestAnimationFrame(this.move.bind(this));
  }

  calcPoint(whereDrop) {
    this.scoreBoard.addScore(this.isDrop === "left" ? "right" : "left");

    const matchWinner = this.scoreBoard.checkMatchResult();
    if (matchWinner) {
      this.scoreBoard.drawMatchWinner(matchWinner);
      this.scoreBoard.updateBoard();
      isMatchEnd = true;
      return;
    }

    this.soundPlay("drop");
    this.scoreBoard.updateBoard();
    setTimeout(() => {
      this.gamePhase = 4;
    }, 1300);
    return;
  }

  inGameLoopStop() {
    cancelAnimationFrame(this.inGameLoopId);
  }

  horizontalBounce() {
    this.setBallAngle(-1 * this.angle);
    this.fasterByBouncing();
  }

  verticalBounce() {
    this.setBallAngle(180 - this.angle);
    this.fasterByBouncing();
  }

  fasterByBouncing() {
    this.bounceCount += 1;

    if (this.bounceCount % this.accelCycle === 0) {
      this.setBallSpeed(this.speed + this.acceleration);
    }
  }

  stopBlink() {
    clearInterval(this.blinkId);
    this.gamePhase = 2;
  }

  blink() {
    if (isMatchEnd) {
      return;
    }

    if (this.initXPos === null && this.initYPos === null) {
      this.setBallLocation();
    } else {
      this.setBallLocation(this.initXPos, this.initYPos);
    }

    this.blinkId = setInterval(this.blinkToggle.bind(this), 200);
    this.soundPlay("respawn");

    setTimeout(this.stopBlink.bind(this), 2000);
    return;
  }

  blinkToggle() {
    if (!this.drawForBlink) {
      this.drawBall();
      this.drawForBlink = true;
    } else {
      this.clearBall();
      this.drawForBlink = false;
    }
  }

  soundPlay(sound) {
    switch (sound) {
      case "wall":
        if (!this.sounds.hitWall.ended) {
          this.sounds.hitWallSpare.play();
          break;
        }
        this.sounds.hitWall.play();
        break;
      case "paddleFace":
        this.sounds.paddleFaceBounce.play();
        break;
      case "paddleEdge":
        this.sounds.paddleEdgeBounce.play();
        break;
      case "respawn":
        this.sounds.respawn.play();
        break;
      case "drop":
        this.sounds.drop.play();
        break;
      default:
        break;
    }
  }
}

class Paddle {
  constructor(dircetion, upKey, downKey) {
    this.length = 100;
    this.thickness = 10;
    this.direction = dircetion;

    this.xPos = 0;
    this.yPos = 0;
    this.setPaddleLocation();

    this.topFace = this.yPos;
    this.bottomFace = this.yPos + this.length;
    this.leftFace = this.xPos;
    this.rightFace = this.xPos + this.thickness;

    this.speed = 10;
    this.color = "#37748C";
    this.drawPaddle();
    this.inGameLoopId;
    this.isInputedKey = false;
    this.inputedKey;
    this.control = {
      upKey: upKey,
      downKey: downKey,
    };
  }

  setPaddleLocation(yPos = CVS_HEIGHT / 2 - this.length / 2) {
    if (this.direction === "left") {
      this.xPos = 0;
    } else if (this.direction === "right") {
      this.xPos = CVS_WIDTH - this.thickness;
    }
    this.yPos = yPos;

    this.topFace = yPos;
    this.bottomFace = yPos + this.length;
  }

  getPaddleRange() {
    //각도 10 24 38 52 66 80
    const angleList = [];
    const rangeDivNum = 6; // 패들 절반 범위 분할 수. 총 rangeDivNum *2 분할
    const maxAngle = 80; // 0 < angle < 90
    const minAngle = 10;
    for (let i = 0; i < rangeDivNum; i++) {
      angleList.push(
        (maxAngle - minAngle) * (i / (rangeDivNum - 1)) + minAngle
      );
    }

    const rangeList = [this.yPos];
    const totalDivNum = rangeDivNum * 2;
    for (let i = 1; i <= totalDivNum; i++) {
      rangeList.push(this.yPos + this.length * (i / totalDivNum));
    }

    return { rangeList, angleList };
  }

  drawPaddle() {
    paddleLayer.beginPath();
    paddleLayer.fillStyle = this.color;
    paddleLayer.rect(this.xPos, this.yPos, this.thickness, this.length);
    paddleLayer.fill();
    paddleLayer.closePath();
  }

  clearPaddle() {
    paddleLayer.clearRect(
      this.xPos,
      this.yPos - 1,
      this.thickness,
      this.length + 2
    );
  }

  moveUp() {
    if (this.yPos <= 0) {
      return;
    }

    this.clearPaddle();

    const nextYpos = this.yPos - this.speed;
    if (nextYpos <= 0) {
      this.setPaddleLocation(0);
    } else {
      this.setPaddleLocation(nextYpos);
    }
    this.drawPaddle();
    this.inGameLoopId = requestAnimationFrame(this.moveUp.bind(this));
  }

  moveDown() {
    if (this.yPos >= CVS_HEIGHT - this.length) {
      return;
    }

    this.clearPaddle();

    const nextYpos = this.yPos + this.speed;
    if (nextYpos >= CVS_HEIGHT - this.length) {
      this.setPaddleLocation(CVS_HEIGHT - this.length);
    } else {
      this.setPaddleLocation(nextYpos);
    }
    this.drawPaddle();
    this.inGameLoopId = requestAnimationFrame(this.moveDown.bind(this));
  }

  inGameLoopStop() {
    cancelAnimationFrame(this.inGameLoopId);
  }

  keyDown(Key) {
    if (this.inputedKey === Key) {
      return;
    }
    if (this.isInputedKey === true) {
      this.inGameLoopStop();
    }
    this.isInputedKey = true;
    this.inputedKey = Key;

    switch (Key) {
      case this.control.upKey:
        this.moveUp();
        break;

      case this.control.downKey:
        this.moveDown();
        break;

      default:
        break;
    }
  }

  keyUp() {
    this.isInputedKey = false;
    this.inputedKey = null;
    this.inGameLoopStop();
  }
}

const leftPaddle = new Paddle("left", "w", "s");
const rightPaddle = new Paddle("right", "ArrowUp", "ArrowDown"); //"ArrowUp", "ArrowDown"

const scoreBoard = new ScoreBoard();
const ballNum = 4; // 0 ~ 4
for (let i = 0; i < ballNum; i++) {
  ballArr.push(new Ball(leftPaddle, rightPaddle, scoreBoard));
}

const gameMode = new ManyBallsMode(
  ballArr,
  leftPaddle,
  rightPaddle,
  scoreBoard
);

function keyArrayPush(keyArray, key, paddle) {
  let find = false;
  let keyObj;
  for (keyObj in paddle.control) {
    if (key === paddle.control[keyObj]) {
      find = true;
      break;
    }
  }
  if (find) {
    if (keyArray.indexOf(key) === -1) {
      keyArray.push(key);
    }
    paddle.keyDown(keyArray[keyArray.length - 1]);
  }
}

function keyArrayRemove(keyArray, key, paddle) {
  let findKeyInPaddle = false;
  let findKeyInArray;
  let keyObj;
  for (keyObj in paddle.control) {
    if (key === paddle.control[keyObj]) {
      findKeyInPaddle = true;
      break;
    }
  }
  if (findKeyInPaddle) {
    findKeyInArray = keyArray.indexOf(key);
    if (findKeyInArray > -1) {
      keyArray.splice(findKeyInArray, 1);
    }
  }
  if (keyArray.length === 0) {
    paddle.keyUp();
  } else {
    paddle.keyDown(keyArray[keyArray.length - 1]);
  }
}

function handleKeyDown(e) {
  keyArrayPush(player1Key, e.key, leftPaddle);
  keyArrayPush(player2Key, e.key, rightPaddle);
}

function handleKeyUp(e) {
  keyArrayRemove(player1Key, e.key, leftPaddle);
  keyArrayRemove(player2Key, e.key, rightPaddle);
}

function init() {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

init();
