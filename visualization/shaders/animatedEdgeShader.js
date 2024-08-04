export const animatedEdgeShader = {
    vertexShader: `    
          precision highp float;

          attribute float gradientOffset;
          attribute uint 	edgeNumber;	// numero de arista en unint
          attribute float edgeLength;

          uniform highp usampler2D 	animationData;
          uniform sampler2D 			diffuseMap;

          uniform float 	time;

          varying vec3 	vWorldPos;
          varying vec2 	vUv;
          varying vec3 	vNormal;
          varying float 	vGradientOffset;
          varying float 	vEmissionFactor;
          varying float vTimeToLightUp;

          void main() {
              mat3 rotationMatrix;
              rotationMatrix[0]=instanceMatrix[0].xyz;
              rotationMatrix[1]=instanceMatrix[1].xyz;
              rotationMatrix[2]=instanceMatrix[2].xyz;

              vNormal = rotationMatrix * normal;

              vUv = uv;
              vGradientOffset = gradientOffset;

              // tidx es el numero de arista en float
              float idx=float(edgeNumber);
              // v es la fila de la textura de animacion
              float v=floor(idx/ANIMATION_TEXTURE_SIDE)/ANIMATION_TEXTURE_SIDE;
              float u=mod(idx,ANIMATION_TEXTURE_SIDE)/ANIMATION_TEXTURE_SIDE;

              float timeToLightUp=float(texture2D(animationData,vec2(u,v)).r);
              vTimeToLightUp=timeToLightUp+vUv.y;
              vEmissionFactor=max(0.0,1.0-abs(timeToLightUp-time)*0.5);

              if (time>timeToLightUp){
                  vEmissionFactor=1.0;
              }
              if (timeToLightUp==0.0){
                  vEmissionFactor=0.0;
              }


              // IMPORTANT: The instanceMatrix attribute is automatically added by three.js
              // It contains the transformation matrix of each instance
              vec3 pos=position;
              vec4 worldPos = modelMatrix * instanceMatrix * vec4( pos, 1.0 );
              vWorldPos = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;

          }
      `,
    fragmentShader: `
          uniform vec3 directionalLightDirection;	
          uniform vec3 ambientColor;
          uniform highp usampler2D animationData;
          uniform sampler2D diffuseMap;

          varying float vGradientOffset;
          varying vec2 vUv;
          varying vec3 vWorldPos;

          uniform float time;

          varying vec3  vNormal;
          varying float vEmissionFactor;
          varying float vTimeToLightUp;
  
          void main() {
              vec3 normal = normalize(vNormal);
              vec3 lightDirection = normalize(directionalLightDirection);
              float diffuseFactor = max(0.0,dot(normal, lightDirection));

              vec2 uv = vec2(vUv.y,vGradientOffset);
              vec3 diffuseColor=texture2D(diffuseMap, uv).rgb;

              float binaryEmissionFactor=0.0;
              if (vTimeToLightUp<time){
                binaryEmissionFactor=1.0;
              }
              vec3 color=ambientColor+diffuseColor*diffuseFactor+0.7*binaryEmissionFactor;

              gl_FragColor = vec4(color, 0.95);
          }
      `,
};