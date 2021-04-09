import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

export default class StencilDepthScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 模版及深度应用';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'StencilDepthScene'])
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
        this.camera.position.set(0, 2, 10);
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
        let loader = new THREE.TextureLoader();
        let bump = loader.load('./textures/brick/brick_bump.jpg');
        let diffuse = loader.load('./textures/brick/brick_diffuse.jpg');

        let pg = new THREE.PlaneGeometry(4, 4);
        let pm = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, map: diffuse, bumpMap: bump });
        let plane = new THREE.Mesh(pg, pm);
        plane.position.set(0, 1, 2);
        this.scene.add(plane);

        let cg = new THREE.IcosahedronGeometry(2, 1);
        let cm1 = new THREE.MeshStandardMaterial({ color: 0xFF0000, depthWrite: false, depthFunc: THREE.GreaterDepth, transparent: true });
        let cube1 = new THREE.Mesh(cg, cm1);
        this.scene.add(cube1);
        let cm2 = new THREE.MeshStandardMaterial({ color: 0x00FF00, wireframe: true });
        let cube2 = new THREE.Mesh(cg, cm2);
        this.scene.add(cube2);
        this.cube1 = cube1;
        this.cube2 = cube2;


        cm1.onBeforeCompile = function (shader) {
            let u2 = {
                cc_scale: {
                    type: "f",
                    value: -1
                },
                cc_bias: {
                    type: "f",
                    value: 1.2
                },
                cc_power: {
                    type: "f",
                    value: 3.3
                }
            }
            Object.assign(shader.uniforms, u2);

            let fragmentShader = shader.fragmentShader + "";
            let vertexShader = shader.vertexShader + "";

            let vs_change = [
                "varying vec3 v_Normal;",
                "varying vec3 v_PositionNormal;",
                "void main() {",
                "v_Normal = normalize( normalMatrix * normal );",
                "v_PositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);",
            ].join("\n");

            shader.vertexShader = vertexShader.replace("void main() {", vs_change);

            let fs_change1 = [
                "uniform float cc_bias;",
                "uniform float cc_power;",
                "uniform float cc_scale;",
                "varying vec3 v_Normal;",
                "varying vec3 v_PositionNormal;",
                "void main() {",
            ].join("\n");

            let fs_change2 = [
                "float a = pow( cc_bias + cc_scale * abs(dot(v_Normal, v_PositionNormal)), cc_power );",
                "gl_FragColor = vec4(outgoingLight, diffuseColor.a * a);",
            ].join("\n");
            shader.fragmentShader = fragmentShader.replace("void main() {", fs_change1);
            shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", fs_change2);
        }

    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    time = 0;
    update(delta) {
        this.time += delta;
        this.renderer.render(this.scene, this.camera);
        let y = (Math.sin(this.time * Math.PI) + 1) / 2 * 3 + 2;
        this.cube1.position.set(0, y, 0);
        this.cube2.position.set(0, y, 0);
    }

}