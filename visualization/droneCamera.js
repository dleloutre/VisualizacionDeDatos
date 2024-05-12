import * as THREE from "three";

export function DroneCameraControl(camera, initialPos) {
  const MIN_Y = 1;

  const DELTA_TRASLACION_DEFAULT = 10; // velocidad de traslacion
  const DELTA_ROTACION_DEFAULT = 0.04; // velocidad de rotacion
  let DELTA_TRASLACION = 10; // velocidad de traslacion
  let DELTA_ROTACION = 0.04; // velocidad de rotacion
  const FACTOR_INERCIA = 0.05;
  const MIN_TRANSLATION_THRESHOLD = 0.02;

  if (!initialPos) initialPos = [0, 19000, 0];

  camera.position.set(initialPos[0], initialPos[1], initialPos[2]);
  camera.rotation.set(-Math.PI, 0, 0);

  let camInitialState = {
    xVel: 0,
    zVel: 0,
    yVel: 0,
    xVelTarget: 0,
    zVelTarget: 0,
    yVelTarget: 0,

    yRotVelTarget: 0,
    yRotVel: 0,
    zRotVelTarget: 0,
    zRotVel: 0,
    xRotVelTarget: -0.7*15,
    xRotVel: 0,

    rightAxisMode: "move",
  };

  let camState = Object.assign({}, camInitialState);

  // Eventos botones mobile
  document.getElementById("translation-buttons").addEventListener("touchstart", function(e) {
    switch(e.targetTouches[0].target.className) {
      case "arrow-btn right":
        console.log("right start")
        camState.xVelTarget = -DELTA_TRASLACION;
        break;
      case "arrow-btn.left":
        camState.xVelTarget = DELTA_TRASLACION;
        break;
      case "arrow-btn.up":
        camState.zVelTarget = -DELTA_TRASLACION;
        break;
      case "arrow-btn.down":
        camState.zVelTarget = DELTA_TRASLACION;
        break;
    }
  });

  document.getElementById("translation-buttons").addEventListener("touchend", function(e) {
    switch(e.targetTouches[0].target.className) {
      case "arrow-btn right":
        console.log("right end")
        camState.xVelTarget = 0;
        break;
      case "arrow-btn left":
        camState.xVelTarget = 0;
        break;
      case "arrow-btn up":
        camState.zVelTarget = 0;
        break;
      case "arrow-btn down":
        camState.zVelTarget = 0;
        break;
    }
  });

  document.getElementById("rotation-buttons").addEventListener("touchstart", function(e) {
    switch(e.targetTouches[0].target.className) {
      case "arrow-btn right":
        console.log("right2 start")
        camState.xVelTarget = -DELTA_ROTACION;
        break;
      case "arrow-btn left":
        camState.xVelTarget = DELTA_ROTACION;
        break;
      case "arrow-btn up":
        camState.zVelTarget = -DELTA_ROTACION;
        break;
      case "arrow-btn down":
        camState.zVelTarget = DELTA_ROTACION;
        break;
    }
  });

  document.getElementById("rotation-buttons").addEventListener("touchend", function(e) {
    switch(e.targetTouches[0].target.className) {
      case "arrow-btn right":
        console.log("right2 end")
        camState.xVelTarget = 0;
        break;
      case "arrow-btn.left":
        camState.xVelTarget = 0;
        break;
      case "arrow-btn.up":
        camState.zVelTarget = 0;
        break;
      case "arrow-btn.down":
        camState.zVelTarget = 0;
        break;
    }
  });

  // Eventos de teclado
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowUp":
      case "u": // up
        camState.zVelTarget = -DELTA_TRASLACION;
        break;
      case "ArrowDown":
      case "j": // down
        camState.zVelTarget = DELTA_TRASLACION;
        break;

      case "ArrowLeft":
      case "h": // left
        camState.xVelTarget = DELTA_TRASLACION;
        break;
      case "ArrowRight":
      case "k": // right
        camState.xVelTarget = -DELTA_TRASLACION;
        break;

      case "o":
      case "PageUp": // PgUp
        camState.yVelTarget = DELTA_TRASLACION;
        break;
      case "l":
      case "PageDown": // PgDw
        camState.yVelTarget = -DELTA_TRASLACION;
        break;

      case "s":
        camState.xRotVelTarget = DELTA_ROTACION;
        break;
      case "w":
        camState.xRotVelTarget = -DELTA_ROTACION;
        break;

      case "a":
        camState.yRotVelTarget = DELTA_ROTACION;
        break;
      case "d":
        camState.yRotVelTarget = -DELTA_ROTACION;
        break;

      case "q":
        camState.zRotVelTarget = DELTA_ROTACION;
        break;
      case "e":
        camState.zRotVelTarget = -DELTA_ROTACION;
        break;
      case "1":
        DELTA_TRASLACION = DELTA_TRASLACION_DEFAULT;
        DELTA_ROTACION = DELTA_ROTACION_DEFAULT;
        break;
      case "2":
        DELTA_TRASLACION = DELTA_TRASLACION_DEFAULT * 2;
        //DELTA_ROTACION = DELTA_ROTACION_DEFAULT * 2;
        break;
      case "3":
        DELTA_TRASLACION = DELTA_TRASLACION_DEFAULT * 4;
        //DELTA_ROTACION = DELTA_ROTACION_DEFAULT * 3;
        break;
      case "4":
        DELTA_TRASLACION = DELTA_TRASLACION_DEFAULT * 6;
        //DELTA_ROTACION = DELTA_ROTACION_DEFAULT * 3;
        break;
    }
  });

  document.addEventListener("keyup", function (e) {
    switch (e.key) {
      case "ArrowUp":
      case "u":
      case "ArrowDown":
      case "j":
        camState.zVelTarget = 0;
        break;

      case "ArrowLeft":
      case "h":
      case "ArrowRight":
      case "k":
        camState.xVelTarget = 0;
        break;

      case "o":
      case "l":
      case "PageDown":
      case "PageUp":
        camState.yVelTarget = 0;
        break;

      case "a":
        camState.yRotVelTarget = 0;
        break;
      case "d":
        camState.yRotVelTarget = 0;
        break;

      case "w":
        camState.xRotVelTarget = 0;
        break;
      case "s":
        camState.xRotVelTarget = 0;
        break;

      case "q":
        camState.zRotVelTarget = 0;
        break;
      case "e":
        camState.zRotVelTarget = 0;
        break;
    }
  });

  this.update = function () {
    camState.xVel += (camState.xVelTarget - camState.xVel) * FACTOR_INERCIA;
    camState.yVel += (camState.yVelTarget - camState.yVel) * FACTOR_INERCIA;
    camState.zVel += (camState.zVelTarget - camState.zVel) * FACTOR_INERCIA;

    camState.xRotVel +=
      (camState.xRotVelTarget - camState.xRotVel) * FACTOR_INERCIA;
    camState.yRotVel +=
      (camState.yRotVelTarget - camState.yRotVel) * FACTOR_INERCIA;
    camState.zRotVel +=
      (camState.zRotVelTarget - camState.zRotVel) * FACTOR_INERCIA;

    let translation = new THREE.Vector3(
      -camState.xVel,
      camState.yVel,
      camState.zVel
    );

    let maxTranslation = Math.max(
      Math.max(Math.abs(camState.xVel), Math.abs(camState.zVel)),
      Math.abs(camState.yVel)
    );
    let maxRotation = Math.max(
      Math.max(Math.abs(camState.xRotVel), Math.abs(camState.yRotVel)),
      Math.abs(camState.zRotVel)
    );

    let hasChanged = false;
    if (
      maxTranslation > MIN_TRANSLATION_THRESHOLD ||
      maxRotation > MIN_TRANSLATION_THRESHOLD
    ) {
      let forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(camera.quaternion);
      forward.normalize();
      forward.multiplyScalar(translation.z);

      let right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.normalize();
      right.multiplyScalar(translation.x);

      let up = new THREE.Vector3(0, 1, 0);
      up.applyQuaternion(camera.quaternion);
      up.normalize();
      up.multiplyScalar(translation.y);

      camera.position.add(forward);
      camera.position.add(right);
      camera.position.add(up);

      camera.rotation.order = "YXZ";

      let xVelAtenuation = Math.min(
        1,
        Math.max(0, -2 + 3 * (Math.abs(camera.rotation.x) / (Math.PI / 2)))
      );

      if (
        (camera.rotation.x > 0 && camState.xRotVel < 0) ||
        (camera.rotation.x < 0 && camState.xRotVel > 0)
      )
        xVelAtenuation = 0;

      camera.rotation.x += camState.xRotVel * (1 - xVelAtenuation);
      camera.rotation.y += camState.yRotVel;

      camera.rotation.x = Math.min(
        Math.PI / 2,
        Math.max(-Math.PI / 2, camera.rotation.x)
      );

      hasChanged = true;
    } else {
      hasChanged = false;
    }
    return hasChanged;
  };
}