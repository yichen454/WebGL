import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

import rain_eff from './rain_eff.png'

export default class RainScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 雨天效果';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'RainScene'])
        }
    }

    hide() {
        this.isHidden = true;
        if (this.controls)
            this.controls.enabled = false;
    }

    show() {
        this.isHidden = false;
        if (this.controls)
            this.controls.enabled = true;
    }

    _SetCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, .1, 100);
        this.camera.position.set(0, 0, 10);
        let dom = this.renderer.domElement;
        this.controls = new OrbitControls(this.camera, dom);
        this.controls.enablePan = false;
        dom.style.outline = 'none';
        this.scene = new THREE.Scene();
    }

    _InitPass() {

    }

    _InitPhysics() { }

    _InitBackGround() {
    }

    _InitLight() {
    }

    _InitHelper() {
        var axisHelper = new THREE.AxesHelper(100);
        this.scene.add(axisHelper);

        // var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        // this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;
        let pw = 5;
        let ph = 5;
        var pg = new THREE.PlaneGeometry(pw, ph);
        var pm = new THREE.MeshBasicMaterial({ color: 0xffffff });

        let texture = new THREE.TextureLoader().load(rain_eff);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        var customMaterial = new THREE.ShaderMaterial({
            uniforms: {
                mTexture: {
                    value: texture
                },
                flowSpeed: {
                    value: 0.2
                },
                time: {
                    value: 0.0
                }
            },
            vertexShader:
                `
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                void main() {
                    vUv = uv;
                    vWorldNormal = (modelMatrix * vec4(normal, 1.0 )).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
                `.trim(),
            fragmentShader:
                `
                #define PI 3.141592653589793
                uniform sampler2D mTexture;
                uniform float flowSpeed;
                uniform float time;
                varying vec2 vUv;
                varying vec3 vWorldNormal;

                void main() {
                    vec4 diffuse = texture2D(mTexture, vUv);
                    float ripple_color = texture2D(mTexture, vUv).r;
                    float ripple_color2 = texture2D(mTexture, vUv+vec2(0.75,0.75)).r;
                    float stream_color = diffuse.g;

                    vec2 uv_flow = vUv+vec2(0.0,time*flowSpeed);
                    float flow_color = pow(texture2D(mTexture, uv_flow).b,5.0);
                    float up = 1.0-clamp(vWorldNormal.y,0.0,1.0);
                    float final_flow_color = stream_color*flow_color*up;
    
                    float emissiveSpeed = time*1.0;
                    float emissive = clamp(1.0-fract(emissiveSpeed) - ripple_color, 0.0, 1.0);
                    float emissive2 = clamp(1.0-fract(emissiveSpeed + 0.5) - ripple_color2, 0.0, 1.0);
                    float mask_color = (1.0-distance(emissive,0.05)/0.05) * ripple_color;
                    float mask_color2 = (1.0-distance(emissive2,0.05)/0.05) * ripple_color2;
                    float maskSwitch = clamp(abs(sin((emissiveSpeed*PI))), 0.0, 1.0);
                    float final_ripple_color = clamp(mix(mask_color , mask_color2 ,maskSwitch ), 0.0, 1.0)*(1.0-up);
                    float final_color = mix(final_ripple_color,final_flow_color,final_flow_color);
                    gl_FragColor = vec4(vec3(final_color),1.0);
                }
                `.trim(),
            transparent: true,
        });
        this.mat = customMaterial;

        // this.plane = new THREE.Mesh(pg, customMaterial);
        // this.plane.position.set(0, 0, 0);
        // //this.plane.rotateX(-Math.PI / 6);
        // this.scene.add(this.plane);

        // this.plane2 = new THREE.Mesh(pg, customMaterial);
        // this.plane2.position.set(0, 0, 0);
        // this.plane2.rotateX(-Math.PI / 2);
        // this.scene.add(this.plane2);

        let box = new THREE.BoxGeometry(2, 2, 2);
        let cube = new THREE.Mesh(box, customMaterial);
        cube.position.set(0, 0, 0);
        this.scene.add(cube);

    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        this.renderer.render(this.scene, this.camera);
        this.mat.uniforms.time.value += delta;
    }

}