/*jslint browser: true*/
/*global $, jQuery*/


/**************************
 * Global Vairiables
 **************************/
// Enemy Type enum
var enmyType = {
    basic: 0,
    homing: 1,
    shooting: 2
};

// Weapon Type enum
var weaponType = {
   basic: 0,
   spread: 1
};

// Powerup Type enum
var powerupType = {
  basicWeapon: "BW",
  spreadWeapon: "SW"
};

// Display
var canvas, context;

// Movement
var keys;

// Game object
var player;
var bullets;
var enemies;
var powerups;

// Time
var prev_time, curr_time, frs, fpsVal;


/**************************
 * Player Class
 **************************/
function Player() {
  this.x = canvas.width() / 2;
  this.y = canvas.height() - 10;
  this.speed = 5;
  this.color = "#808080";
  this.points = 0;
  this.hp = 100;
  this.weapon = new Weapon(weaponType.basic);

  this.update = function () {
    if (keys[83]) { this.y += this.speed; }
    if (keys[90]) { this.y -= this.speed; }
    if (keys[81]) { this.x -= this.speed; }
    if (keys[68]) { this.x += this.speed; }
    if (keys[32]) { this.weapon.fire(this.x, this.y - 25); }

    if (this.x - 20 <= 0) { this.x = 20; }
    if (this.x + 20 >= canvas.width()) { this.x = canvas.width() - 20; }
    if (this.y - 20 <= 0) { this.y = 20; }
    if (this.y >= canvas.height()) { this.y = canvas.height(); }

    this.weapon.delay -= 1;
  };

  this.render = function () {
    if (this.hp <= 0) {
      this.color = "#401010";
    }

    context.fillStyle = this.color;
    context.beginPath();

    context.moveTo(this.x - 20, this.y);
    context.lineTo(this.x, this.y - 20);
    context.lineTo(this.x + 20, this.y);

    context.closePath();
    context.fill();
    context.strokeStyle = "#000000";
    context.stroke();
  };
}


/**************************
 * Bullet Class
 **************************/
function Bullet(x, y, speedX, speedY, color, isAlly) {
  this.x = x;
  this.y = y;
  this.speedX = speedX;
  this.speedY = speedY;
  this.color = color;
  this.ally = isAlly;

  this.update = function () {
    this.x += this.speedX;
    this.y += this.speedY;
  };

  this.render = function () {
    context.fillStyle = this.color;
    context.beginPath();

    context.arc(this.x, this.y, 5, 0, 2 * Math.PI);

    context.closePath();
    context.fill();
    context.strokeStyle = "#000000";
    context.stroke();
  };
}


/**************************
 * Weapon Class
 **************************/
function Weapon(type) {
  this.type = type;
  this.speed = 10;
  this.delay =0;

  switch (this.type) {
    case weaponType.basic:
      this.delayFireRate = 10;
      break;
    case weaponType.spread:
      this.delayFireRate = 50;
      break;
    default:
      this.delayFireRate = 0;
      break;
  }

  this.fire = function (x, y) {
    if (this.delay <= 0) {
      switch (this.type) {
        case weaponType.basic:
          bullets.push(new Bullet(x, y, 0, -this.speed, "#00FF00", true));
          break;
        case weaponType.spread:
          bullets.push(new Bullet(x, y, -this.speed / 10, -this.speed, "#00FF00", true));
          bullets.push(new Bullet(x, y, -this.speed / 5, -this.speed, "#00FF00", true));
          bullets.push(new Bullet(x, y, 0, -this.speed, "#00FF00", true));
          bullets.push(new Bullet(x, y, this.speed / 4, -this.speed, "#00FF00", true));
          bullets.push(new Bullet(x, y, this.speed / 10, -this.speed, "#00FF00", true));
          break;
        default:
          break;
      }

      this.delay = this.delayFireRate;
    }
  };
}


/**************************
 * Powerup Class
 **************************/
function Powerup(type) {
  this.x = Math.floor((Math.random() * (canvas.width() - 20)) + 1) + 15;
  this.y = Math.floor((Math.random() * 100) + 1) + 15;
  this.type = type;

  this.render = function () {
    context.fillStyle = "#EEEEEE";
    context.beginPath();
    context.arc(this.x, this.y, 15, 0, 2 * Math.PI);
    context.closePath();
    context.fill();

    context.strokeStyle = "#000000";
    context.stroke();

    context.fillStyle = "#000000";
    context.font = "18px Impact";
    context.fillText(this.type, this.x - context.measureText(this.type).width / 2, this.y + 8);
  };
}


/**************************
 * Enemy Class
 **************************/
function Enemy(type) {
  this.x = Math.floor((Math.random() * (canvas.width() - 20)) + 1) + 10;
  this.y = Math.floor((Math.random() * 100) + 1) + 10;
  this.type = type;
  this.speedX = 0;
  this.speedY = 0;
  this.delay = 0;
  this.delayFireRate = 0;

  switch (this.type) {
    case enmyType.basic:
      this.speedX = Math.floor((Math.random() * 10) + 1);
      this.speedY = Math.floor((Math.random() * 10) + 1);
      this.color = "#0000FF";
      break;
    case enmyType.homing:
      this.color = "#FF00FF";
      break;
    case enmyType.shooting:
      this.color = "#00FFFF";
      this.delayFireRate = 30;
      break;
    default:
      break;
  }

  this.update = function () {
    switch (this.type) {
      case enmyType.basic:
        if (this.x - 10 <= 0 || this.x + 10 >= canvas.width()) { this.speedX = -this.speedX; }
        if (this.y - 10 <= 0 || this.y + 10 >= canvas.height()) { this.speedY = -this.speedY; }

        break;
      case enmyType.homing:
        var dist = Math.sqrt(Math.pow((this.x - player.x), 2) +
                             Math.pow((this.y - player.y), 2));
        this.speedX = (-1 / dist) * (this.x - player.x) * 2 * Math.floor((Math.random() * 3) + 1);
        this.speedY = (-1 / dist) * (this.y - player.y) * 2 * Math.floor((Math.random() * 3) + 1);

        if (this.x - 10 <= 0) { this.x = 10; }
        if (this.x + 10 >= canvas.width()) { this.x = canvas.width() - 10; }
        if (this.y - 10 <= 0) { this.y = 10; }
        if (this.y + 10 >= canvas.height()) { this.y = canvas.height() - 10; }

        break;
      case enmyType.shooting:
        this.delay += 1;
        if (this.delay >= this.delayFireRate) {
          var dist = Math.sqrt(Math.pow((this.x - player.x), 2) +
                               Math.pow((this.y - player.y), 2));
          var speedX = (-1 / dist) * (this.x - player.x) * 10;
          var speedY = (-1 / dist) * (this.y - player.y) * 10;

          bullets.push(new Bullet(this.x, this.y, speedX, speedY, "#FF0000", false));

          this.delay = 0;
        }
        break;
      default:
        break;
    }

    this.x += this.speedX;
    this.y += this.speedY;
  };

  this.render = function () {
    context.fillStyle = this.color;
    context.fillRect(this.x - 10, this.y - 10, 20, 20);
    context.strokeStyle = "#000000";
    context.strokeRect(this.x - 10, this.y - 10, 20, 20);
  };

  this.fire = function () {

  };
}


/**************************
 * Update
 **************************/
function update() {
  // Update Player
  if (player.hp > 0) { player.update(); }


  var i, j;
  // Update bullets
  for (i = 0; i < bullets.length; i += 1) {
    bullets[i].update();
    if (bullets[i].y < -10 || bullets[i].y > canvas.height() + 10 || bullets[i].x < -10 || bullets[i].x > canvas.width()) { bullets.splice(i, 1); }
  }

  // Update enemies
  for (i = 0; i < enemies.length; i += 1) {
    enemies[i].update();
  }

  // Collision detections
  for (i = 0; i < powerups.length; i += 1) {
    if (Math.sqrt(Math.pow((powerups[i].x - player.x), 2) + Math.pow((powerups[i].y - player.y), 2)) < 35) {
      switch (powerups[i].type) {
        case powerupType.spreadWeapon:
          player.weapon = new Weapon(weaponType.spread);
          powerups.splice(i, 1);
          powerups.push(new Powerup(powerupType.basicWeapon));
          break;
        case powerupType.basicWeapon:
          player.weapon = new Weapon(weaponType.basic);
          powerups.splice(i, 1);
          powerups.push(new Powerup(powerupType.spreadWeapon));
          break;
        default:
          break;
      }
    }
  }

  for (i = 0; i < bullets.length; i += 1) {
    if (bullets[i].ally  === false && Math.sqrt(Math.pow((bullets[i].x - player.x), 2) + Math.pow((bullets[i].y - player.y), 2)) < 15) {
      bullets.splice(i, 1);
      player.hp -= 10;
    }
  }

  for (j = 0; j < enemies.length; j += 1) {
    if (Math.sqrt(Math.pow((enemies[j].x - player.x), 2) + Math.pow((enemies[j].y - player.y), 2)) < 30) {
      if (enemies[j].type === enmyType.basic) { player.hp -= 10; }
      if (enemies[j].type === enmyType.homing) { player.hp -= 1; }
      if (enemies[j].type === enmyType.sooting) { player.hp -= 10; }

      if (player.hp <= -1) { player.hp = -1; }
    }

    for (i = 0; i < bullets.length; i += 1) {
      if (bullets[i].ally && Math.sqrt(Math.pow((bullets[i].x - enemies[j].x), 2) + Math.pow((bullets[i].y - enemies[j].y), 2)) < 15) {
        bullets.splice(i, 1);

        if (enemies[j].type === enmyType.basic) { player.points += 50; }
        if (enemies[j].type === enmyType.homing) { player.points += 25; }
        if (enemies[j].type === enmyType.shooting) { player.points += 10; }

        enemies.push(new Enemy(enemies[j].type));
        enemies.splice(j, 1);
      }
    }
  }
}


/**************************
 * Render
 **************************/
function render() {
  // Clean screen
  context.fillStyle = "#6666C2";
  context.fillRect(0, 0, canvas.width(), canvas.height());

  // Render player
  player.render();

  // Render bullets
  var i, looseTxt, scoreText;
  for (i = 0; i < bullets.length; i += 1) {
    bullets[i].render();
  }

  // Render powerups
  for (i = 0; i < powerups.length; i += 1) {
    powerups[i].render();
  }

  // Render enemies
  for (i = 0; i < enemies.length; i += 1) {
    enemies[i].render();
  }

  // Health bar
  context.fillStyle = "#AA0000";
  context.fillRect(15, 15, 150, 30);
  context.fillStyle = "#00AA00";
  context.fillRect(15, 15, player.hp * 1.5, 30);
  context.strokeStyle = "#000000";
  context.strokeRect(15, 15, 150, 30);

  // Print points
  context.fillStyle = "#000000";
  context.font = "20px Verdana";
  context.fillText("Score: " + player.points, 15, 75);

  // Death screen
  if (player.hp <= 0) {
    // Overlay
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width(), canvas.height());

    // Looser text
    looseTxt = "LOOSER !";
    context.fillStyle = "#FF0000";
    context.font = "100px Impact";
    context.fillText(looseTxt, canvas.width() / 2 - context.measureText(looseTxt).width / 2, canvas.height() / 2 - 50);
    context.strokeStyle = "#000000";
    context.strokeText(looseTxt, canvas.width() / 2 - context.measureText(looseTxt).width / 2, canvas.height() / 2 - 50);

    // Score text
    scoreText = "Score: " + player.points + " Pts";
    context.fillStyle = "#000000";
    context.font = "50px Impact";
    context.fillText(scoreText, canvas.width() / 2 - context.measureText(scoreText).width / 2, canvas.height() / 2 + 50);
    context.strokeStyle = "#FF0000";
    context.strokeText(scoreText, canvas.width() / 2 - context.measureText(scoreText).width / 2, canvas.height() / 2 + 50);
  }

  // Print FPS
  context.fillStyle = "#FF0000";
  context.font = "20px Verdana";
  context.fillText("FPS: " + fpsVal, canvas.width() - 90, 30);
}


/**************************
 * FPS computation
 **************************/
function fps() {
  frs += 1;
  curr_time = new Date();

  if (curr_time.getTime() - prev_time.getTime() > 1000) {
    fpsVal = frs;
    frs = 0;
    prev_time = curr_time;

    if (player.hp > 0) { player.points += 1; }
  }
}


/**************************
 * Main Loop
 **************************/
function play() {
  update();
  render();
  fps();
}


/**************************
 * Initialise method
 **************************/
function init() {
  // Initialise display variables
  canvas = $("#mainCanvas");
  canvas.css("position", "absolute");
  canvas.css("left", ($(window).width() - canvas.width()) / 2);
  context = canvas[0].getContext("2d");

  // Initialise Movement variables
  keys = [];

  // Initialise Game objects
  player = new Player();
  bullets = [];
  enemies = [new Enemy(enmyType.basic), new Enemy(enmyType.basic), new Enemy(enmyType.basic), new Enemy(enmyType.basic), new Enemy(enmyType.homing), new Enemy(enmyType.homing), new Enemy(enmyType.shooting), new Enemy(enmyType.shooting)];
  powerups = [new Powerup(powerupType.spreadWeapon)];

  // Initialise Time variables
  frs = 0;
  fpsVal = 0;
  prev_time = new Date();
  curr_time = new Date();

  // Call game loop aiming at 60fps
  setInterval(play, 1000 / 60);
}


/**************************
 * Resize window
 **************************/
$(window).resize(function () {
  canvas.css("left", ($(window).width() - canvas.width()) / 2);
});


/**************************
 * Key Pressed Listener
 **************************/
$(window).keydown(function (event) {
  keys[event.keyCode] = true;
});


/**************************
 * Key Released Listener
 **************************/
$(window).keyup(function (event) {
  keys[event.keyCode] = false;
});
