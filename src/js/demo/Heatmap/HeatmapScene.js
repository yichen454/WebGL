import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import h337 from 'heatmap.js'
import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'
import GUIThree from '../../utils/GUIThree'

export default class HeatmapScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl热力图';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'HeatmapScene'])
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
        this.camera.position.set(0, 10, 15);
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
        console.log(h337);

        let width = 256;
        let height = 256;

        let hc = document.createElement('div');
        hc.style.width = `${width}px`;
        hc.style.height = `${height}px`;
        hc.style.bottom = '0';
        hc.style.left = '0';

        let cc = document.getElementById('container_3d');
        //this.renderer.domElement.appendChild(hc);
        cc.appendChild(hc);

        var heatmap = h337.create({
            container: hc,
        });
        hc.style.position = 'absolute';
        let len = 50;
        let points = [];
        let max = 0;
        while (len--) {
            var val = Math.floor(Math.random() * 100);
            max = Math.max(max, val);
            var point = {
                x: Math.floor(Math.random() * width),
                y: Math.floor(Math.random() * height),
                value: val
            };
            points.push(point);
        }
        heatmap.setData({
            max: max,
            data: points
        });

        var texture = new THREE.CanvasTexture(heatmap._renderer.canvas);
        texture.encoding = this.renderer.outputEncoding;

        let pg = new THREE.PlaneGeometry(5, 5, width, height);
        let pm = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            wireframe: true
        });
        let plane = new THREE.Mesh(pg, pm);
        plane.rotateX(-Math.PI / 2);
        this.scene.add(plane);
        GUIThree.setTarget(plane.material, plane.name);

        let hc2 = document.createElement('div');
        hc2.style.width = `${width}px`;
        hc2.style.height = `${height}px`;
        cc.appendChild(hc2);

        var graymap = h337.create({
            container: hc2,
            gradient: {
                '0': 'black',
                '1.0': 'white'
            }
        });
        graymap.setData({
            max: max,
            data: points
        });

        var texture2 = new THREE.CanvasTexture(graymap._renderer.canvas);
        texture2.encoding = this.renderer.outputEncoding;

        pm.onBeforeCompile = function (shader) {
            let uniforms = {
                cc_ZScale: {
                    type: "f",
                    value: 1.0
                },
                heatmap: {
                    value: texture2
                },
            }
            Object.assign(shader.uniforms, uniforms);

            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",

                `uniform float cc_ZScale;
                uniform sampler2D heatmap;
                void main() {`);
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",

                `float height = cc_ZScale * texture2D(heatmap, uv).r - cc_ZScale/2.0;
                vec3 transformed = vec3( position.x, position.y, height);`);

            let datGui = GUIThree.getGUI();
            let folder = datGui.addFolder("自定义参数");

            let params = {
                '高度缩放': shader.uniforms.cc_ZScale.value,
            }
            folder.add(params, "高度缩放", 0, 10).step(0.01).onChange((e) => {
                shader.uniforms.cc_ZScale.value = parseFloat(e);
            })
            folder.open();
        }

        


    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }

    update(delta) {
        this.renderer.render(this.scene, this.camera);
    }

}