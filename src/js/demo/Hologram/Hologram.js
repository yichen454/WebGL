import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as Nodes from 'three/examples/jsm/nodes/Nodes.js';

import BaseScene from '../../graphics/BaseScene'
import { RemapNode } from '../../node/RemapNode';
import GUIThree from '../../utils/GUIThree'

export default class HologramScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 全息效果';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'HologramScene'])
        }
        this.nodeFrame = new Nodes.NodeFrame();
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
        this.camera.position.set(0, 1, 3);
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
        var hemiLight = new THREE.HemisphereLight(0x7c849b, 0xd7cbb1, 0.94);
        hemiLight.position.set(-1, 1, -1);
        this.scene.add(hemiLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        this.scene.add(pointLight);
    }

    _InitHelper() {
        var axisHelper = new THREE.AxesHelper(100);
        this.scene.add(axisHelper);

        var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;
        _this.mixers = [];

        let mat = new Nodes.StandardNodeMaterial();
        this.nodeMat = mat;
        mat.skinning = true;
        // mat.color = new Nodes.Vector4Node(1, 1, 1, 0);
        mat.metalness = new Nodes.FloatNode(.5);
        mat.roughness = new Nodes.FloatNode(.1);
        mat.mask = new Nodes.CondNode(new Nodes.FloatNode(1), new Nodes.FloatNode(0), Nodes.CondNode.GREATER);

        let time1 = new Nodes.TimerNode(3);
        let time2 = new Nodes.TimerNode(5);
        let localPosition = new Nodes.PositionNode(Nodes.PositionNode.LOCAL);
        let localY = new Nodes.SwitchNode(localPosition, 'y');
        let worldPosition = new Nodes.PositionNode(Nodes.PositionNode.WORLD);
        let worldY = new Nodes.SwitchNode(worldPosition, 'y');
        let line_width = new Nodes.FloatNode(300);
        let YScale = new Nodes.OperatorNode(worldY, line_width, Nodes.OperatorNode.MUL);

        let y_time = new Nodes.OperatorNode(YScale, time1, Nodes.OperatorNode.ADD);
        let rm_a = new Nodes.MathNode(y_time, Nodes.MathNode.SIN);
        let color_a = new RemapNode(rm_a, new Nodes.Vector2Node(-1, 1), new Nodes.Vector2Node(0, .9));
        let color_b = new Nodes.ColorNode(0x0027ff);
        let color = new Nodes.OperatorNode(color_a, color_b, Nodes.OperatorNode.MUL);
        mat.color = color;
        // let rm = new RemapNode(new Nodes.MathNode());
        console.log(color_a);
        mat.blending = THREE.AdditiveBlending;
        mat.side = THREE.DoubleSide;
        mat.depthWrite = false;
        mat.alpha = new Nodes.FloatNode(.7);
        // mat.opacity = 0.1;
        let time_mod = new Nodes.FloatNode(1.5);
        let m21 = new Nodes.MathNode(time2, time_mod, Nodes.MathNode.MOD);
        let gap_factor_1 = new Nodes.FloatNode(0.8);
        let m22 = new Nodes.OperatorNode(m21, gap_factor_1, Nodes.OperatorNode.DIV);
        let gap_factor_2 = new Nodes.FloatNode(-0.8);
        let m31 = new Nodes.MathNode(m22, gap_factor_2, Nodes.MathNode.MAX);
        let distance = new Nodes.MathNode(new Nodes.MathNode(localY, Nodes.MathNode.ABS), m31, Nodes.MathNode.DISTANCE);
        let smoothstep = new Nodes.MathNode(new Nodes.FloatNode(-0.1), new Nodes.FloatNode(0.1), distance, Nodes.MathNode.SMOOTHSTEP);
        let join = new Nodes.JoinNode(new Nodes.FloatNode(0), smoothstep, new Nodes.FloatNode(0), new Nodes.FloatNode(0));
        let disturbance_factor = new Nodes.FloatNode(0.02);
        let op = new Nodes.OperatorNode(join, disturbance_factor, Nodes.OperatorNode.MUL);
        let position = new Nodes.OperatorNode(localPosition, op, Nodes.OperatorNode.ADD);
        mat.position = position;

        //console.log(mat);
        const geometry = new THREE.TorusKnotBufferGeometry(0.4, 0.15, 220, 60);
        const mesh = new THREE.Mesh(geometry, mat);
        this.scene.add(mesh);

        let gui = GUIThree.getGUI();
        let folder = gui.addFolder('参数');

        let params = {
            '颜色': color_b.value.getHex(),
            '透明度': mat.alpha.value,
            '波动速度': time1.scale,
            '线条密度': line_width.value,
            '扰动速度': time2.scale,
            '扰动幅度': disturbance_factor.value,
            '时间间隔': time_mod.value,
            '间隔系数1': gap_factor_1.value,
            '间隔系数2': gap_factor_2.value,
        }

        folder.addColor(params, '颜色').onChange((val) => {
            color_b.value.setHex(val);
        });

        folder.add(params, '透明度', 0, 1).step(0.01).onChange((val) => {
            mat.alpha.value = Number(val);
        });

        folder.add(params, '波动速度', -10, 10).step(0.01).onChange((val) => {
            time1.scale = Number(val);
        });

        folder.add(params, '线条密度', 0, 1000).step(0.01).onChange((val) => {
            line_width.value = Number(val);
        });

        folder.add(params, '扰动速度', -10, 10).step(0.01).onChange((val) => {
            time2.scale = Number(val);
        });

        folder.add(params, '扰动幅度', 0, 0.2).step(0.01).onChange((val) => {
            disturbance_factor.value = Number(val);
        });

        folder.add(params, '时间间隔', 0, 10).step(0.01).onChange((val) => {
            time_mod.value = Number(val);
        });

        folder.add(params, '间隔系数1', 0, 10).step(0.01).onChange((val) => {
            gap_factor_1.value = Number(val);
        });

        folder.add(params, '间隔系数2', -10, 0).step(0.01).onChange((val) => {
            gap_factor_2.value = Number(val);
        });

        // folder.open();

    }


    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        if (this.mixers && this.mixers.length > 0) {
            for (var i = 0; i < this.mixers.length; i++) {
                this.mixers[i].update(delta);
            }
        }
        if (this.nodeMat) {
            this.nodeFrame.update(delta).updateNode(this.nodeMat);
            // console.log(this.timer.value);
        }
        this.renderer.render(this.scene, this.camera);
    }

}