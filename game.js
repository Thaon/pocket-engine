const StartGame = async () => {
  let pockety = new Pockety();
  pockety.debugCollisions = true;
  //load assets
  await pockety.LoadSprite("ship", "assets/Ship.jpg");
  await pockety.LoadSprite("asteroid", "assets/Asteroid.png");

  // create and configure entities
  const Ship = new Entity("ship");
  pockety.SetSprite(Ship, "ship", true, true);
  Ship.colliderRadius = 64;

  // setup custom property
  Ship.velocity = {
    x: 0,
    y: 0,
  };
  Ship.friction = 0.99;

  Ship.OnTouchDown = () => {
    console.log("Touched!");
  };

  Ship.Update = (deltaTime) => {
    Ship.x += Ship.velocity.x;
    Ship.y += Ship.velocity.y;
    Ship.velocity.x *= Ship.friction;
    Ship.velocity.y *= Ship.friction;
  };

  // add control buttons
  pockety.AddButton(
    "rotateLeftBtn",
    "left",
    20,
    pockety.canvas.height - 128,
    128,
    64,
    "#aaa",
    5,
    "center",
    () => {
      Ship.rotation -= 90 * pockety.deltaTime;
    }
  );
  pockety.AddButton(
    "rotateRightBtn",
    "right",
    150,
    pockety.canvas.height - 128,
    128,
    64,
    "#aaa",
    5,
    "center",
    () => {
      Ship.rotation += 90 * pockety.deltaTime;
    }
  );
  pockety.AddButton(
    "goForwardBtn",
    "up",
    pockety.canvas.width - 148,
    pockety.canvas.height - 128,
    128,
    64,
    "#aaa",
    5,
    "center",
    () => {
      let forward = Ship.GetForward(-90);
      Ship.velocity.x += forward.x * 5 * pockety.deltaTime;
      Ship.velocity.y += forward.y * 5 * pockety.deltaTime;
    }
  );

  // create and setup scene
  const scene = new Scene("game");
  scene.Instantiate(Ship, pockety.canvas.width / 2, pockety.canvas.height / 2);

  // start game
  pockety.Run(scene);
};
