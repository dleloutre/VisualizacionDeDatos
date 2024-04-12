export const nodeShader = {
	vertexShader: `
            uniform float size;

			in vec3 offset;
            in float vTextureCoord;

			out vec2 vUv;
			out vec4 vViewPos;
            out float vVtextureCoord;
			
			void main() {

				vUv = position.xy*2.0;
				vec4 pos =  modelViewMatrix * vec4(offset, 1.0);
				vVtextureCoord=vTextureCoord;

				pos.x+=position.x*size;
				pos.y+=position.y*size;

                vViewPos=pos;
				pos=projectionMatrix * pos;

				gl_Position=pos;
			}
		`,
	fragmentShader: `
			
			
            uniform sampler2D diffuseMap;
            //uniform mat4 projectionMatrix;

            in vec2 vUv;
            in vec4 vViewPos;
            in float vVtextureCoord;
            out vec4 fragColor;

			void main() {
				
				float r=length(vUv);
				float decay=1.0-r*1.7;
				if (r>0.5){
					discard;
				}
                vec3 color=texture(diffuseMap, vec2(0.01,vVtextureCoord)).rgb;
				fragColor = vec4(color*decay,  1.0);
				
                
				//gl_FragColor = vec4(1.0,0.0,0.0,  1.0);
/*
                float p10=projectionMatrix[2].z;
                float p11=projectionMatrix[3].z;

                float eyeHitZ=(vViewPos.z)/vViewPos.w;
                //eyeHitZ=r;
                // float ndcDepth = ((zFar+zNear) + (2.0*zFar*zNear)/eyeHitZ) / (zFar-zNear); ***

                float ndcDepth=-p10-p11/eyeHitZ;

                float depth=((gl_DepthRange.diff*ndcDepth)+gl_DepthRange.near+gl_DepthRange.far)/2.;
                
                float currentDepth = gl_FragCoord.z;

                //gl_FragDepth=ndcDepth;
*/                
			}
		`,
};
