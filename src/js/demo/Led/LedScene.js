import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AddPass } from '../../pass/AddPass'

import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

import vv from './res/video.mp4'

let materials = {};
let darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
});
let darkColor = new THREE.Color(0x000000);

export default class LedScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl LED屏幕';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'LedScene'])
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

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.3, 0.4, 0);
        GUIThree.setTarget(bloomPass, 'UnrealBloomPass');

        let obc = function (shader) {
            shader.fragmentShader = shader.fragmentShader.replace
                ('vec2 invSize = 1.0 / texSize;					float fSigma = float(SIGMA);					float weightSum = gaussianPdf(0.0, fSigma);					vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {						float x = float(i);						float w = gaussianPdf(x, fSigma);						vec2 uvOffset = direction * invSize * x;						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;						diffuseSum += (sample1 + sample2) * w;						weightSum += 2.0 * w;					}					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);',
                    'vec2 invSize = 1.0 / texSize;\
                float fSigma = float(SIGMA);\
                float weightSum = gaussianPdf(0.0, fSigma);\
                vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
                float alphaSum = 0.0;\
                for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
                    float x = float(i);\
                    float w = gaussianPdf(x, fSigma);\
                    vec2 uvOffset = direction * invSize * x;\
                    vec4 sample1 = texture2D( colorTexture, vUv + uvOffset);\
                    vec4 sample2 = texture2D( colorTexture, vUv - uvOffset);\
                    diffuseSum += (sample1.rgb + sample2.rgb) * w;\
                    weightSum += 2.0 * w;\
                    alphaSum += (sample1.a + sample2.a) * w;\
                }\
                gl_FragColor = vec4(diffuseSum/weightSum, alphaSum/weightSum);');
        }

        //修正背景透明
        bloomPass.separableBlurMaterials.forEach(mat => {
            mat.onBeforeCompile = obc;
        });

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

        // var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        // this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;

        let pw = 14.4;
        let ph = 8.8;
        var pg = new THREE.PlaneGeometry(pw, ph)
        var pm = new THREE.MeshBasicMaterial({ color: 0xffffff })
        // var texture = new THREE.VideoTexture(video);

        let video = document.createElement('video');
        video.src = vv; // 设置视频地址
        video.loop = true;
        video.autoplay = "autoplay"; //要设置播放
        document.getElementById('container_3d').appendChild(video);
        video.style.position = "absolute";
        video.style.left = "0";
        video.style.top = "0";
        video.controls = true;
        video.style.transformOrigin = "0 0";
        video.style.transform = "scale(0.4)";
        video.play();
        // video对象作为VideoTexture参数创建纹理对象
        var texture = new THREE.VideoTexture(video);

        var customMaterial = new THREE.ShaderMaterial({
            uniforms: {
                resolution: {
                    type: "v2",
                    value: new THREE.Vector2(pw, ph)
                },
                gridParam: {
                    type: "v2",
                    value: new THREE.Vector2(0.005, 0.001)
                },
                gridColor: {
                    type: "c",
                    value: new THREE.Color(0x000000)
                },
                mTexture: {
                    value: texture
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
                uniform vec2 resolution;
                uniform vec3 gridParam;
                uniform vec3 gridColor;
                uniform sampler2D mTexture;
                uniform vec2 repeat;
                uniform float opacity;
                varying vec2 vUv;

                vec4 drawGrid(vec2 pos,float grid,float line,vec3 color){
                    float d = grid + line;
                    float t = 0.0;
                    float scale = resolution.x / resolution.y;
                    if( mod(pos.x,d) < grid && mod(pos.y,d*scale) < grid*scale){
                          t = 0.0;
                    }else{
                          t = 1.0;
                    }

                    return vec4(color,1.0-t);
                }

                void main() {
                vec4 mask = drawGrid(vUv,gridParam.x,gridParam.y,gridColor);
                vec4 layer = texture2D(mTexture,vUv);
                vec3 dst = mix(mask.rgb,layer.rgb,mask.a);
                gl_FragColor = vec4(dst,opacity);
                }
                `,
            transparent: true,
        });

        this.mat = customMaterial;
        this.setGUI(this.mat);

        this.plane = new THREE.Mesh(pg, customMaterial)
        this.plane.position.set(0, 0, 0)
        this.scene.add(this.plane);

        enableLight(this.plane, true);
    }

    setGUI(mat) {
        let datGui = GUIThree.getGUI();
        let folder = datGui.addFolder("参数");

        let params = {
            '格子大小': mat.uniforms.gridParam.value.x,
            '缝隙大小': mat.uniforms.gridParam.value.y,
            '透明度': mat.uniforms.opacity.value,
            '颜色': mat.uniforms.gridColor.value.getHex(),
        }

        folder.add(params, "格子大小", 0.0001, 0.01).step(0.0001).onChange((e) => {
            mat.uniforms.gridParam.value.x = parseFloat(e);
        })

        folder.add(params, "缝隙大小", 0.0001, 0.01).step(0.0001).onChange((e) => {
            mat.uniforms.gridParam.value.y = parseFloat(e);
        })

        folder.add(params, "透明度", 0, 1).step(0.01).onChange((e) => {
            mat.uniforms.opacity.value = parseFloat(e);
        })

        folder.addColor(params, "颜色").onChange((e) => {
            mat.uniforms.gridColor.value = new THREE.Color(e);
        });
        folder.open();
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