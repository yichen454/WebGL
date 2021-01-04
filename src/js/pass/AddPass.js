import { ShaderMaterial } from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

export class AddPass extends ShaderPass {

    constructor(texture) {
        super(
            new ShaderMaterial({
                uniforms: {
                    baseTexture: {
                        value: null
                    },
                    addTexture: {
                        value: texture
                    }
                },
                vertexShader: [
                    "varying vec2 vUv;",
                    "void main() {",
                    "vUv = uv;",
                    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                    "}"
                ].join("\n"),
                fragmentShader: [
                    "uniform sampler2D baseTexture;",
                    "uniform sampler2D addTexture;",
                    "varying vec2 vUv;",
                    "void main() {",
                    "gl_FragColor = ( texture2D( baseTexture, vUv ) + texture2D( addTexture, vUv ) );",
                    "}"
                ].join("\n"),
                defines: {}
            }),
            "baseTexture")
        this.needsSwap = true;
    }

}