class Entity {
  constructor(
    name,
    x,
    y,
    z,
    width,
    height,
    rotation,
    scaleX,
    scaleY,
    colliderRadius
  ) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.colliderRadius = colliderRadius;
  }

  name;
  x;
  y;
  z;
  width;
  height;
  rotation;
  scaleX;
  scaleY;
  image;
  imageCenter = { x: 0, y: 0 };
  colliderRadius;

  // Lifecycle methods
  Start = () => {};
  Update = (delta) => {};
  // Interaction, these will be overridden in implementation
  OnTouchDown = () => {};
  OnTouch = () => {};
  OnTouchUp = () => {};
  // Reaction, this also will be overridden
  OnCollision = (collider) => {}; //gets called by the engine whenever this entity is colliding with another one, in the CollisionDetection() function

  GetForward = (angleOffset = 0) => {
    // get the forward direction using sin and cos
    let angle = this.rotation;
    angle += angleOffset;
    // gotta use radians
    let rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad),
      y: Math.sin(rad),
    };
  };
}

class Scene {
  constructor(name) {
    this.name = name;
    this.entities = [];
  }
  name;
  entities = [];

  Add = (entity) => {
    this.entities.push(entity);
  };

  Instantiate = (
    entity,
    x = 0,
    y = 0,
    rotation = 0,
    scaleX = 1,
    scaleY = 1
  ) => {
    this.entities.push(entity);
    entity.x = x;
    entity.y = y;
    entity.rotation = rotation;
    entity.scaleX = scaleX;
    entity.scaleY = scaleY;
    entity.Start();
  };

  Update = (delta) => {
    this.entities.forEach((entity) => {
      entity.Update(delta);
    });
  };
}

class Pockety {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.canvasContext = this.canvas.getContext("2d");

    if (this.canvas.getContext) {
      //Set Event Listeners for window and touch
      window.addEventListener("resize", this._resizeCanvas, false);
      window.addEventListener("orientationchange", this._resizeCanvas, false);

      // and for input management
      this.canvas.addEventListener("touchstart", this._touchDown, false);
      this.canvas.addEventListener("touchmove", this._updateTouchEvent, false);
      this.canvas.addEventListener("touchend", this._touchUp, false);
    }
    this._resizeCanvas();
  }

  // context
  canvas;
  center = { x: 0, y: 0 };
  canvasContext;
  startTimeMS;
  deltaTime;

  // scenes
  scenes = [];
  activeScene;

  // audio and images
  audioClips = [];
  sprites = [];

  // input
  lastPt = null;
  touching = false;
  lastEvent = null;

  // direct drawing
  lines = [];
  texts = [];
  circles = [];
  rectangles = [];
  buttons = [];
  debugCollisions = false;

  // Public engine methods

  Run = (startingScene) => {
    this._start(startingScene);
  };

  LoadScene = (scene) => {
    this.activeScene = scene;

    this.activeScene.entities.forEach(function (entity) {
      entity?.Start();
    });
  };

  // this is a public version of the OnTouch in the entity but at an engine level
  OnTouch = () => {
    if (!this.lastEvent) return false;
    if (!this.touching || this.lastEvent.touches?.length == 0) return false;
    let mousePos = this._getTouchPos(this.lastEvent);
    this.lastPt = { x: mousePos.x, y: mousePos.y };

    //we also check if we clicked on an object
    this._checkClick("OnTouch");
    return this.lastPt;
  };

  // images and drawing

  LoadSprite = async (name, path) => {
    let p = new Promise((resolve, reject) => {
      let sprite = new Image();
      sprite.src = path;

      sprite.onload = () => {
        this.sprites.push({ name, sprite });
        resolve();
      };
    });

    return p;
  };

  GetSprite = (name) => {
    for (let i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].name == name) return this.sprites[i].sprite;
    }
    return null;
  };

  SetSprite = (entity, name, resize = false, center = false) => {
    entity.image = this.GetSprite(name);
    if (!entity.image) {
      console.log("Error: Sprite not found");
      return;
    }
    if (resize) {
      entity.width = entity.image.width;
      entity.height = entity.image.height;
    }
    if (center) {
      entity.imageCenter = { x: entity.width / 2, y: entity.height / 2 };
    }
  };

  StyleText = (txtColour, txtFont, txtAlign, txtBaseline) => {
    //utility function ised to style text in a single call
    this.canvasContext.fillStyle = txtColour;
    this.canvasContext.font = txtFont;
    this.canvasContext.textAlign = txtAlign;
    this.canvasContext.textBaseline = txtBaseline;
  };

  DrawLine = (x1, y1, x2, y2, color = "#fff", width = 1) => {
    this.lines.push({ x1, y1, x2, y2, color, width });
  };

  DrawText = (txt, x, y, txtColour, txtSize, align = "left") => {
    this.texts.push({ txt, x, y, txtColour, txtSize, align });
  };

  DrawCircle = (x, y, radius, color = "#fff") => {
    this.circles.push({ x, y, radius, color });
  };

  DrawRect = (x, y, width, height, color = "#fff", borderRadius = 0) => {
    this.rectangles.push({ x, y, width, height, color, borderRadius });
  };

  AddButton = (
    name,
    text,
    x,
    y,
    width,
    height,
    color = "#fff",
    borderRadius = 0,
    align = "center",
    callback
  ) => {
    this.buttons.push({
      name,
      text,
      x,
      y,
      width,
      height,
      color,
      borderRadius,
      align,
      callback,
    });
  };

  RemoveButton = (name) => {
    this.buttons = this.buttons.filter((button) => button.name != name);
  };

  // audio management

  LoadAudio = (name, path) => {
    let audioClip = new Audio();
    audioClip.src = path;
    this.audioClips.push({ clip: audioClip, name: name });
  };

  PlayAudio = (name, looping) => {
    for (let i = 0; i < this.audioClips.length; i++) {
      if (this.names[i] == name) {
        this.audioClips[i].loop = looping;
        this.audioClips[i].play();
      }
    }
  };

  StopAudio = (name) => {
    for (let i = 0; i < this.audioClips.length; i++) {
      if (this.names[i] == name) {
        this.audioClips[i].pause();
        this.audioClips[i].currentTime = 0;
      }
    }
  };

  StopAllAudio = () => {
    for (let i = 0; i < this.audioClips.length; i++) {
      {
        this.audioClips[i].pause();
        this.audioClips[i].currentTime = 0;
      }
    }
  };

  // some math utilities cause why not, right?

  Lerp = (a, b, alpha) => {
    return a + alpha * (b - a);
  };

  Remap = (value, low1, high1, low2, high2) => {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  };

  Clamp = (val, min, max) => {
    return Math.min(Math.max(val, min), max) || min;
  };

  Distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // internal engine utilities

  _start = (startingScene) => {
    this.startTimeMS = Date.now();

    this.LoadScene(startingScene);

    this._gameLoop();
  };

  _gameLoop = () => {
    this.deltaTime = (Date.now() - this.startTimeMS) / 1000;

    if (this.touching) this.OnTouch();

    this.activeScene.Update(this.deltaTime);
    this._collisionDetection();
    this._render(this.deltaTime);

    this.startTimeMS = Date.now();
    requestAnimationFrame(this._gameLoop);
  };

  _collisionDetection = () => {
    // simple circle collision detection
    this.activeScene.entities.forEach((entity) => {
      if (entity.colliderRadius > 0) {
        this.activeScene.entities.forEach((otherEntity) => {
          if (otherEntity.colliderRadius > 0) {
            if (entity != otherEntity) {
              let distance = this.Distance(
                entity.x,
                entity.y,
                otherEntity.x,
                otherEntity.y
              );
              if (distance < entity.colliderRadius + otherEntity.colliderRadius)
                entity.OnCollision(otherEntity);
            }
          }
        });
      }
    });
  };

  _render = () => {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvasContext.save();

    //render all Entities
    for (let entity of this.activeScene.entities) {
      if (entity.image != null) {
        this._drawImage(
          entity.image,
          entity.x,
          entity.y,
          entity.width,
          entity.height,
          entity.rotation,
          entity.scaleX,
          entity.scaleY,
          entity.imageCenter
        );
      }
      if (this.debugCollisions && entity.colliderRadius > 0) {
        this._drawCircle(entity.x, entity.y, entity.colliderRadius, "#ff0000");
      }
    }

    // render all texts
    this.texts.forEach((text) => {
      this._drawText(
        text.txt,
        text.x,
        text.y,
        text.txtColour,
        text.txtSize,
        text.align
      );
    });

    // render all lines
    this.lines.forEach((line) => {
      this._drawLine(
        line.x1,
        line.y1,
        line.x2,
        line.y2,
        line.color,
        line.width
      );
    });

    // render all circles
    this.circles.forEach((circle) => {
      this._drawCircle(circle.x, circle.y, circle.radius, circle.color);
    });

    // render all rectangles
    this.rectangles.forEach((rectangle) => {
      this._drawRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height,
        rectangle.color,
        rectangle.borderRadius
      );
    });

    // render all buttons
    this.buttons.forEach((button) => {
      this._drawButton(
        button.text,
        button.x,
        button.y,
        button.width,
        button.height,
        button.color,
        button.borderRadius,
        button.align,
        button.callback
      );
    });

    this.canvasContext.restore();

    // clear texts and lines for next render cycle
    this.lines = [];
    this.texts = [];
    this.circles = [];
    this.rectangles = [];
  };

  // input stuff

  _touchUp = (evt) => {
    evt.preventDefault();
    this.touching = false;

    this._checkClick("OnTouchUp");

    // Terminate touch path
    this.lastPt = null;
    return this.lastPt;
  };

  _getTouchPos = (evt) => {
    let mouseX = evt.touches[0].pageX;
    let mouseY = evt.touches[0].pageY;
    return { x: mouseX, y: mouseY };
  };

  _touchDown = (evt) => {
    evt.preventDefault();
    let mousePos = this._getTouchPos(evt);
    this.lastPt = { x: mousePos.x, y: mousePos.y };
    this.touching = true;
    this.lastEvent = evt; // this is needed to retain touch information on touch move

    //we also check if we clicked on an object
    this._checkClick("OnTouchDown");
    return this.lastPt;
  };

  // this is only used to persist and update touches
  _updateTouchEvent = (evt) => {
    this._getTouchPos(evt);
    this.lastEvent = evt;
  };

  _checkClick = (method) => {
    //check if we clicked on an object using the collider radius
    for (var i = 0; i < this.activeScene.entities.length; i++) {
      let obj = this.activeScene.entities[i];
      let radius = obj.colliderRadius;

      if (radius > 0) {
        let distance = this.Distance(
          obj.x,
          obj.y,
          this.lastPt.x,
          this.lastPt.y
        );
        if (distance < radius) {
          obj[method]();
        }
      }
    }
    // aabb check for buttons
    this.buttons.forEach((button) => {
      if (
        this.lastPt.x > button.x &&
        this.lastPt.x < button.x + button.width &&
        this.lastPt.y > button.y &&
        this.lastPt.y < button.y + button.height
      ) {
        button.callback();
      }
    });
  };

  // canvas and rendering stuff

  _resizeCanvas = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  };

  _drawLine = (x1, y1, x2, y2, color = "#fff", width = 1) => {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(x1, y1);
    this.canvasContext.lineTo(x2, y2);
    this.canvasContext.lineWidth = width;
    this.canvasContext.strokeStyle = color;
    this.canvasContext.stroke();
  };

  _drawCircle = (x, y, radius, color = "#fff") => {
    this.canvasContext.beginPath();
    this.canvasContext.arc(x, y, radius, 0, 2 * Math.PI);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fill();
  };

  _drawRect = (x, y, width, height, color = "#fff", borderRadius = 0) => {
    this.canvasContext.beginPath();
    this.canvasContext.roundRect(x, y, width, height, borderRadius);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fill();
  };

  _drawImage = (
    image,
    x,
    y,
    width,
    height,
    angle,
    scaleX,
    scaleY,
    imageCenter = { x: 0, y: 0 }
  ) => {
    // save GL stack
    this.canvasContext.save();
    // translate to origin, then rotate
    this.canvasContext.translate(x - imageCenter.x, y - imageCenter.y);
    // rotate from image center if it is present
    this.canvasContext.translate(imageCenter.x, imageCenter.y);
    //transpose angle from degrees to radians
    let angleRad = (angle * Math.PI) / 180;
    this.canvasContext.rotate(angleRad);
    // go back to original position
    this.canvasContext.translate(-imageCenter.x, -imageCenter.y);
    // scale and draw
    this.canvasContext.scale(scaleX, scaleY);
    this.canvasContext.drawImage(image, 0, 0, width, height);
    // restore GL stack
    this.canvasContext.restore();
  };

  _drawText = (txt, x, y, txtColour, txtSize, align = "left") => {
    this.canvasContext.textAlign = align;
    this.canvasContext.textBaseline = "middle";
    this.canvasContext.fillStyle = txtColour;
    this.canvasContext.font = txtSize + "px Arial";
    this.canvasContext.fillText(txt, x, y);
  };

  _drawButton = (
    text,
    x,
    y,
    width,
    height,
    color = "#fff",
    borderRadius = 0,
    align = "center"
  ) => {
    this._drawRect(x, y, width, height, color, borderRadius);
    this._drawText(text, x + width / 2, y + height / 2, "#000", 20, align);
  };
}
