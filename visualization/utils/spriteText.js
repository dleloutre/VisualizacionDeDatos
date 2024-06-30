import * as THREE from "three";

export function generateTextSprite(text, color, position) {
  const fontFace = "Verdana";
  const fontSize = 25;
  const fontColor = "rgba(255, 255, 255, 0.8)";
  const backgroundColor = "rgba(0, 0, 0, 0.3)";
  const circleRadius = fontSize / 4;
  const circleColor = color;
  const padding = fontSize / 4;

  let ruler = document.createElement("canvas").getContext("2d");
  ruler.font = fontSize + "px " + fontFace;

  const metrics = ruler.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.4;

  let canvas = document.createElement("canvas");
  canvas.width = _ceilPow2(textWidth + circleRadius * 2 + padding * 3);
  canvas.height = _ceilPow2(textHeight);
  let context = canvas.getContext("2d");

  context.font = ruler.font;
  context.fillStyle = backgroundColor;
  _roundRect(context, 0, 0, canvas.width, canvas.height, 0);

  context.beginPath();
  context.arc(circleRadius + padding, textHeight / 2, circleRadius, 0, Math.PI * 2);
  context.fillStyle = circleColor;
  context.fill();

  context.fillStyle = fontColor;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(text, circleRadius * 2 + padding * 2, textHeight / 2);

  let texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  let spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    sizeAttenuation: false,
  });

  let sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(position.x * 8, position.y * 8, position.z * 8);
  sprite.scale.set(canvas.width / 2000, canvas.height / 2000, 1);

  return sprite;

  function _ceilPow2(num) {
    var i = 0;
    while (num > Math.pow(2, i)) {
      i++;
    }
    return Math.pow(2, i);
  }

  function _roundRect(ctx, w, h) {
    ctx.beginPath();
    ctx.lineTo(w , 0);
    ctx.quadraticCurveTo(w, 0, w, 0);
    ctx.lineTo(w, h);
    ctx.quadraticCurveTo(w, h, w, h);
    ctx.lineTo(0, h);
    ctx.quadraticCurveTo(0, h, 0, h);
    ctx.closePath();
    ctx.fill();
  }
}
