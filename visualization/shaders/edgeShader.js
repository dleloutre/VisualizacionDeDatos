export const edgeShader = {
	vertexShader: `
		attribute float gradientOffset;
		attribute float randomSeed;

		varying vec3 vWorldPos;
		varying vec2 vUv;

		varying float vGradientOffset;
		varying float vRandomSeed;
		varying vec3 vNormal;

		void main() {

			vNormal = normalMatrix * normal;

			vUv = uv;
			vGradientOffset = gradientOffset;
			vRandomSeed = randomSeed;

			// IMPORTANT: The instanceMatrix attribute is automatically added by three.js
			// It contains the transformation matrix of each instance

			vec4 worldPos = modelMatrix * instanceMatrix * vec4( position, 1.0 );

			vWorldPos = worldPos.xyz;
			gl_Position = projectionMatrix * viewMatrix * worldPos;

		}
	`,
	fragmentShader: `
		uniform vec3 directionalLightDirection;
		uniform vec3 ambientColor;

		uniform sampler2D edgeColor;

		varying float vGradientOffset;
		varying vec2 vUv;
		varying vec3 vWorldPos;

		uniform float waveOffset;
		uniform float emissionFactor;
		varying vec3  vNormal;
		varying float vRandomSeed;

		void main() {
			vec3 normal = normalize(vNormal);
			vec3 lightDirection = normalize(directionalLightDirection);
			float diffuseFactor = max(0.0,dot(normal, lightDirection));
			
			float peakPosition=vUv.y-0.5;
			float distanceToPeak=abs(peakPosition+waveOffset);
			float white=smoothstep(0.02,0.015,distanceToPeak);

			float highlightFactor=0.4+0.6*smoothstep(2.0,0.0,distanceToPeak);

			vec2 uv = vec2(vUv.y,vGradientOffset);
			vec3 diffuseColor=texture2D( edgeColor, uv ).xyz;
			vec3 color=ambientColor+mix(diffuseFactor*diffuseColor,diffuseColor,emissionFactor);
					
			color=color+white;

			color=color*highlightFactor;
			
			gl_FragColor = vec4(color, 1.0);

			//gl_FragColor = vec4(vUv.y,0.0,0.0, 1.0);
			//gl_FragColor = vec4(normal, 1.0);
			//gl_FragColor = vec4(diffuseFactor,diffuseFactor,diffuseFactor, 1.0);

		}
	`,
};
