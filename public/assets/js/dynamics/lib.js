var musicbox = {};
musicbox.config = {};
musicbox.config.timpani = {};
musicbox.config.kit = {};
musicbox.config.woodblock = {};
musicbox.config.conga = {};
let volumeLevel = 0;
var selectedCharacter = 0;
const bpmArray = 
[[0.97015, 1.0833],
[1],
[1.2],
[0.90284]];

const delayArray = 
[[200, 0],
[400],
[450],
[100]];;

const intervalArray = 
[[20, 31, 30,  105],
[125, 320,  209,  169],
[48,  34, 196,  34],
[53, 137,  206,  28]];

// const volumeArray = 
// [[1, 0.1, 2,  2],
// [20000, 20000,  20000,  20000],
// [20000,  20000, 20000,  20000],
// [20000, 20000,  20000,  20000]];

let sequencerArr = [];
let isStart = 0;
let statusDynamics = 0;

musicbox.Animation = function (data, framerate) {
  this.data = data;
  this.duration = data.duration / 1000;
};

musicbox.Animation.FRAME_DURATION = 1 / 30;

musicbox.Animation.prototype.at = function (t, dim) {
  var frame = t / musicbox.Animation.FRAME_DURATION;
  var frameLowIndex = ~~frame;
  var frameHighIndex = frameLowIndex + 1;

  var l = frame - frameLowIndex;


  var frameLow = this.data.frameData[frameLowIndex].val[dim];
  var frameHigh =
    this.data.frameData[
      Math.min(this.data.frameData.length - 1, frameHighIndex)
    ].val[dim];


  return aaf.utils.math.lerp(frameLow, frameHigh, l);
};
musicbox.Carousel = function (opts) {
  opts = aaf.utils.defaults(opts, {
    children: [],
    childWidth: 300,
    restEasing: 0.145,
    grabEasing: 1,
  });

  this.container = new PIXI.Container();
  this.children = opts.children;
  //this.childWidth = opts.childWidth;

  this.grabEasing = opts.grabEasing;
  this.restEasing = opts.restEasing;

  this.easing = this.restEasing;

  this.grabbed = false;

  this.grabTarget = 0;

  for (var i = 0, l = this.children.length; i < l; i++) {
    var child = this.children[i];
    this.container.addChild(child);
  }

  this.nextButton = document.createElement("div");
  this.nextButton.className = "puck-button next";

  this.prevButton = document.createElement("div");
  this.prevButton.className = "puck-button prev";
  container.appendChild(this.nextButton);
  container.appendChild(this.prevButton);

  this.setChildWidth(opts.childWidth);

  this.setActive(0);
};

musicbox.Carousel.prototype.setChildWidth = function (w) {
  this.childWidth = w;

  for (var i = 0, l = this.children.length; i < l; i++) {
    var child = this.children[i];
    child.position.x = i * this.childWidth;
  }

  this.setActive(this.activeChildIndex);
  this.container.position.x = this.targetXPosition;
};

musicbox.Carousel.prototype.setActive = function (index) {
  this.activeChildIndex = index;
  this.targetXPosition = -this.activeChildIndex * this.childWidth;

  // this.prevButton.classList.toggle("hidden", this.activeChildIndex === 0);
  // this.nextButton.classList.toggle(
  //   "hidden",
  //   this.activeChildIndex === this.children.length - 1
  // );
};

musicbox.Carousel.prototype.grab = function () {
  this.grabbed = true;
  this.easing = this.grabEasing;
};

musicbox.Carousel.prototype.release = function () {
  this.grabbed = false;
  this.easing = this.restEasing;
};

musicbox.Carousel.prototype.grabMove = function (x) {
  this.container.position.x = x;
};

musicbox.Carousel.prototype.next = function () {
  var index = this.activeChildIndex + 1;
  index %= this.children.length;

  this.audio = document.getElementById("bcAudio");
  this.audio.pause()

  this.setActive(index);
  selectedCharacter = (selectedCharacter + 1) % 4;
  placeBPM();
};

musicbox.Carousel.prototype.prev = function () {
  var index = this.activeChildIndex - 1;
  if (index < 0) {
    index += this.children.length;
  }
  this.audio = document.getElementById("bcAudio");
  this.audio.pause()

  this.setActive(index);
  selectedCharacter = (selectedCharacter + 3) % 4;
  placeBPM();
};

musicbox.Carousel.prototype.update = function () {
  var target = this.grabbed ? this.grabTarget : this.targetXPosition;

  var delta = target - this.container.position.x;
  var ad = Math.abs(delta);

  if (ad > 0 && ad < 1) {
    this.container.position.x = target;
  } else {
    this.container.position.x += delta * this.easing;
  }
};

musicbox.Character = function (opts) {
  aaf.utils.Events.mixTo(this);

  this.scale = 300 / 72;

  this.groups = {};
  this.sprites = {};
  this.animations = {};
  this.timelines = {};
  this.hitboxes = {};

  this.container = new PIXI.Container();

  this.lookDirection = {
    x: 0,
    y: 0,
  };

  // Build the groups and sprites
  // -------------------------------

  if (opts.legs) {
    this.makeLegs(opts);
  }

  this.groups.body = new PIXI.Container();
  this.container.addChild(this.groups.body);

  if (opts.body) {
    this.makeBody(opts);
  }

  if (opts.face) {
    this.makeFace(opts);
  }

  this.makeEyes(opts);

  if (opts.front && !opts.front.behindArms) {
    this.makeFront(opts);
  }

  // hitboxes

  if (opts.hitbox) {
    for (var key in opts.hitbox) {
      this.defineHitbox(opts.hitbox[key], key);
    }
  }

  // arms, strike animations

  if (opts.armLeft) {
    this.makeArm(opts, "Left");
  }

  if (opts.armRight) {
    this.makeArm(opts, "Right");
  }

  if (opts.front && opts.front.behindArms) {
    this.makeFront(opts);
  }

  if (opts.armLeft && opts.armRight.back) {
    this.groups.body.addChild(this.groups.armLeft);
  }

  // Make both-armed strike GSAP timelines
  // -------------------------------

  if (opts.strikeBoth && !aaf.common.url.defaultPose) {
    this.timelines.strikeBoth = new TimelineLite({ paused: true });

    if (opts.armLeft) {
      var tl = this.makeStrikeTimeline(opts, "Left", false);
      this.timelines.strikeBoth.add(tl, 0);
    }

    if (opts.armRight) {
      var tr = this.makeStrikeTimeline(opts, "Right", false);
      this.timelines.strikeBoth.add(tr, 0);
    }

    this.timelines.strikeBoth.time(0.0001);
    this.anticipationBoth = opts.strikeBoth.anticipation;
  }

  // kick in the first animation frames

  if (opts.strikeLeft && !aaf.common.url.defaultPose) {
    this.timelines.strikeLeft.time(0.0001);
    this.anticipationLeft = opts.strikeLeft.anticipation;
  }

  if (opts.strikeRight && !aaf.common.url.defaultPose) {
    this.timelines.strikeRight.time(0.0001);
    this.anticipationRight = opts.strikeRight.anticipation;
  }

  // values for update method, programmatic gyrating etc ...

  this.bob = 0;
  this.bobInfluence = 0;
  this.targetBobInfluence = 0;

  this.breatheSpeed = aaf.random(0.8, 1.2) * 2;
  this.breatheOffset = aaf.random();

  this.breathe = 0;
  this.breatheInfluence = 1;
};

musicbox.Character.getAssetList = function (charOpts) {
  var assets = [];

  for (var i in charOpts) {
    var layer = charOpts[i];

    if (layer.texture) {
      assets.push(layer.texture);
    }

    if (layer.animation) {
      if (layer.animation.rotation) {
        assets.push(layer.animation.rotation.file);
      }

      if (layer.animation.position) {
        assets.push(layer.animation.position.file);
      }
    }
  }

  return assets;
};

// Per-frame animation functions
// -------------------------------

musicbox.Character.prototype.setBob = function (pct) {
  this.targetBobInfluence = 1;
  this.bob = pct;
};

musicbox.Character.prototype.stopBobbing = function (pct) {
  this.targetBobInfluence = 0;
};

musicbox.Character.prototype.update = function () {
  this.groups.body.position.y = 0;
  this.groups.armLeft.position.y = this.armLeftRestY;
  this.groups.armRight.position.y = this.armRightRestY;
  this.eyes.sprite.position.x = 0;
  this.eyes.sprite.position.y = 0;

  // Bob
  // -------------------------------

  // made from several abs'd sine waves with different amplitudes and phase

  var t = (this.bob - 0.1) * Math.PI;
  this.bobInfluence += (this.targetBobInfluence - this.bobInfluence) * 0.05;

  this.groups.body.position.y +=
    -Math.abs(Math.sin(t) * 2) * 5 * this.bobInfluence;
  this.groups.armLeft.position.y +=
    -Math.abs(Math.sin(t - 0.35) * 2) * 5 * this.bobInfluence;
  this.groups.armRight.position.y +=
    -Math.abs(Math.sin(t - 0.3) * 2) * 5 * this.bobInfluence;
  this.eyes.sprite.position.y +=
    -Math.abs(Math.sin(t + 0.35) * 2) * 1.5 * this.bobInfluence;

  // Breathe
  // -------------------------------

  // similar but way smaller amplitude and not abs'd

  this.breathe += aaf.common.loop.delta * this.breatheSpeed;
  var breatheInfluence = 1 - this.bobInfluence;
  var t = this.breathe + this.breatheOffset;

  this.groups.body.position.y += -Math.sin(t) * 2.75;
  this.groups.armLeft.position.y += -Math.sin(t - 0.35) * 2.75;
  this.groups.armRight.position.y += -Math.sin(t - 0.3) * 2.75;
  this.eyes.sprite.position.y += -Math.sin(t + 0.35) * 1.5;

  // Look direction
  // -------------------------------

  //     this.lookDirection.x = window.innerWidth / 2 - aaf.common.pointer.x;
  //     this.lookDirection.y = window.innerHeight / 2 - aaf.common.pointer.y;
  // //
  this.eyes.sprite.position.x += this.lookDirection.x;
  this.eyes.sprite.position.y += this.lookDirection.y;

  this.eyes.mask.position.x = this.eyes.sprite.position.x;
  this.eyes.mask.position.y = this.eyes.sprite.position.y;

  if (this.sprites.face) {
    this.sprites.face.x =
      this.eyes.sprite.position.x * 0.5 * this.eyes.container.scale.x;
    this.sprites.face.y =
      this.eyes.sprite.position.y * 0.7 * this.eyes.container.scale.y;
  }

  // the "front" layer is annoying because it needs to be between
  // arms and in front of body. but it doesn't respect any of this
  // bouncing motion ....

  if (this.sprites.front) {
    this.sprites.front.position.y =
      this.frontRestY - this.groups.body.position.y;
  }
};

// Construct character
// -------------------------------

musicbox.Character.prototype.defineHitbox = function (opts, key) {
  var hitbox = new PIXI.Graphics();

  hitbox.alpha = aaf.common.url.boolean("hitbox") ? 0.5 : 0;

  hitbox.beginFill(~~(Math.random() * 0xffffff));
  hitbox.drawRect(opts.x, opts.y, opts.width, opts.height);
  hitbox.endFill();

  hitbox.hitArea = new PIXI.Rectangle(opts.x, opts.y, opts.width, opts.height);

  hitbox.interactive = true;

  var _this = this;

  var down = function () {
    _this.fire("down", key);
    _this.fire(key + "down");
  };

  var up = function () {
    _this.fire("up", key);
    _this.fire(key + "up");
  };

  hitbox.mousedown = down;
  hitbox.mouseup = up;

  hitbox.touchstart = down;
  hitbox.touchend = up;

  this.hitboxes[key] = hitbox;

  this.container.addChild(hitbox);
};

musicbox.Character.prototype.makeFace = function (opts) {
  this.groups.face = new PIXI.Container();
  this.sprites.face = new PIXI.Sprite(aaf.assets(opts.face.texture));

  this.groups.face.addChild(this.sprites.face);
  this.groups.body.addChild(this.groups.face);

  this.groups.face.pivot.x = this.sprites.face.texture.width / 2;
  this.groups.face.pivot.y = this.sprites.face.texture.height / 2;

  aaf.utils.extend(this.groups.face.position, opts.face.position);

  this.groups.face.position.x += this.sprites.body.position.x;
};

musicbox.Character.prototype.makeBody = function (opts) {
  this.sprites.body = new PIXI.Sprite(aaf.assets(opts.body.texture));

  this.groups.body.addChild(this.sprites.body);

  this.sprites.body.pivot.x = this.sprites.body.texture.width / 2;
  this.sprites.body.pivot.y = this.sprites.body.texture.height / 2;

  this.sprites.body.position.x = opts.body.position.x;
  this.sprites.body.position.y = opts.body.position.y;
};

musicbox.Character.prototype.makeEyes = function (opts) {
  this.eyes = new musicbox.CharacterEyes();

  if (opts.eyes && opts.eyes.position) {
    aaf.utils.extend(this.eyes.container.position, opts.eyes.position);
    this.eyes.container.position.x += opts.body.position.x; // eyes to be relative

    if (opts.eyes.scale) {
      this.eyes.container.scale.set(opts.eyes.scale);
    }

    if (opts.eyes.color !== undefined) {
      this.eyes.sprite.tint = opts.eyes.color;
    }
  } else {
    this.eyes.container.position.x = opts.body.position.x;
    this.eyes.container.position.y = -200;
  }

  this.groups.body.addChild(this.eyes.container);
};

musicbox.Character.prototype.makeLegs = function (opts) {
  this.sprites.legs = new PIXI.Sprite(aaf.assets(opts.legs.texture));

  this.container.addChild(this.sprites.legs);

  this.sprites.legs.pivot.x = this.sprites.legs.texture.width / 2;
  this.sprites.legs.pivot.y = this.sprites.legs.texture.height / 2;

  this.sprites.legs.position.x = opts.legs.position.x;
  this.sprites.legs.position.y = opts.legs.position.y;
};

musicbox.Character.prototype.makeFront = function (opts) {
  this.sprites.front = new PIXI.Sprite(aaf.assets(opts.front.texture));

  this.groups.body.addChild(this.sprites.front);

  this.sprites.front.pivot.x = this.sprites.front.texture.width / 2;
  this.sprites.front.pivot.y = this.sprites.front.texture.height / 2;

  this.sprites.front.position.x = opts.front.position.x;
  this.sprites.front.position.y = opts.front.position.y;

  this.frontRestY = opts.front.position.y;
};

// Arms and their animations
// -------------------------------

musicbox.Character.prototype.makeArm = function (opts, side) {
  var stickOpts = opts["stick" + side];
  var strikeOpts = opts["strike" + side];
  var armOpts = opts["arm" + side];

  var groupArm = (this.groups["arm" + side] = new PIXI.Container());
  var spriteArm = (this.sprites["arm" + side] = new PIXI.Sprite(
    aaf.assets(armOpts.texture)
  ));

  groupArm.position.x = armOpts.position.x * this.scale;
  groupArm.position.y = armOpts.position.y * this.scale;

  this["arm" + side + "RestY"] = groupArm.position.y * this.scale;

  spriteArm.pivot.x = spriteArm.texture.width / 2;
  spriteArm.pivot.y = spriteArm.texture.height / 2;

  if (!stickOpts || !stickOpts.behindArms) {
    groupArm.addChild(spriteArm);
  }

  if (stickOpts) {
    var groupStick = (this.groups["stick" + side] = new PIXI.Container());
    var spriteStick = (this.sprites["stick" + side] = new PIXI.Sprite(
      aaf.assets(stickOpts.texture)
    ));

    spriteStick.pivot.x = spriteStick.texture.width / 2;
    spriteStick.pivot.y = spriteStick.texture.height / 2;

    groupStick.position.x = stickOpts.position.x * this.scale;
    groupStick.position.y = stickOpts.position.y * this.scale;

    groupArm.addChild(groupStick);
    groupStick.addChild(spriteStick);
  }

  if (stickOpts && stickOpts.behindArms) {
    groupArm.addChild(spriteArm);
  }

  this.groups.body.addChild(groupArm);

  if (strikeOpts) {
    var timeline = (this.timelines["strike" + side] = this.makeStrikeTimeline(
      opts,
      side,
      true
    ));
  }
};

musicbox.Character.prototype.makeStrikeTimeline = function (
  opts,
  side,
  paused
) {
  var armOpts = opts["arm" + side];
  var stickOpts = opts["stick" + side];
  var strikeOpts = opts.strikeBoth || opts["strike" + side];

  var progress = { t: 0 };
  var timeline = new TimelineLite({ paused: paused });
  var _this = this;

  var armRotationJson = aaf.assets(armOpts.animation.rotation.file);
  var armRotationLayer = armOpts.animation.rotation.layer;
  var armRotationAnimation = new musicbox.Animation(
    armRotationJson[armRotationLayer]
  );

  var stickRotationAnimation;

  if (stickOpts && stickOpts.animation.rotation) {
    var stickRotationJson = aaf.assets(stickOpts.animation.rotation.file);
    var stickRotationLayer = stickOpts.animation.rotation.layer;
    stickRotationAnimation = new musicbox.Animation(
      stickRotationJson[stickRotationLayer]
    );
  }

  timeline.to(
    progress,

    armRotationAnimation.duration,

    {
      t: armRotationAnimation.duration,

      onUpdate: function () {
        _this.groups["arm" + side].rotation =
          (armRotationAnimation.at(progress.t, statusDynamics) * Math.PI) / 180;

        if (stickRotationAnimation) {
          _this.groups["stick" + side].rotation =
            (stickRotationAnimation.at(progress.t, statusDynamics) * Math.PI) /
            180;
        }

        // if ( armOpts.animation.position ) {
        // _this.groups[ 'arm' + side ].position.x = armOpts.animation.position.at( progress.t, 0 );
        // _this.groups[ 'arm' + side ].position.y = armOpts.animation.position.at( progress.t, 1 );
        // }
      },
    }
  );

  return timeline;
};

// GSAP strike timelines
// -------------------------------

musicbox.Character.prototype.strikeLeft = function (time) {
  time = time || this.anticipationLeft;
  this.timelines.strikeLeft &&
    this.timelines.strikeLeft.timeScale(this.anticipationLeft / time).restart();
};

musicbox.Character.prototype.strikeRight = function (time) {
  time = time || this.anticipationRight;
  this.timelines.strikeRight &&
    this.timelines.strikeRight
      .timeScale(this.anticipationRight / time)
      .restart();
};

musicbox.Character.prototype.strikeBoth = function (time) {
  time = time || this.anticipationBoth;
  this.timelines.strikeBoth &&
    this.timelines.strikeBoth.timeScale(this.anticipationBoth / time).restart();
};

musicbox.CharacterEyes = function () {
  this.container = new PIXI.Container();

  this.sprite = new PIXI.Sprite(aaf.assets("texture/slices_eyes.png"));
  this.sprite.pivot.x = this.sprite.texture.width / 2;
  this.sprite.pivot.y = this.sprite.texture.height / 2;

  this.mask = new PIXI.Graphics();
  this.mask.beginFill();
  this.mask.drawRect(
    0,
    0,
    this.sprite.texture.width,
    this.sprite.texture.height
  );
  this.mask.endFill();

  aaf.utils.extend(this.mask.pivot, this.sprite.pivot);

  this.container.addChild(this.mask);
  this.container.addChild(this.sprite);

  this.sprite.mask = this.mask;

  var blink = 1;

  Object.defineProperty(this, "blink", {
    get: function () {
      return blink;
    },

    set: function (b) {
      blink = b;
      this.mask.scale.y = blink; // Remove blink
    },
  });

  this.blinkTimeline = new TimelineMax({
    onComplete: this.onComplete,
    onCompleteScope: this,
  });

  this.blinkTimeline.to(this, 0.075, { blink: 0 });
  this.blinkTimeline.to(this, 0.1, { blink: 1 }, "+=0.1");
};

musicbox.CharacterEyes.prototype.getRepeatDelay = function () {
  var r = aaf.random();

  return aaf.utils.math.lerp(4.0, 0.5, r * r * r);
};

musicbox.CharacterEyes.prototype.onComplete = function () {
  if (aaf.random.chance(0.1)) {
    // double blink
    this.blinkTimeline.timeScale(1.2);
    this.blinkTimeline.delay(0);
  } else {
    this.blinkTimeline.timeScale(aaf.random(0.8, 1.1));
    this.blinkTimeline.delay(this.getRepeatDelay());
  }

  this.blinkTimeline.restart(true);
};
musicbox.CharacterPair = function (charBig) {
  //, charSmall

  this.characterBig = charBig;
  // this.characterSmall = charSmall;

  this.container = new PIXI.Container();

  this.container.addChild(this.characterBig.container);
  // this.container.addChild( this.characterSmall.container );

  this.left = this.left.bind(this);
  this.right = this.right.bind(this);
  // this.small = this.small.bind( this );

  //Remove Adoring

  //   this.adoringLookTimeline = new TimelineMax({
  //     onComplete: this.onAdoringLookComplete,
  //     onCompleteScope: this,
  //   });

  //   if (aaf.common.url.look) {
  //     this.adoringLookTimeline.delay(1);
  //   } else {
  //     this.adoringLookTimeline.delay(5);
  //   }

  //   this.adoringLookTimeline.to(
  //     this.characterBig.lookDirection,
  //     1.2,
  //     { x: 25 * 2, y: 9 * 2, ease: Quad.inOut },
  //     0
  //   );
  //   this.adoringLookTimeline.to(
  //     this.characterBig.lookDirection,
  //     1.0,
  //     { x: 0, y: 0, ease: Quad.inOut },
  //     3.0
  //   );

  //   this.adoringLookTimeline.to(
  //     this.characterSmall.lookDirection,
  //     1.0,
  //     { x: -20 * 2, y: -5 * 2, ease: Quad.inOut },
  //     0
  //   );
  //   this.adoringLookTimeline.to(
  //     this.characterSmall.lookDirection,
  //     1.0,
  //     { x: 0, y: 0, ease: Quad.inOut },
  //     3.0
  //   );
};

musicbox.CharacterPair.prototype.onAdoringLookComplete = function () {
  if (aaf.common.url.look) {
    this.adoringLookTimeline.delay(1);
  } else {
    this.adoringLookTimeline.delay(aaf.random(15, 30));
  }

  this.adoringLookTimeline.restart(true);
};

musicbox.CharacterPair.prototype.left = function (t) {
  this.characterBig.strikeLeft(t);
};

musicbox.CharacterPair.prototype.right = function (t) {
  this.characterBig.strikeRight(t);
};

// musicbox.CharacterPair.prototype.small = function( t ) {
//     this.characterSmall.strikeBoth( t );
// };

var defaults = aaf.utils.defaults;

musicbox.EasyPIXI = function (options) {
  options = defaults(options, {
    fullscreen: true,

    width: window.innerWidth, // ignored if fullscreen is true
    height: window.innerHeight, // ignored if fullscreen is true

    antialiasing: aaf.common.ua.pixelRatio === 1,
    resolution: aaf.common.ua.pixelRatio,
    // backgroundColor: 0xffffff,
    transparent: true,

    container: document.getElementById("container"),
  });

  PIXI.ticker.shared.autoStart = false;
  PIXI.ticker.shared.stop();

  this.renderer = PIXI.autoDetectRenderer(options.width, options.height, {
    antialias: true,
    transparent: true,
    resolution: options.resolution,
    backgroundColor: options.backgroundColor,
  });

  this.stage = new PIXI.Container();

  if (options.fullscreen) {
    window.addEventListener("resize", this.resizeFullscreen.bind(this));
    this.resizeFullscreen();
  } else {
    this.setSize(options.width, options.height);
  }

  this.render();
  // options.container.appendChild( this.renderer.view );
};

musicbox.EasyPIXI.prototype.resizeFullscreen = function () {
  this.setSize(window.innerWidth, window.innerHeight);
};

musicbox.EasyPIXI.prototype.setSize = function (width, height) {
  this.width = width;
  this.height = height;

  this.renderer.resize(width, height);
  this.renderer.view.style.width = width + "px";
  this.renderer.view.style.height = height + "px";
};

musicbox.EasyPIXI.prototype.render = function () {
  this.renderer.render(this.stage);
};
musicbox.MultiSequencer = function (sequencers) {
  this.sequencers = [];
  this.activeSequencerIndex = 0;
  this.activeSequencer = undefined;

  this.domElement = document.createElement("div");
  this.domElement.className = "multi-sequencer";

  for (var i = 0, l = sequencers.length; i < l; i++) {
    var sequencer = sequencers[i];
    sequencer.active = false;
    this.sequencers.push(sequencer);
    sequencerArr.push(sequencer)
    // this.domElement.appendChild(sequencer.domElement);
  }

  this.setActiveSequencer(this.sequencers[0]);

  this.playPause = document.createElement("div");
  this.playPause.className = "puck-button play-pause";

  this.playPauseListener = new musicbox.PressListener(
    this.playPause,
    function () {
      // ios needs Transport.start() in a touch event.
      if (!this.transportStarted) {
        this.transportStarted = true;
        Tone.Transport.swing = aaf.common.url.number("swing", 0.0);
        // Tone.Transport.start();
        // just play it reaaaalllly quiet ( ios hack )
        this.activeSequencer.triggerSample(2, 0.001);
      }

      if(!this.audio){
        this.audio = document.getElementById("bcAudio");
        this.audio.loop = true;
      }
      this.playing ? this.pause() : this.play();
      if (this.playing) {
        let randomIndex = 1;
        if(this.activeSequencerIndex == 1)  randomIndex = Math.floor(Math.random() * 2);

        // this.audio.src = `/assets/music/dynamics/${this.activeSequencerIndex + 1}/${randomIndex + 1}.mp3`;
        this.audio.src = `/assets/music/dynamics/${this.activeSequencerIndex + 1}/${document.getElementById("songSelect").value}.mp3`;

        console.log(document.getElementById("songSelect").value);



        const row_array = this.activeSequencerIndex;
        const column_array = randomIndex;
        // this.audio.playbackRate = bpmArray[row_array][column_array];
        this.audio.playbackRate = document.getElementById("songBPM").value;

        const startAndLoopAudio = () => {
          this.audio.currentTime = document.getElementById("songCut").value;
          this.audio.play();
      
          // After 30 seconds, stop and restart
          // this.loopTimeout = setTimeout(() => {
          // if (this.playing) {
          //   this.audio.pause();
          //   startAndLoopAudio(); // Restart again
          // }
          // }, (intervalArray[row_array][column_array] - intervalArray[row_array][column_array] % (1.5 / (this.activeSequencerIndex + 1))) * 1000);
        };
        // Start after optional delay
        this.loopTimeout = setTimeout(() => {
          startAndLoopAudio();
        // }, delayArray[row_array][column_array]);
        }, document.getElementById("songDelay").value);
          
      }
      if(!this.playing){
        this.audio.pause();
        clearTimeout(this.loopTimeout);
      }
    }.bind(this)
  );

  this.domElement.appendChild(this.playPause);

  this.playing = false;

  this.play = this.play.bind(this);

  Tone.Transport.loop = true;

  this.transportStarted = false;
};

aaf.utils.Events.mixTo(musicbox.MultiSequencer.prototype);

musicbox.MultiSequencer.prototype.update = function () {
  if (this.playing) this.activeSequencer.update();
};

musicbox.MultiSequencer.prototype.placeSong = function () {
  console.log("hi");
};

musicbox.MultiSequencer.prototype.setActiveSequencer = function (seq) {
  var playing = this.playing;

  clearTimeout(this.playTimeout);

  if (playing) {
    this.pause(true);
  }

  if (this.activeSequencer) {
    this.activeSequencer.active = false;
    this.activeSequencer.domElement.classList.remove("active");
  }

  this.activeSequencer = seq;
  this.activeSequencer.domElement.classList.add("active");

  if (playing) {
    this.play();
  }

  var prevIndex = this.activeSequencerIndex;

  this.fire("change", this.activeSequencerIndex, prevIndex);

  this.activeSequencerIndex = this.sequencers.indexOf(seq);

  this.activeSequencer.active = true;
};

musicbox.MultiSequencer.prototype.prev = function () {};

musicbox.MultiSequencer.prototype.next = function () {
  var i = (this.activeSequencerIndex + 1) % this.sequencers.length;
  this.setActiveSequencer(this.sequencers[i]);
};

musicbox.MultiSequencer.prototype.play = function () {
  this.domElement.classList.add("playing");
  this.domElement.classList.remove("suspended");
  this.activeSequencer.start();
  this.playing = true;

  this.fire("play");
};

musicbox.MultiSequencer.prototype.pause = function (suspend) {
  if (suspend) {
    this.domElement.classList.add("suspended");
  }

  this.domElement.classList.remove("playing");

  if (this.activeSequencer) this.activeSequencer.stop();

  this.playing = false;

  this.fire("pause");
};
musicbox.PressListener = function (el, listener) {
  this.el = el;

  this.listener = listener;

  this.onPress = this.onPress.bind(this);
  this.onRelease = this.onRelease.bind(this);

  this.on();
};

musicbox.PressListener.prototype.onPress = function (e) {
  e.preventDefault();
  this.el.classList.add("active");
};

musicbox.PressListener.prototype.onRelease = function (e) {
  e.preventDefault();

  this.listener();
  this.el.classList.remove("active");
};

musicbox.PressListener.prototype.on = function () {
  this.active = true;

  this.el.addEventListener("touchstart", this.onPress, false);
  this.el.addEventListener("touchend", this.onRelease, false);

  this.el.addEventListener("mousedown", this.onPress, false);
  this.el.addEventListener("mouseup", this.onRelease, false);
};

musicbox.PressListener.prototype.off = function () {
  this.active = false;

  this.el.removeEventListener("touchstart", this.onPress, false);
  this.el.removeEventListener("touchend", this.onRelease, false);

  this.el.removeEventListener("mousedown", this.onPress, false);
  this.el.removeEventListener("mouseup", this.onRelease, false);
};
musicbox.Sequencer = function (opts) {
  opts = aaf.utils.defaults(opts, {
    listeners: [aaf.common.noop, aaf.common.noop, aaf.common.noop],

    symbols: [
      "assets/image/ui_timpani1.svg",
      "assets/image/ui_timpani2.svg",
      "assets/image/ui_timpani3.svg",
    ],

    tracks: [],
    randomize: true, // ignored if tracks are provided

    beats: 8,
    timeSignature: 4,
    bpm: 100,
  });

  this.samples = opts.samples;
  this.beats = opts.beats;
  this.timeSignature = opts.timeSignature;
  this.bpm = opts.bpm;

  this.tracks = [];

  this.position = 0;
  this.playing = false;

  var samplePaths = {};
  var synthParams = {
    envelope: {
      // release: 0.2
    },
  };

  this.listeners = opts.listeners;
  this.trackNames = [];

  this.animateNoteListeners = {};
  this.needsAnimate = {};

  for (var i = 0, l = this.samples.length; i < l; i++) {
    var track;

    if (opts.tracks) {
      track = opts.tracks[i];
    } else if (opts.randomize) {
      track = aaf.utils.array.fill(new Array(this.beats), false);

      for (var j = 0, k = track.length; j < k; j++) {
        track[j] = aaf.random.chance();
      }
    } else {
      track = aaf.utils.array.fill(new Array(this.beats), false);
    }

    this.tracks.push(track);

    this.trackNames.push(i.toString());
    samplePaths[i.toString()] = this.samples[i];

    this.needsAnimate[i] = aaf.utils.array.fill(new Array(this.beats), false);

    // Bound versions of each animate note method so we're not instantiating them every beat.
    var listeners = [];
    this.animateNoteListeners[i] = listeners;

    for (var b = 0; b < this.beats; b++) {
      listeners[b] = this.animateNote.bind(this, i, b);
    }
  }

  this.onInterval = this.onInterval.bind(this);

  //   this.onBlinking = this.onBlinking.bind(this);

  this.stepNumber = 0;
  this.loopNumber = 0;
  this.dragOperation = true;

  this.sampler = new Tone.PolySynth(1, Tone.Sampler, samplePaths, synthParams);
  this.sampler.noGC();

  this.buildDom(opts);

  // further hackiness, sequencer-padding-horizontal * 2 = 40
  // defined in sequencer.styl
  this.sequencerInnerWidth = this.domElement.offsetWidth - 40;

  this.sampler.toMaster();
};

musicbox.Sequencer.UI_MODE = aaf.common.url.ui || "css";
musicbox.Sequencer.USE_CSS_TRANSITIONS = aaf.common.url.boolean(
  "transition",
  true
);

// Audio
// -------------------------------

musicbox.Sequencer.prototype.start = function () {
  // hack: belongs in resize. sequencer-padding-horizontal * 2 = 40
  // defined in sequencer.styl

  this.sequencerInnerWidth = this.domElement.offsetWidth - 40;

  this.stepNumber = 0;

  var intervalLength = (this.beats / this.timeSignature) * 4 + "n";

  Tone.Transport.loopEnd = this.beats + "*8n";

  Tone.Transport.clear(this.intervalID);
  this.intervalID = Tone.Transport.scheduleRepeat(this.onInterval, "8n");
  this.time = 0;

  this.startTime = Tone.context.currentTime;
  this.prevTime = this.startTime;

  this.playing = true;

  Tone.Transport.timeSignature = this.timeSignature;
  Tone.Transport.bpm.value = this.bpm;
  this.measureLength = Tone.Transport.notationToSeconds("1m");

  this.sampler.volume.cancelScheduledValues();

  Tone.Transport.start();

  //this.sampler.volume.value = -100;
  //this.sampler.volume.setRampPoint();
  //this.sampler.volume.linearRampToValueAtTime( 0, '+4n' )
};

musicbox.Sequencer.prototype.stop = function () {
  this.playing = false;

  for (var i = 0, l = this.tracks.length; i < l; i++) {
    for (var j = 0; j < this.beats; j++) {
      this.triggerAnimation(i, j, false);
    }
  }

  this.sampler.volume.cancelScheduledValues();

  // this.sampler.volume.setRampPoint();
  // this.sampler.volume.linearRampToValueAtTime( -100, '+4n' )

  Tone.Transport.stop();
};

musicbox.Sequencer.prototype.animateNote = function (track, beat) {
  this.needsAnimate[track][beat] = true;

  setTimeout(
    function () {
      this.needsAnimate[track][beat] = false;
    }.bind(this),
    this.sampler.toSeconds("16n") * 1000
  );
};

musicbox.Sequencer.prototype.onInterval = function (time) {
  if (!this.playing) {
    return;
  }

  // see if there's any active beats at this step number
  var millis = (time - Tone.Transport.currentTime) * 1000;

  for (var i = 0, l = this.tracks.length; i < l; i++) {
    var track = this.tracks[i];
    var listener = this.listeners[i];

    if (track[this.stepNumber]) {
      this.sampler.triggerAttackRelease(this.trackNames[i], "1n", time);

      // TODO: create these listeners up front.
      // var listener = this.animateNote.bind( this, i, this.stepNumber );

      // schedule beat animation
      setTimeout(this.animateNoteListeners[i][this.stepNumber], millis);
      listener(0.1);
    }
  }
  if (isStart == 0) {
    this.stepNumber = 0;
    this.loopNumber = 0;
    isStart = 1;
  }
  // advance step number
  this.stepNumber++;

  if (this.stepNumber % this.beats == 1) {
    onBlinking(this.loopNumber);
    changeDynamics(this.loopNumber);
    this.loopNumber++;
    // console.log("blink", this.loopNumber);
  }
  this.stepNumber %= this.beats;
};

function initInterval() {
  // console.log("paused");
  this.stepNumber = 0;
  this.loopNumber = 0;
  let zones = document.querySelectorAll(".drop-zone");
  zones.forEach((zone) => zone.classList.remove("blinking"));
}

function changeDynamics(index) {
  let zones = document.querySelectorAll(".drop-zone");
  let zone = zones[index % 4];
  if (!zone.getAttribute("data-index")) {
    statusDynamics = 1;
  } else {
    statusDynamics = 6 - zone.getAttribute("data-index");
  }
}

function onBlinking(number) {
  let zones = document.querySelectorAll(".drop-zone");
  zones.forEach((zone) => zone.classList.remove("blinking"));
  zones[number % 4].classList.add("blinking");
  let bcLevel = 0.1;
  if (zones[number % 4].getAttribute("data-index")) {

    // If the zone has a data-index attribute, use it to determine volume

    const zoneIndex = parseInt(zones[number % 4].getAttribute("data-index"));

    // Adjust formula as needed

    volumeLevel = -12 + (zoneIndex * 2); 
    bcLevel = 0.03 + ((zoneIndex-1) * 0.19);
  

  } else {
    volumeLevel = 0;
  }
  
  // Control volume of sequencer
  const currentIndex = window.carousel.activeChildIndex;
  const sequencer = sequencerArr[currentIndex];
  sequencer.sampler.volume.value = volumeLevel

  // Control volume of background music
  this.audio = document.getElementById("bcAudio");
  this.audio.volume = bcLevel;
  console.log(bcLevel);
}

// UI
// -------------------------------

musicbox.Sequencer.prototype.update = function () {
  if (!this.playing) return;

  // Android gives really shitty audio update rates, makes the playhead look choppy.
  // Check to see if the audio context reports two of the same currentTimes in a row
  // and then manually smooth the playhead using loop delta.

  var t = Tone.context.currentTime;

  // if ( t === this.prevTime ) {
  //     this.time += aaf.common.loop.delta;
  // } else {
  //     this.time = Math.max( t, this.time );
  // }

  this.prevTime = t;

  // update sequencer "position" ( 0-1 progress through the measure )

  this.position = Tone.Transport.progress; //( this.time - this.startTime ) / this.measureLength % 1;

  // update playhead display

  if (musicbox.Sequencer.UI_MODE === "css") this.updateStyles();
};

musicbox.Sequencer.prototype.updateStyles = function () {
  var str = "translate3d(";
  str += this.position * this.sequencerInnerWidth;
  str += "px, 0, 0 )";

  for (var i in this.needsAnimate) {
    for (var j in this.needsAnimate[i]) {
      var val = this.needsAnimate[i][j];
      if (val !== undefined) {
        this.triggerAnimation(i, j, val);
      }
    }
  }

  this.playhead.style.transform = this.playhead.style.webkitTransform = str;

  for (var i in this.needsAnimate) {
    for (var j in this.needsAnimate[i]) {
      this.needsAnimate[i][j] = undefined;
    }
  }
};

musicbox.Sequencer.prototype.triggerAnimation = function (i, j, val) {
  var symbol = this.slotElements[i][j].__symbol;

  symbol.style.webkitTransform = symbol.style.transform = val
    ? "scale( 1.5 )"
    : "";

  symbol.style.webkitTransitionDuration = symbol.style.transitionDuration =
    val || !musicbox.Sequencer.USE_CSS_TRANSITIONS ? "0s" : "";
};

musicbox.Sequencer.prototype.buildDom = function (opts) {
  this.domElement = document.createElement("div");
  this.domElement.className = "sequencer";

  this.slotElements = [];

  // create track rows

  for (var track = 0, l = this.tracks.length; track < l; track++) {
    var row = document.createElement("div");
    row.className = "row";

    var elements = [];

    // create track beat slots

    for (var beat = 0; beat < this.beats; beat++) {
      var slot = document.createElement("div");
      slot.className = "slot";

      var symbol = document.createElement("div");
      symbol.style.backgroundImage = "url( " + opts.symbols[track] + " )";
      symbol.className = "symbol";

      // convenience access to per-beat get/setter methods
      slot.__symbol = symbol;
      slot.__setBeat = this.setBeat.bind(this, track, beat, slot);
      slot.__getBeat = this.getBeat.bind(this, track, beat);

      var toggle = this.touchSlot.bind(this, track, beat, slot);

      // update initial display
      slot.__setBeat(this.tracks[track][beat], true);

      slot.appendChild(symbol);
      row.appendChild(slot);
      elements.push(slot);

      slot.addEventListener(
        aaf.common.ua.touch ? "touchstart" : "mousedown",
        toggle,
        false
      );
    }

    this.domElement.appendChild(row);
    this.slotElements.push(elements);
  }

  // playhead

  this.playhead = document.createElement("div");
  this.playhead.className = "playhead";

  //Remove Playhead loop
  // this.domElement.appendChild( this.playhead );

  // make drag listener

  var hover, prevHover;

  // lil hacky, set by multisequencer
  this.active = true;

  aaf.common.pointer.on(
    "drag",
    function (x, y) {
      if (!this.active) return;

      prevHover = hover;
      hover = document.elementFromPoint(x, y);

      // __setBeat is sort of dirty duck typing to make sure we're
      // even talking about a slot on the sequencer.
      if (hover && hover !== prevHover && hover.__setBeat) {
        hover.__setBeat(this.dragOperation);
      }
    },
    this
  );
};

musicbox.Sequencer.prototype.touchSlot = function (track, beat, el, val) {
  this.dragOperation = this.toggleBeat(track, beat, el, val);
};

musicbox.Sequencer.prototype.setBeat = function (
  track,
  beat,
  el,
  val,
  suppressSample
) {
  var same = this.tracks[track][beat] === val;

  this.tracks[track][beat] = val;
  el.__symbol.classList.toggle("active", val);

  if (val && !same && !this.playing && suppressSample !== true) {
    this.triggerSample(track);
    this.listeners[track](0.15);
  }

  return val;
};

musicbox.Sequencer.prototype.triggerSample = function (track, vel) {
  if (vel === undefined) {
    vel = 1;
  }
  Tone.Transport.clear(this.intervalID);
  this.sampler.volume.value = volumeLevel; // volume is in dB so this actually unmutes
  this.sampler.triggerAttackRelease(
    this.trackNames[track],
    "1n",
    Tone.context.currentTime,
    vel
  );
};

musicbox.Sequencer.prototype.getBeat = function (track, beat) {
  return this.tracks[track][beat];
};

musicbox.Sequencer.prototype.toggleBeat = function (track, beat, el) {
  return this.setBeat(track, beat, el, !this.getBeat(track, beat));
};

// Perform mobile touchstart operations
(function () {
  var ua = navigator.userAgent;
  var isTouch = "ontouchstart" in document.documentElement;
  var ios = ua.match(/iPhone|iPad|iPod/i);
  var outerDiv = document.createElement("div");
  var innerDiv = document.createElement("div");

  var style = document.createElement("style");
  style.innerText = "#start:active, #start:focus { transform: scale(1.1); };";
  document.head.appendChild(style);

  if (isTouch || ios) {
    outerDiv.style.top = 0;
    outerDiv.style.left = 0;
    outerDiv.style.position = "absolute";
    outerDiv.style.height = "100%";
    outerDiv.style.width = "100%";
    outerDiv.style.textAlign = "center";
    outerDiv.style.zIndex = 99999;

    innerDiv.style.borderRadius = "5px";
    innerDiv.style.font = "normal 4vmin/6vmin Poppins, Helvetica, Arial";
    innerDiv.style.color = "white";
    innerDiv.style.margin = "0 auto";
    innerDiv.style.zIndex = 999;
    innerDiv.style.textAlign = "center";
    innerDiv.style.padding = "10px";

    if (ios) {
      innerDiv.style.background = "#707070";
      innerDiv.style.marginTop = "15%";
      innerDiv.style.width = "75%";
      innerDiv.innerText =
        "Heads up — if you have your iOS device in Silent Mode, audio playback is affected.";
    } else {
      outerDiv.style.display = "flex";
      outerDiv.style.alignItems = "center";
      outerDiv.style.background = "#fff";
      innerDiv.style.padding = "0";
      innerDiv.id = "start";
      innerDiv.style.width = "5pc";
      innerDiv.style.height = "5pc";
      innerDiv.style.display = "flex";
      innerDiv.style.alignItems = "center";
      innerDiv.style.justifyContent = "center";
      innerDiv.style.lineHeight = "5pc";
      innerDiv.style.backgroundColor = "#fff";
      innerDiv.style.boxShadow = "0 0 10px 0 rgba(0, 0, 0, 0.4)";
      innerDiv.style.borderRadius = "50%";
      innerDiv.style.color = "#646464";
      innerDiv.style.transition = "transform .05s ease-in";
      innerDiv.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
    }

    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);
  }

  var start = !ios && isTouch ? document.querySelector("#start") : window;
  var event = !ios && isTouch ? "touchend" : "touchstart";

  start.addEventListener(
    event,
    function firstTouch() {
      innerDiv.style.display = "none";

      setTimeout(function () {
        outerDiv.style.display = "none";
      }, 50);

      if (Tone.context.state !== "running") {
        Tone.context.resume();
      }

      start.removeEventListener(event, firstTouch, false);
    },
    false
  );
})();

musicbox.config.conga.characterBig = {
  position: {
    x: 820,
    y: 750,
  },

  strikeLeft: {
    anticipation: 0.15,
  },

  eyes: {
    position: {
      x: 0,
      y: -215,
    },
  },

  hitbox: {
    left: {
      x: -300,
      y: -600,
      width: 500,
      height: 1200,
    },
    right: {
      x: 200,
      y: -600,
      width: 430,
      height: 1200,
    },
  },

  strikeRight: {
    anticipation: 0.15,
  },

  armLeft: {
    texture: "texture/slices_conga-big-arm-left.png",
    position: { x: -30, y: -3 },
    animation: {
      rotation: {
        file: "json/conga-big-arm-left.json",
        layer: "C_guy1 armL-rotation",
      },
    },
  },

  armRight: {
    texture: "texture/slices_conga-big-arm-right.png",
    position: { x: 120, y: -3 },
    animation: {
      rotation: {
        file: "json/conga-big-arm-right.json",
        layer: "C_guy1 armR-rotation",
      },
    },
  },

  body: {
    texture: "texture/slices_bird-big-body.png",
    position: { x: 175, y: 330 },
  },

  face: {
    texture: "texture/slices_bird-big-face.png",
    position: { x: -5, y: -180 },
  },

  front: {
    texture: "texture/slices_congas.png",
    position: { x: 180, y: 520 },
  },

  legs: {
    texture: "texture/slices_bird-big-legs.png",
    position: { x: 180, y: 300 },
  },
};

// musicbox.config.conga.characterSmall = {

//     position: {
//         x: 1300,
//         y: 920,
//     },

//     eyes: {
//         position: {
//             x: 0,
//             y: -105
//         },
//         scale: 0.79
//     },

//     hitbox: {
//         small: {
//             x: -70,
//             y: -500,
//             width: 500,
//             height: 900
//         }
//     },

//     strikeBoth: {
//         anticipation: 0.15
//     },

//     armLeft: {
//         texture: 'texture/slices_conga-little-arm-left.png',
//         position: { x: 0, y: 0 },
//         animation: {
//             rotation: { file: 'json/conga-little-arms.json', layer: 'C_guy2 armL-rotation' }
//         }
//     },

//     stickLeft: {
//         texture: 'texture/slices_conga-little-stick-left.png',
//         position: { x: -16, y: 10 },
//         behindArms: true,
//         animation: {
//             rotation: { file: 'json/conga-little-arms.json', layer: 'C_guy2 stickL-rotation' }
//         }
//     },

//     armRight: {
//         texture: 'texture/slices_conga-little-arm-right.png',
//         position: { x: 85, y: 0 },
//         back: true,
//         animation: {
//             rotation: { file: 'json/conga-little-arms.json', layer: 'C_guy2 armR-rotation' }
//         }
//     },

//     face: {
//         texture: 'texture/slices_bird-little-face.png',
//         position: { x: -0, y: -80 }
//     },

//     body: {
//         texture: 'texture/slices_bird-little-body.png',
//         position: { x: 160, y: 200 }
//     },

//     legs: {
//         texture: 'texture/slices_bird-little-legs.png',
//         position: { x: 160, y: 200 }
//     }

// };

musicbox.config.conga.sequencer = {
  beats: 8,
  timeSignature: 6,
  bpm: 80,

  samples: [
    // 'assets/sample/conga-cowbell.mp3',
    "assets/sample/conga-high.mp3",
    "assets/sample/conga-low.mp3",
  ],

  symbols: [
    // 'assets/image/ui_congas1.svg',
    "assets/image/ui_congas2.svg",
    "assets/image/ui_congas3.svg",
  ],

  order: [
    // 'small',
    "left",
    "right",
  ],

  tracks: [
    [1, 1, 1, 1, 1, 1, 1, 1], // [0,0,0,1,0,0,0,0,1,0,0,1],
    [1, 1, 1, 1, 1, 1, 1, 1], // [1,0,0,0,0,0,1,1,0,0,1,0]
  ],
};

musicbox.config.kit.characterBig = {
  strikeLeft: {
    anticipation: 0.25,
  },

  strikeRight: {
    anticipation: 0.25,
  },

  armLeft: {
    texture: "texture/slices_drum-big-arm-left.png",
    position: { x: 0, y: 0 },
    animation: {
      rotation: {
        file: "json/drum-big-arms.json",
        layer: "C_guy1 armL-rotation",
      },
    },
  },

  stickLeft: {
    texture: "texture/slices_drum-big-stick-left.png",
    position: { x: -40, y: -12 },
    behindArms: true,
    animation: {
      rotation: {
        file: "json/drum-big-arms.json",
        layer: "C_guy1 stickL-rotation",
      },
    },
  },

  armRight: {
    texture: "texture/slices_drum-big-arm-right.png",
    position: { x: 120, y: 0 },
    animation: {
      rotation: {
        file: "json/drum-big-arms.json",
        layer: "C_guy1 armR-rotation",
      },
    },
  },

  stickRight: {
    texture: "texture/slices_drum-big-stick-right.png",
    position: { x: 29, y: 29 },
    behindArms: true,
    animation: {
      rotation: {
        file: "json/drum-big-arms.json",
        layer: "C_guy1 stickR-rotation",
      },
    },
  },

  position: {
    x: 750,
    y: 740,
  },

  hitbox: {
    left: {
      x: 300,
      y: -600,
      width: 350,
      height: 1200,
    },
    right: {
      x: -200,
      y: -600,
      width: 500,
      height: 1200,
    },
  },

  eyes: {
    position: {
      x: -10,
      y: -250,
    },
  },

  body: {
    texture: "texture/slices_monster-big-body.png",
    position: { x: 280, y: 300 },
  },

  front: {
    texture: "texture/slices_drum-kit.png",
    position: { x: 220, y: 500 },
    behindArms: true,
  },

  legs: {
    texture: "texture/slices_monster-big-legs.png",
    position: { x: 280, y: 230 },
  },
};
// musicbox.config.kit.characterSmall = {

//     position: {
//         x: 1200,
//         y: 920,
//     },

//     eyes: {
//         position: {
//             x: 4,
//             y: -135
//         },
//         scale: 0.79
//     },

//     hitbox: {
//         small: {
//             x: -100,
//             y: -500,
//             width: 650,
//             height: 900
//         }
//     },

//     strikeBoth: {
//         anticipation: 0.15
//     },

//     armLeft: {
//         texture: 'texture/slices_drum-little-arm-left.png',
//         position: { x: 0, y: 0 },
//         animation: {
//             rotation: {
//                 file: 'json/drum-little-arms.json',
//                 layer: 'C_guy2 armL-rotation'
//             }
//         }
//     },

//     stickRight: {
//         texture: 'texture/slices_drum-little-stick-right.png',
//         position: { x: 13, y: -11 },
//         animation: {
//             rotation: {
//                 file: 'json/drum-little-arms.json',
//                 layer: 'C_guy2 mallet-rotation'
//             }
//         }
//     },

//     armRight: {
//         texture: 'texture/slices_drum-little-arm-right.png',
//         position: { x: 75, y: 0 },
//         animation: {
//             rotation: {
//                 file: 'json/drum-little-arms.json',
//                 layer: 'C_guy2 armR-rotation'
//             }
//         }
//     },

//     body: {
//         texture: 'texture/slices_monster-little-body.png',
//         position: { x: 150, y: 180 }
//     },

//     front: {
//         texture: 'texture/slices_bass-drum.png',
//         position: { x: 150, y: 350 }
//     },

//     legs: {
//         texture: 'texture/slices_monster-little-legs.png',
//         position: { x: 150, y: 170 }
//     }

// }

musicbox.config.kit.sequencer = {
  beats: 4,
  timeSignature: 4,
  bpm: 40,

  samples: [
    "assets/sample/kit-hat.mp3",
    "assets/sample/kit-snare.mp3",
    // 'assets/sample/kit-tom.mp3'
  ],
  symbols: [
    "assets/image/ui_drums1.svg",
    "assets/image/ui_drums2.svg",
    // 'assets/image/ui_drums3.svg'
  ],

  order: [
    "right",
    "left",
    // 'small'
  ],

  tracks: [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
};

musicbox.config.timpani.characterBig = {
  position: {
    x: 800,
    y: 790,
  },

  hitbox: {
    left: {
      x: -300,
      y: -600,
      width: 500,
      height: 1200,
    },
    right: {
      x: 200,
      y: -600,
      width: 500,
      height: 1200,
    },
  },

  face: {
    texture: "texture/slices_monkey-big-face.png",
    position: { x: 12, y: -230 },
  },

  strikeLeft: {
    anticipation: 0.15,
  },

  strikeRight: {
    anticipation: 0.3,
  },

  eyes: {
    position: {
      x: 15,
      y: -255,
    },
    color: 0x100d11,
  },

  armLeft: {
    texture: "texture/slices_timpani-big-arm-left.png",
    position: { x: 0, y: 0 },
    animation: {
      rotation: {
        file: "json/timpani-big-arm-left.json",
        layer: "C_guy1 armL-rotation",
      },
    },
  },

  stickLeft: {
    texture: "texture/slices_timpani-big-stick-left.png",
    position: { x: -25, y: -15 },
    animation: {
      rotation: {
        file: "json/timpani-big-arm-left.json",
        layer: "C_guy1 malletL-rotation",
      },
    },
  },

  armRight: {
    texture: "texture/slices_timpani-big-arm-right.png",
    position: { x: 110, y: 0 },
    animation: {
      rotation: {
        file: "json/timpani-big-arm-right.json",
        layer: "C_guy1 armR-rotation",
      },
      position: {
        file: "json/timpani-big-arm-right.json",
        layer: "C_guy1 armR-position",
      },
    },
  },

  stickRight: {
    texture: "texture/slices_timpani-big-stick-right.png",
    position: { x: -15, y: 17 },
    animation: {
      rotation: {
        file: "json/timpani-big-arm-right.json",
        layer: "C_guy1 malletR-rotation",
      },
    },
  },

  body: {
    texture: "texture/slices_monkey-big-body.png",
    position: { x: 220, y: 260 },
  },

  front: {
    texture: "texture/slices_timpanis.png",
    position: { x: 220, y: 550 },
    behindArms: true,
  },

  legs: {
    texture: "texture/slices_monkey-big-legs.png",
    position: { x: 220, y: 240 },
  },
};

// musicbox.config.timpani.characterSmall = {

//     position: {
//         x: 1400,
//         y: 1000,
//     },

//     eyes: {
//         position: {
//             x: 0,
//             y: -195
//         },
//         scale: 0.79,
//         color: 0x100d11
//     },

//     hitbox: {
//         small: {
//             x: -150,
//             y: -500,
//             width: 650,
//             height: 900
//         }
//     },

//     face: {
//         texture: 'texture/slices_monkey-little-face.png',
//         position: { x: 0, y: -170 }
//     },

//     strikeBoth: {
//         sample: 'sample/timpani-triangle.mp3',
//         anticipation: 0.25
//     },

//     armLeft: {
//         texture: 'texture/slices_timpani-little-arm-left.png',
//         position: { x: 0, y: 0 },
//         animation: {
//             rotation: { file: 'json/timpani-little-arms.json', layer: 'C_guy2 armL-rotation' }
//         }
//     },

//     stickLeft: {
//         texture: 'texture/slices_timpani-little-stick-left.png',
//         position: { x: -5, y: 12 },
//         animation: {
//             rotation: { file: 'json/timpani-little-arms.json', layer: 'C_guy2 stickL-rotation' }
//         }
//     },

//     armRight: {
//         texture: 'texture/slices_timpani-little-arm-right.png',
//         position: { x: 58, y: 0 },
//         animation: {
//             rotation: { file: 'json/timpani-little-arms.json', layer: 'C_guy2 armR-rotation' }
//         }
//     },

//     stickRight: {
//         texture: 'texture/slices_timpani-little-stick-right.png',
//         position: { x: 15, y: -5 },
//         animation: {
//             rotation: { file: 'json/timpani-little-arms.json', layer: 'C_guy2 chime holder-rotation' }
//         }
//     },

//     body: {
//         texture: 'texture/slices_monkey-little-body.png',
//         position: { x: 120, y: 135 }
//     },

//     legs: {
//         texture: 'texture/slices_monkey-little-legs.png',
//         position: { x: 125, y: 120 }
//     }

// };

musicbox.config.timpani.sequencer = {
  beats: 4,
  timeSignature: 3,
  bpm: 32.5,

  samples: [
    // 'assets/sample/timpani-triangle.mp3',
    "assets/sample/timpani-high.mp3",
    "assets/sample/timpani-low.mp3",
  ],

  symbols: [
    // 'assets/image/ui_timpani1.svg',
    "assets/image/ui_timpani2.svg",
    "assets/image/ui_timpani3.svg",
  ],

  order: [
    // 'small',
    "left",
    "right",
  ],

  tracks: [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ],
};
musicbox.config.woodblock.characterBig = {
  position: {
    x: 800,
    y: 810,
  },

  hitbox: {
    left: {
      x: -300,
      y: -600,
      width: 500,
      height: 1200,
    },
    right: {
      x: 200,
      y: -600,
      width: 470,
      height: 1200,
    },
  },

  strikeLeft: {
    sample: "sample/timpani-low.mp3",
    anticipation: 0.15,
  },

  strikeRight: {
    sample: "sample/timpani-high.mp3",
    anticipation: 0.3,
  },

  eyes: {
    position: { x: -5, y: -260 },
    scale: 1.1,
  },

  armLeft: {
    texture: "texture/slices_robot-big-arm-left.png",
    position: { x: -3, y: 1 },
    animation: {
      rotation: {
        file: "json/robot-big-arm-left.json",
        layer: "guy1 armL-rotation",
      },
    },
  },

  stickLeft: {
    texture: "texture/slices_robot-big-stick-left.png",
    position: { x: -22, y: 23 },
    animation: {
      rotation: {
        file: "json/robot-big-arm-left.json",
        layer: "guy1 malletL-rotation",
      },
    },
  },

  armRight: {
    texture: "texture/slices_robot-big-arm-right.png",
    position: { x: 105, y: 1 },
    animation: {
      rotation: {
        file: "json/robot-big-arm-right.json",
        layer: "guy1 armR-rotation",
      },
    },
  },

  stickRight: {
    texture: "texture/slices_robot-big-stick-right.png",
    position: { x: 25, y: 26 },
    animation: {
      rotation: {
        file: "json/robot-big-arm-right.json",
        layer: "guy1 malletR-rotation",
      },
    },
  },

  face: {
    texture: "texture/slices_robot-big-face.png",
    position: { x: -10, y: -265 },
  },

  body: {
    texture: "texture/slices_robot-big-body.png",
    position: { x: 220, y: 260 },
  },

  front: {
    texture: "texture/slices_woodblocks.png",
    position: { x: 210, y: 460 },
  },

  legs: {
    texture: "texture/slices_robot-big-legs.png",
    position: { x: 210, y: 210 },
  },
};

// musicbox.config.woodblock.characterSmall = {

//     position: {
//         x: 1340,
//         y: 1050,
//     },

//     strikeBoth: {
//         anticipation: 0.25
//     },

//     hitbox: {
//         small: {
//             x: -110,
//             y: -500,
//             width: 530,
//             height: 800
//         }
//     },

//     armLeft: {
//         texture: 'texture/slices_robot-little-arm-left.png',
//         position: { x: 1, y: 1 },
//         animation: {
//             rotation: { file: 'json/robot-little-arms.json', layer: 'guy2 armL-rotation' }
//         }
//     },

//     stickLeft: {
//         texture: 'texture/slices_robot-little-stick-left.png',
//         position: { x: 10, y: 8 },
//         behindArms: true,
//         animation: {
//             rotation: { file: 'json/robot-little-arms.json', layer: 'guy2 stickL-rotation' }
//         }
//     },

//     armRight: {
//         texture: 'texture/slices_robot-little-arm-right.png',
//         position: { x: 55, y: 0 },
//         animation: {
//             rotation: { file: 'json/robot-little-arms.json', layer: 'guy2 armR-rotation' }
//         }
//     },

//     stickRight: {
//         texture: 'texture/slices_robot-little-stick-right.png',
//         position: { x: -9, y: 15 },
//         behindArms: true,
//         animation: {
//             rotation: { file: 'json/robot-little-arms.json', layer: 'guy2 stickR-rotation' }
//         }
//     },

//     body: {
//         texture: 'texture/slices_robot-little-body.png',
//         position: { x: 120, y: 135 }
//     },

//     legs: {
//         texture: 'texture/slices_robot-little-legs.png',
//         position: { x: 120, y: 118 }
//     },

//     face: {
//         texture: 'texture/slices_robot-little-face.png',
//         position: { x: -5, y: -200 }
//     },

//     eyes: {
//         position: { x: 0, y: -200 },
//         scale: 0.79
//     }

// };

musicbox.config.woodblock.sequencer = {
  beats: 8,
  timeSignature: 5,
  bpm: 60,

  samples: [
    // 'assets/sample/robot-clave.mp3',
    "assets/sample/robot-high.mp3",
    "assets/sample/robot-low.mp3",
  ],

  symbols: [
    // 'assets/image/ui_woodblocks1.svg',
    "assets/image/ui_woodblocks2.svg",
    "assets/image/ui_woodblocks3.svg",
  ],

  order: [
    // 'small',
    "right",
    "left",
  ],

  tracks: [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
};

document.getElementById("songSelect").addEventListener("change", function () {
  placeBPM();
});

placeBPM();
function placeBPM() {
  selectedSong = document.getElementById("songSelect").value;
  songBPM = bpmArray[selectedCharacter][selectedSong - 1];
  songDelay = delayArray[selectedCharacter][selectedSong - 1];

  document.getElementById("songBPM").value = songBPM;
  document.getElementById("songDelay").value = songDelay;
  // const songBPM = bpmArray[musicbox.MultiSequencer.activeSequencerIndex][selectedSong - 1];
}


//# sourceMappingURL=sourcemaps/lib.js.map

