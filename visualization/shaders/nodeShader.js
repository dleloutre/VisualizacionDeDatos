export const nodeShader = {
	vertexShader: `
              uniform float size;
  
              in float nodeNumber;
              in vec3 translation;
              in float vTextureCoord;
  
              uniform highp usampler2D 	animationData;
              uniform sampler2D 			diffuseMap;
              uniform float time;
  
              out vec2 vUv;
              out vec4 vViewPos;
              out float vVtextureCoord;
              out float vEmissionFactor;
              
              void main() {
  
                  vUv = position.xy*2.0;
                  vec4 pos =  modelViewMatrix * vec4(translation, 1.0);
                  vVtextureCoord=vTextureCoord;
  
                  pos.x+=position.x*size;
                  pos.y+=position.y*size;
  
                  vViewPos=pos;
                  pos=projectionMatrix * pos;
  
                  gl_Position=pos;
  
                  // idx es el numero de arista en float
                  float idx=float(nodeNumber);
                  // v es la fila de la textura de animacion
                  float v=floor(idx/ANIMATION_TEXTURE_SIDE)/ANIMATION_TEXTURE_SIDE;
                  float u=mod(idx,ANIMATION_TEXTURE_SIDE)/ANIMATION_TEXTURE_SIDE;
                  
                  
                  float timeToLightUp=float(texture2D(animationData,vec2(u,v)).r);
      
  
                  vEmissionFactor=max(0.0,1.0-abs(timeToLightUp-time)*0.5);
  
                  if (time>timeToLightUp){
                      vEmissionFactor=1.0;
                  }
                  if (timeToLightUp==0.0){
                      vEmissionFactor=0.0;
                  }
              }
          `,
	fragmentShader: `
              uniform float size;
              uniform sampler2D diffuseMap;
              uniform mat4 projectionMatrix;
  
              in vec2 vUv;
              in vec4 vViewPos;
              in float vVtextureCoord;
              in float vEmissionFactor;
  
              out vec4 fragColor;
  
              void main() {
                  
                  float r=length(vUv);
                  float decay=1.0-r*0.8;
                  if (r>1.0) {
                      discard;
                  }
                  vec3 color=texture(diffuseMap, vec2(0.01,vVtextureCoord)).rgb;
                  
                  fragColor = vec4(color*decay+vEmissionFactor*0.5,  0.8);
                  
                  float radialDistance=length(vUv)*size*0.5;
                  float zOffset=sqrt(pow(size*0.5,2.0)-pow(radialDistance,2.0));
  
                  
                  //fragColor = vec4(abs(vUv),0.0,  1.0);
  
                  float p10=projectionMatrix[2].z;
                  float p11=projectionMatrix[3].z;
  
                  float eyeHitZ=(vViewPos.z+zOffset)/vViewPos.w;
                  
                  // *** float ndcDepth = ((zFar+zNear) + (2.0*zFar*zNear)/eyeHitZ) / (zFar-zNear); ***
  
                  float ndcDepth=-p10-p11/eyeHitZ;
  
                  float depth=((gl_DepthRange.diff*ndcDepth)+gl_DepthRange.near+gl_DepthRange.far)/2.;
  
                  gl_FragDepth=depth;
                 
              }
          `,
};