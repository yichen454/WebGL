import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ReflectorRTT } from 'three/examples/jsm/objects/ReflectorRTT.js'
import {
    NodeFrame,
    ExpressionNode,
    PhongNodeMaterial,
    MathNode,
    OperatorNode,
    TextureNode,
    BlurNode,
    FloatNode,
    ReflectorNode,
    SwitchNode,
    NormalMapNode,
    Vector2Node
} from 'three/examples/jsm/nodes/Nodes.js';

import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'
import GUIThree from '../../utils/GUIThree'


export default class ReflectScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl反射示例';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'ReflectScene'])
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
        this.camera.position.set(6, 4, 9);
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
        let cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader.setPath('./textures/cubemap/starry/');

        let cubeTexture = cubeTextureLoader.load(['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']);
        //this.scene.background = cubeTexture;
        this.scene.environment = cubeTexture;
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

        var loader = new GLTFLoader();
        loader.load('./model/airship.glb', function (gltf) {
            //loader.load('./model/lamborghini.glb', function (gltf) {
            var model = gltf.scene;
            model.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    GUIThree.setTarget(child.material, child.name);
                }
            });

            _this.scene.add(model);
        })

        const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);
        const geometry = new THREE.PlaneGeometry(100, 100);
        const groundMirror = new ReflectorRTT(geometry, {
            clipBias: 0.003,
            textureWidth: this.renderSize.w * window.devicePixelRatio,
            textureHeight: this.renderSize.h * window.devicePixelRatio
        });
        const mirror = new ReflectorNode(groundMirror);

        const blurMirror = new BlurNode(mirror);
        blurMirror.size = new THREE.Vector2(
            this.renderSize.w * window.devicePixelRatio,
            this.renderSize.h * window.devicePixelRatio
        );

        blurMirror.uv = new ExpressionNode('projCoord.xyz / projCoord.q', 'vec3');
        blurMirror.uv.keywords['projCoord'] = mirror.uv;
        blurMirror.radius = new Vector2Node(1000, 1000);

        const groundMirrorMaterial = new PhongNodeMaterial();
        groundMirrorMaterial.environment = mirror; // or add "mirror" variable to disable blur

        const mirrorMesh = new THREE.Mesh(planeGeo, groundMirrorMaterial);
        groundMirror.add(mirrorMesh);
        groundMirror.rotateX(- Math.PI / 2);
        groundMirror.position.set(0, -2, 0);
        this.scene.add(groundMirror);
    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        this.renderer.render(this.scene, this.camera);
    }

}