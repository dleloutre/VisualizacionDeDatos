import * as THREE from "three";

export function generateTextSprite(text, color) {
  const borderColor = color;
  const fontFace = "Verdana";
  const fontSize = 45;
  const fontColor = "rgba(255, 255, 255, 0.8)";
  const textAlign = "center";
  const borderThickness = 10;
  const borderRadius = 10;
  const backgroundColor = "rgba(0, 0, 0, 0.3)";
  let ruler = document.createElement("canvas").getContext("2d");
  ruler.font = fontSize + "px " + fontFace;

  const metrics = ruler.measureText(text);
  const textWidth =  metrics.width;
  const textHeight = fontSize * 1.4;

  let canvas = document.createElement("canvas");
  canvas.width = _ceilPow2(textWidth + borderThickness * 2);
  canvas.height = _ceilPow2(textHeight + borderThickness * 2);
  let context = canvas.getContext("2d");

  context.font = ruler.font;
  context.fillStyle = backgroundColor;
  context.strokeStyle = borderColor;
  context.lineWidth = borderThickness;
  _roundRect(
    context,
    borderThickness / 2,
    borderThickness / 2,
    textWidth + borderThickness,
    textHeight + borderThickness,
    borderRadius
  );

  context.fillStyle = fontColor;
  context.textAlign = textAlign;
  var fillTextX = {
    left: borderThickness,
    start: borderThickness,
    center: textWidth / 2 + borderThickness,
    right: textWidth + borderThickness,
    end: textWidth + borderThickness,
  };
  var curY = fontSize + borderThickness;
  context.fillText(text, fillTextX[textAlign], curY);
  curY += fontSize * 1.4;

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    sizeAttenuation: false,
  });

  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width/3000, canvas.height/3000, 1);
  //sprite.material.rotation = -Math.PI/5

  return sprite;

  function _ceilPow2(num) {
    var i = 0;
    while (num > Math.pow(2, i)) {
      i++;
    }
    return Math.pow(2, i);
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
