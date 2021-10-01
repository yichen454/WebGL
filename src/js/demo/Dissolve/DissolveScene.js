import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'
import * as Nodes from 'three/examples/jsm/nodes/Nodes.js';
import { RemapNode } from '../../node/RemapNode';
import { Noise3DNode } from '../../node/Noise3DNode';

import gradientMap from './Gradient.png';
import { MathUtils } from 'three';

//discard
export default class DissolveScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 三维噪点消融效果';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'DissolveScene'])
        }
        this.nodeFrame = new Nodes.NodeFrame();
        THREE.Object3D
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
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, 1, 100);
        this.camera.position.set(0, 2, 10);
        let dom = this.renderer.domElement;
        this.controls = new OrbitControls(this.camera, dom);
        this.controls.enablePan = false;
        dom.style.outline = 'none';
        this.scene = new THREE.Scene();

        let canvas = document.createElement('canvas');
        // canvas.style.position = 'absolute';
        // canvas.style.left = '0';
        // canvas.style.bottom = '0';
        // canvas.style.zIndex = 9999;
        canvas.width = 128;
        canvas.height = 128;
        let ctx = canvas.getContext('2d');

        var gradient = createRectLinearGradient(64, 0, 0, 128);
        gradient.addColorStop(0, "black");
        gradient.addColorStop(1, "white");

        ctx.fillStyle = gradient;

        ctx.fillRect(0, 0, 128, 128);

        // document.getElementById('app').appendChild(canvas);

        function createRectLinearGradient(x, y, width, height) {
            return ctx.createLinearGradient(x, y, x + width, y + height);
        }
        this.canvas = canvas;
    }

    _InitPass() { }

    _InitPhysics() { }

    _InitBackGround() { }

    _InitLight() {
        var hemiLight = new THREE.HemisphereLight(0x7c849b, 0xd7cbb1, 0.94);
        hemiLight.position.set(-1, 1, -1);
        this.scene.add(hemiLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(0, 4, 0);
        this.scene.add(pointLight);
    }

    _InitHelper() {
        var axisHelper = new THREE.AxesHelper(100);
        this.scene.add(axisHelper);

        var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        this.scene.add(grid);
    }

    _InitGameObject() {
        let gMap = new THREE.CanvasTexture(this.canvas);

        let geo = new THREE.SphereGeometry(2, 20, 20);
        let meshW = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, depthWrite: false, depthFunc: THREE.LessDepth, }));
        this.scene.add(meshW);
        let mat = new Nodes.StandardNodeMaterial();
        mat.color = new Nodes.Vector4Node(.5, .5, .5, 1);
        mat.metalness = new Nodes.FloatNode(1);
        mat.roughness = new Nodes.FloatNode(.3);

        let worldPos = new Nodes.PositionNode(Nodes.PositionNode.WORLD);
        let wo = new Nodes.OperatorNode(worldPos, new Nodes.JoinNode(new Nodes.FloatNode(2), new Nodes.FloatNode(2), new Nodes.FloatNode(2)), Nodes.OperatorNode.MUL);

        let g = new Nodes.TextureNode(gMap);
        let gain = new Nodes.FloatNode(.5);
        let lacunarity = new Nodes.FloatNode(3);
        let domain = new Nodes.Vector2Node(-1, 1);
        let range = new Nodes.Vector2Node(0, 1);
        let noise = new Noise3DNode(wo, lacunarity, gain);
        let gr = new Nodes.SwitchNode(new Nodes.OperatorNode(g, new RemapNode(noise, domain, range), Nodes.OperatorNode.MUL), 'r');


        // mat.emissive = new RemapNode(new Nodes.MathNode(time, Nodes.MathNode.SIN), domain, range);
        let time1 = new Nodes.TimerNode();
        let mask = new Nodes.CondNode(gr, new RemapNode(new Nodes.MathNode(time1, Nodes.MathNode.SIN), domain, range), Nodes.CondNode.GREATER);
        mat.mask = mask;


        let edgeColor = new Nodes.ColorNode(new THREE.Color(0xFFd100));
        let edgeGlow = new Nodes.FloatNode(5);
        let edgeGlowX = new Nodes.JoinNode(edgeGlow, edgeGlow, edgeGlow);
        let ea = new Nodes.OperatorNode(edgeColor, edgeGlowX, Nodes.OperatorNode.MUL);
        let time2 = new Nodes.TimerNode();
        let progression = new RemapNode(new Nodes.MathNode(time2, Nodes.MathNode.SIN), domain, range);
        let edgeWidth = new Nodes.FloatNode(0.02);
        let edgeWidthX = new Nodes.OperatorNode(edgeWidth, progression, Nodes.OperatorNode.ADD);
        let oneminus = new Nodes.MathNode(gr, edgeWidthX, Nodes.MathNode.STEP);
        let eb = new Nodes.OperatorNode(new Nodes.FloatNode(1), oneminus, Nodes.OperatorNode.MUL);
        let emissive = new Nodes.OperatorNode(ea, eb, Nodes.OperatorNode.MUL);
        mat.emissive = emissive;

        this.nodeMat = mat;
        let mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);

        let gui = GUIThree.getGUI();
        let folder = gui.addFolder('参数');


        let params = {
            '边缘颜色': edgeColor.value.getHex(),
            '边缘强度': edgeGlow.value,
            '边缘宽度': edgeWidth.value
        }

        folder.addColor(params, '边缘颜色').onChange((val) => {
            edgeColor.value.setHex(val);
        });

        folder.add(params, '边缘强度', 0, 20).step(0.01).onChange((val) => {
            edgeGlow.value = Number(val);
        });

        folder.add(params, '边缘宽度', 0, 0.1).step(0.001).onChange((val) => {
            edgeWidth.value = Number(val);
        });
    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        if (this.nodeMat) {
            this.nodeFrame.update(delta).updateNode(this.nodeMat);
        }
        this.renderer.render(this.scene, this.camera);
    }

}