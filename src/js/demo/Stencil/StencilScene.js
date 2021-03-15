import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InputNode } from 'three/examples/jsm/nodes/Nodes.js'
import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

export default class StencilScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 模版测试';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'StencilScene'])
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
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, 1, 100);
        this.camera.position.set(6, 4, 10);
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

        var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        this.scene.add(grid);
    }

    _InitGameObject() {
        let renderOrderPass = {
            //绘制地面
            ground: 6,
            //绘制模板之后的普通几何体
            mesh: 8,
            //绘制模板
            stencil: 7,
        };

        // let pw = 5;
        // let ph = 5;
        // var pg = new THREE.PlaneGeometry(pw, ph);
        // var pm = new THREE.MeshBasicMaterial({ color: 0xffffff });
        // let plane = new THREE.Mesh(pg, pm);
        // plane.renderOrder = renderOrderPass.ground;
        // this.scene.add(plane);

        //绘制模板几何体
        const geometry = new THREE.TorusKnotBufferGeometry(0.4, 0.15, 220, 60);

        /**
         * 这里设置当模板测试与深度测试均通过时，将该几何体的每个片段均设置为1
         */
        const material = new THREE.MeshBasicMaterial({
            color: 0xffc107,
            //开启模板测试
            stencilWrite: false,
            //模板测试失败，保持原样
            stencilFail: THREE.KeepStencilOp,
            //模板测试通过，深度测试失败：保持原样
            stencilZFail: THREE.KeepStencilOp,
            //模板测试通过，深度测试通过，则将当前模板值设置为Ref设定的值
            stencilZPass: THREE.ReplaceStencilOp,
            //模板测试的比较方法，
            stencilFunc: THREE.AlwaysStencilFunc,
            //模板测试参考值
            stencilRef: 1.0,
            //模板测试掩码，用于与参考值作比较
            stencilWriteMask: 0xff,
            side: THREE.DoubleSide,
        });


        // add the color
        const normal = new THREE.Mesh(geometry, material);
        normal.renderOrder = renderOrderPass.mesh;
        normal.castShadow = true;
        this.scene.add(normal);

        let stencilMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            //禁止写入模板缓冲区
            stencilWrite: true,
            // //禁用深度测试
            depthTest: true,
            stencilFail: THREE.IncrementStencilOp,
            // //设置模板比较函数为不相等
            stencilFunc: THREE.EqualStencilFunc,
            // 模板参考值
            stencilRef: 1.0,
            transparent: true,
            opacity: .5,
            stencilWriteMask: 0xff,
        });

        const stencilMesh = new THREE.Mesh(geometry, stencilMaterial);
        stencilMesh.scale.set(1.1, 1.1, 1.1);
        stencilMesh.renderOrder = renderOrderPass.stencil;
        stencilMesh.castShadow = true;
        this.scene.add(stencilMesh);

        stencilMesh.onAfterRender = function (renderer) {
            renderer.clearStencil();
        };
    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        this.renderer.render(this.scene, this.camera);
    }

}