import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { AddPass } from '../../pass/AddPass'
import { geoMercator } from 'd3-geo'
import GUIThree from '../GUIThree'

let materials = {};
let darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
});
let darkColor = new THREE.Color(0x000000);

export default class GeoSence {

    constructor(params) {
        document.title = 'webgl-Threejs-geoJson演示';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'GeoSence'])
        }
        this.renderer = params.renderer;
        this.renderSize = params.renderSize;
        this.isHidden = false;

        this._SetCamera();
        this._InitPass();
        this._InitPhysics();
        this._InitBackGround();
        this._InitLight();
        this._InitGameObject();
        this._InitHelper();
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
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, 10, 1000);
        this.camera.position.set(0, 0, 100);
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
        new GUIThree(bloomPass, 'bloomPass');

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

    _InitPhysics() { }

    _InitBackGround() {
        let _this = this;
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        var rl = new RGBELoader();
        rl.setDataType(THREE.UnsignedByteType);
        rl.load('./textures/hdr/royal_esplanade_1k.hdr', function (texture) {
            _this.envMap = _this.pmremGenerator.fromEquirectangular(texture).texture;
            _this.scene.environment = _this.envMap;
            _this.scene.background = darkColor;
            _this.pmremGenerator.dispose();
        })
    }

    _InitLight() {

    }

    _InitHelper() {
        // var axisHelper = new THREE.AxesHelper(100);
        // this.scene.add(axisHelper);

        // var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        // this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;
        // 加载json文件
        let loader = new THREE.FileLoader();
        loader.load('./geoJson/china.json', function (data) {
            let jsonData = JSON.parse(data);
            _this._InitMap(jsonData)
        });
    }

    _InitMap(chinaJson) {
        let _this = this;
        // 建一个空对象存放对象
        this.map = new THREE.Object3D();
        // 墨卡托投影转换
        const projection = geoMercator().center([104.0, 37.5]).scale(36).translate([0, 0]);

        let thickness = 2;

        const material_front = new THREE.MeshPhysicalMaterial({
            color: 0x02A1E2,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: true
        });
        new GUIThree(material_front, 'material_front');
        const material_side = new THREE.MeshPhysicalMaterial({
            color: 0x172d5f,
            envMapIntensity: 0.4,
            emissive: 0x0c1931,
            side: THREE.DoubleSide
        });
        new GUIThree(material_side, 'material_side');

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 'white',
        });
        chinaJson.features.forEach(elem => {
            //console.log(elem);
            // 定一个省份3D对象
            const province = new THREE.Object3D();
            // 每个的 坐标 数组
            const coordinates = elem.geometry.coordinates;
            // 循环坐标数组
            coordinates.forEach(multiPolygon => {

                multiPolygon.forEach(polygon => {
                    const shape = new THREE.Shape();
                    const lineGeometry = new THREE.Geometry();

                    for (let i = 0; i < polygon.length; i++) {
                        const [x, y] = projection(polygon[i]);
                        if (i === 0) {
                            shape.moveTo(x, -y);
                        }
                        shape.lineTo(x, -y);
                        lineGeometry.vertices.push(new THREE.Vector3(x, -y, thickness + 0.001));
                    }

                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: thickness,
                        bevelEnabled: false
                    });
                    // geometry.mergeVertices()
                    // geometry.computeBoundingBox()
                    // const max = geometry.boundingBox.max;
                    // const min = geometry.boundingBox.min;
                    // const offset = new THREE.Vector2(0 - min.x, 0 - min.y);
                    // const range = new THREE.Vector2(max.x - min.x, max.y - min.y);
                    // const faces = geometry.faces;
                    // geometry.faceVertexUvs[0] = [];

                    // for (let i = 0; i < faces.length; i++) {
                    //     const v1 = geometry.vertices[faces[i].a],
                    //         v2 = geometry.vertices[faces[i].b],
                    //         v3 = geometry.vertices[faces[i].c];
                    //     geometry.faceVertexUvs[0].push([
                    //         new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                    //         new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                    //         new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
                    //     ])
                    // }
                    // geometry.uvsNeedUpdate = true;
                    //geometry.computeVertexNormals();
                    //const mesh0 = new THREE.Mesh(geometry2, [material, null]);
                    const mesh0 = new THREE.Mesh(geometry, [material_front, null]);
                    const mesh1 = new THREE.Mesh(geometry, [null, material_side]);
                    const line = new THREE.Line(lineGeometry, lineMaterial);

                    province.add(mesh0);
                    province.add(mesh1);
                    enableLight(mesh1, true);
                    province.add(line);
                    enableLight(line, true);
                })

            })

            // 将geo的属性放到省份模型中
            province.properties = elem.properties;
            if (elem.properties.contorid) {
                const [x, y] = projection(elem.properties.contorid);
                province.properties._centroid = [x, y];
            }

            _this.map.add(province);

        })

        this.scene.add(this.map);
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.bloomPass.setSize(width / 2, height / 2);
        this.bloomComposer.setSize(width, height);
        this.finalComposer.setSize(width, height);
    }

    dispose() {
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.geometry && child.geometry.dispose();
                child.material && child.material.dispose();
            }
        })
        this.scene.clear();
        this.controls.dispose();
    }

    update(delta) {
        //this.renderer.render(this.scene, this.camera);
        let bg = this.scene.background;
        this.scene.background = darkColor;
        let fogColor;
        if (this.scene.fog) {
            fogColor = scene.fog.color;
            this.scene.fog.color = darkColor;
        }
        this.scene.traverse(darkenNonBloomed);
        this.bloomComposer.render(delta);
        this.scene.background = bg;
        if (this.scene.fog) {
            this.scene.fog.color = fogColor;
        }
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
