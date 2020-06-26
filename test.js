var sw = 10,
  sh = 10,
  tr = 50,
  td = 50;

var snake = null,
  food = null,
  game = null; //食物的实例

function Square(x, y, classname) {
  this.x = x * sw;
  this.y = y * sh;
  this.class = classname;
  this.viewcontent = document.createElement("div"); //方块对应的DOM
  this.viewcontent.className = this.class;
  this.parent = document.querySelector(".snakeWrap"); //方块的父级
}
Square.prototype.create = function () {
  this.viewcontent.style.position = "absolute";
  this.viewcontent.style.width = sw + "px";
  this.viewcontent.style.height = sh + "px";
  this.viewcontent.style.left = this.x + "px";
  this.viewcontent.style.top = this.y + "px";
  this.parent.appendChild(this.viewcontent);
};
Square.prototype.remove = function () {
  this.parent.removeChild(this.viewcontent);
};

//she
function Snake() {
  this.head = null; //存一下蛇头的信息
  this.tail = null; //蛇尾的信息
  this.pos = []; //详细蛇的每一个方块
  this.directionNum = {
    left: {
      x: -1,
      y: 0,
    },
    right: {
      x: 1,
      y: 0,
    },
    up: {
      x: 0,
      y: -1,
    },
    down: {
      x: 0,
      y: 1,
    },
  };
}

Snake.prototype.init = function () {
  //创建蛇头
  var snakeHead = new Square(2, 0, "snakeHead");
  snakeHead.create();
  this.head = snakeHead;
  this.pos.push([2, 0]);

  //she身体
  var snakeBody1 = new Square(1, 0, "snakebody");
  snakeBody1.create();
  this.pos.push([1, 0]);

  var snakeBody2 = new Square(0, 0, "snakebody");
  snakeBody2.create();
  this.tail = snakeBody2; //把蛇尾的信息存起来
  this.pos.push([0, 0]);

  //形成链表关系
  snakeHead.last = null;
  snakeHead.next = snakeBody1;

  snakeBody1.last = snakeHead;
  snakeBody1.next = snakeBody2;

  snakeBody2.last = snakeBody1;
  snakeBody2.next = null;

  //给蛇添加一条属性，用来表示蛇走的方向
  this.direction = this.directionNum.right;
};

//这个方法用来获取蛇头下一个位置对应元素，根据元素做不同的时期
Snake.prototype.getNextPos = function () {
  var nextPos = [
    //蛇头要走的下一个点的坐标
    this.head.x / sw + this.direction.x,
    this.head.y / sh + this.direction.y,
  ];
  //下个点是自己，代表撞到了自己，游戏结束
  var selfcollied = false;
  this.pos.forEach(function (value) {
    if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
      selfcollied = true;
    }
  });
  if (selfcollied) {
    this.strategies.die.call(this);
    return;
  }

  //下个点是围墙，游戏结束
  if (
    nextPos[0] < 0 ||
    nextPos[1] < 0 ||
    nextPos[0] > td - 5 ||
    nextPos[1] > tr - 5
  ) {
    this.strategies.die.call(this);
    return;
  }

  //下个点是食物，吃
  if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
    this.strategies.eat.call(this);
    return;
  }
  //下个点什么都不是，走
  this.strategies.move.call(this);
};

//处理碰撞后触发的事

Snake.prototype.strategies = {
  move: function (format) {
    //这个参数用来决定要不要来删除蛇尾
    //创建一个新的身体(旧蛇头的位置)
    var newBody = new Square(this.head.x / sw, this.head.y / sh, "snakebody");
    //跟新链表的关系
    newBody.next = this.head.next;
    newBody.next.last = newBody;
    newBody.last = null;

    this.head.remove();
    newBody.create();

    //蛇头下一个要走到的点

    var newhead = new Square(
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y,
      "snakeHead"
    );
    //跟新链表关系
    newhead.next = newBody;
    newhead.last = null;
    newBody.last = newhead;
    newhead.create();

    //蛇身上每一个方块都要跟新
    this.pos.splice(0, 0, [
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y,
    ]);
    this.head = newhead; //还要把this.head的信息更新

    if (!format) {
      //如果format的值为false，表示要删除，当传了这个参数后就表示要做的事情是吃
      this.tail.remove();
      this.tail = this.tail.last;
      this.pos.pop();
    }
  },
  eat: function () {
    this.strategies.move.call(this, true);
    createFood();
    game.score++;
  },
  die: function () {
    game.over();
  },
};
snake = new Snake();
snake.init();
snake.getNextPos();

function createFood() {
  //食物小方块的随机坐标
  var x = null;
  var y = null;
  var include = true; //循环跳出的条件，true食物的坐标在蛇身上，需要继续循环，false表示食物的坐标不在蛇身上，不循环

  while (include) {
    x = Math.round(Math.random() * (td - 5));
    y = Math.round(Math.random() * (tr - 5));

    snake.pos.forEach(function (value) {
      if (x != value[0] && y != value[1]) {
        include = false;
      }
    });
  }
  //生成食物
  food = new Square(x, y, "food");
  food.pos = [x, y];

  var foodDom = document.querySelector(".food");
  if (foodDom) {
    foodDom.style.left = x * sw + "px";
    foodDom.style.top = y * sh + "px";
  } else {
    food.create();
  }
}

//创建游戏逻辑

function Game() {
  this.timer = null;
  this.score = 0;
}

Game.prototype.init = function () {
  snake.init();
  createFood();

  document.onkeydown = function (ev) {
    if (ev.which == 37 && snake.direction != snake.directionNum.right) {
      //用户摁下左键的时候的，这个蛇不能是正在往右走
      snake.direction = snake.directionNum.left;
    } else if (ev.which == 38 && snake.direction != snake.directionNum.down) {
      snake.direction = snake.directionNum.up;
    } else if (ev.which == 39 && snake.direction != snake.directionNum.left) {
      snake.direction = snake.directionNum.right;
    } else if (ev.which == 40 && snake.direction != snake.directionNum.up) {
      snake.direction = snake.directionNum.down;
    }
  };

  this.start();
};

Game.prototype.pause = function () {
  clearInterval(this.timer);
};

//原型开始方法
Game.prototype.start = function () {
  //开始游戏
  this.timer = setInterval(function () {
    snake.getNextPos();
  }, 200);
};

Game.prototype.over = function () {
  clearInterval(this.timer);
  alert("你的得分为:" + this.score);
};

var snakeWrap = document.querySelector(".snakeWrap");
snakeWrap.innerHTML = "";
snake = new Snake();
game = new Game();

//开启游戏
game = new Game();
var startbtn = document.querySelector(".start");
startbtn.onclick = function () {
  startbtn.style.display = "none";
  game.init();
};

//暂停

var pause = document.querySelector(".pause");

pause.onclick = function () {
  game.pause();
};

var go = document.querySelector(".go");
go.onclick = function () {
  game.pause();
  game.start();
};
//重新开始
var restart = document.querySelector(".restart");
restart.onclick = function () {
  window.location.reload();
  game.start();
};
