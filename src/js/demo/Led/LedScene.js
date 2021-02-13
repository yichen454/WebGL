import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { AddPass } from '../../pass/AddPass'

import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

import mask from './test.png'

let materials = {};
let darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
});
let darkColor = new THREE.Color(0x000000);

export default class LedScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl灯珠shader';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'ReflectScene'])
        }
    }

    _SetCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, .1, 100);
        this.camera.position.set(0, 0, 20);
        let dom = this.renderer.domElement;
        this.controls = new OrbitControls(this.camera, dom);
        this.controls.enablePan = false;
        dom.style.outline = 'none';
        this.scene = new THREE.Scene();
    }

    _InitPass() {
        const renderScene = new RenderPass(this.scene, this.camera);
        const width = this.renderSize.w;
        const height = this.renderSize.h;

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 4, 1, 0.1);
        GUIThree.setTarget(bloomPass, 'bloomPass');

        const bloomComposer = new EffectComposer(this.renderer);
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass(renderScene);
        bloomComposer.addPass(bloomPass);

        const finalPass = new AddPass(bloomComposer.renderTarget2.texture);

        const finalComposer = new EffectComposer(this.renderer);
        finalComposer.addPass(renderScene);
        finalComposer.addPass(finalPass);

        bloomComposer.setSize(width, height);
        finalComposer.setSize(width, height);

        this.bloomComposer = bloomComposer;
        this.finalComposer = finalComposer;
        this.bloomPass = bloomPass;
    }

    _InitPhysics() {

    }

    _InitBackGround() {

    }

    _InitLight() {
        this.scene.add(new THREE.HemisphereLight(0x808EFF, 0xffffff, 1.5));
    }

    _InitHelper() {
        var axisHelper = new THREE.AxesHelper(100);
        this.scene.add(axisHelper);

        var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;

        let pw = 7.2;
        let ph = 12.8;
        var pg = new THREE.PlaneGeometry(pw, ph)
        var pm = new THREE.MeshBasicMaterial({ color: 0xffffff })

        var customMaterial = new THREE.ShaderMaterial({
            uniforms: {
                gridColor: {
                    type: "c",
                    value: new THREE.Color(0xFAFAD2)
                },
                mTexture: {
                    value: new THREE.TextureLoader().load(mask)
                },
                repeat: {
                    type: "v2",
                    value: new THREE.Vector2(0.0, 0.0)
                },
                opacity: {
                    value: 1.0
                },
            },
            vertexShader:
                `
                varying vec2 vUv;
                void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
                `,
            fragmentShader:
                `
                uniform vec3 gridColor;
                uniform sampler2D mTexture;
                uniform vec2 repeat;
                uniform float opacity;
                varying vec2 vUv;

                float random (vec2 st) {
                    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
                }

                vec4 drawGrid(vec2 pos,float grid,float line,vec3 color){
                    float d = grid + line;
                    float t = 0.0;
                    if( mod(pos.x,d) < grid && mod(pos.y,d) < grid){
                          t = 0.0;
                    }else{
                          t = 1.0;
                    }

                    return vec4(color,1.0 - t);
                }

                void main() {
                vec4 layer = drawGrid(vUv,0.005,0.008,gridColor);

                vec4 mask = texture2D(mTexture,vUv);
                vec2 st = (vUv + repeat).xy * 50.0;

                vec2 ipos = floor(st);  // get the integer coords
                vec2 fpos = fract(st);  // get the fractional coords
    
                vec3 color = vec3(random( ipos ));
  
                gl_FragColor = vec4(layer.rgb,layer.a*color.r*opacity*(1.0-mask.r));
                }
                `,
            transparent: true,
        });

        this.mat = customMaterial;

        this.plane = new THREE.Mesh(pg, customMaterial)
        this.plane.position.set(0, 0, 0)
        //this.plane.rotateX(0)
        this.scene.add(this.plane);

        enableLight(this.plane, true);

        setInterval(() => {
            _this.mat.uniforms.repeat.value.x += Math.random(1) - 0.5;
            _this.mat.uniforms.repeat.value.y += Math.random(1) - 0.5;
        }, 100);

        let folder = GUIThree.getGUI().addFolder("face");
        addColor();
        function addColor() {
            let params = {
                color: customMaterial.uniforms.gridColor.value.getHex(),
            }
            folder.addColor(params, "color").onChange((e) => {
                customMaterial.uniforms.gridColor.value = new THREE.Color(e);
            });
        }
    }

    dispose() {

    }

    update(delta) {

        //this.renderer.render(this.scene, this.camera);

        this.scene.traverse(darkenNonBloomed);
        this.bloomComposer.render(delta);
        this.scene.traverse(restoreMaterial);
        this.finalComposer.render(delta);
    }
}

function enableLight(obj, isOpen) {
    obj.openBloom = isOpen;
}


function darkenNonBloomed(obj) {
    if (!obj.openBloom === true) {
        if (obj.geometry) {
            materials[obj.uuid] = obj.material;
            obj.material = darkMaterial;
        }
    }
}

function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
    }
}