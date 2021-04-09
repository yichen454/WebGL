import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { AddPass } from '../../pass/AddPass'
import { geoMercator } from 'd3-geo'
import GUIThree from '../../utils/GUIThree'

import BaseScene from '../../graphics/BaseScene'
import test_tex from '../BeautyMakeup/face/face1.jpg'


let materials = {};
let darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
});
let darkColor = new THREE.Color(0x000000);

export default class GeoScene extends BaseScene {

    constructor(porps) {
        super(porps);
        document.title = 'webgl-Threejs-geoJson演示';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'GeoScene'])
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
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, 1, 1000);
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
        GUIThree.setTarget(material_front, 'material_front');
        const material_side = new THREE.MeshPhysicalMaterial({
            color: 0x172d5f,
            envMapIntensity: 0.4,
            emissive: 0x0c1931,
            side: THREE.DoubleSide
        });
        GUIThree.setTarget(material_side, 'material_side');

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 'white',
        });

        //for (let i = 0; i < 1; i++) {
        for (let i = 0; i < chinaJson.features.length; i++) {
            let elem = chinaJson.features[i];
            // 定一个省份3D对象
            const province = new THREE.Object3D();
            // 每个的 坐标 数组
            const coordinates = elem.geometry.coordinates;
            // 循环坐标数组

            coordinates.forEach(multiPolygon => {
                multiPolygon.forEach(polygon => {

                    const shape = new THREE.Shape();
                    const lineGeometry = new THREE.BufferGeometry();

                    const vertices = [];
                    for (let i = 0; i < polygon.length; i++) {
                        const [x, y] = projection(polygon[i]);
                        if (i === 0) {
                            shape.moveTo(x, -y);
                        } else {
                            shape.lineTo(x, -y);
                        }
                        vertices.push(x, -y, thickness + thickness / 100000);
                    }

                    let ver = new Float32Array(vertices);
                    lineGeometry.setAttribute('position', new THREE.BufferAttribute(ver, 3));
                    const geometryCB = new THREE.ExtrudeGeometry(shape, {
                        depth: thickness,
                        bevelEnabled: false
                    });
                    geometryCB.computeBoundingBox()
                    const max = geometryCB.boundingBox.max;
                    const min = geometryCB.boundingBox.min;
                    let dx = max.x - min.x;
                    let dy = max.y - min.y;

                    LocalUVGenerator.offset.set(0 - min.x, 0 - min.y);
                    LocalUVGenerator.range.set(max.x - min.x, max.y - min.y);

                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: thickness,
                        bevelEnabled: false,
                        UVGenerator: LocalUVGenerator
                    });

                    // console.log(geometry);

                    // let cw = 200;
                    // let ch = 200;
                    // // console.log(dx);
                    // // if (dx > dy) {
                    // //     cw = ch = dx * 20;
                    // // } else {
                    // //     cw = ch = dy * 20;
                    // // }
                    // let img = new Image();
                    // let texture = new THREE.Texture(img);
                    // if (dx > 0.05 && dy > 0.05) {
                    //     let canvas = document.createElement('canvas');
                    //     canvas.style.position = 'absolute';
                    //     canvas.style.left = '0';
                    //     canvas.style.bottom = '0';
                    //     canvas.width = 200;
                    //     canvas.height = 200;
                    //     let ctx = canvas.getContext('2d');
                    //     ctx.fillStyle = "#000000";
                    //     ctx.fillRect(0, 0, 200, 200);
                    //     ctx.strokeStyle = "white";

                    //     ctx.fillRect(0, 0, cw, ch);
                    //     ctx.lineWidth = dx * 10;
                    //     ctx.beginPath();
                    //     for (let k = 0; k < vertices.length; k += 3) {
                    //         let cx = (vertices[k] - min.x) / dx * cw;
                    //         let cy = (1 - (vertices[k + 1] - min.y) / dy) * ch;
                    //         if (k == 0) {
                    //             ctx.moveTo(cx, cy);
                    //         } else {
                    //             ctx.lineTo(cx, cy);
                    //         }
                    //     }
                    //     ctx.stroke();

                    //     let oData = ctx.getImageData(0, 0, cw, ch);
                    //     let newSrc = gaussBlur(oData);
                    //     ctx.putImageData(newSrc, 0, 0);
                    //     img.src = canvas.toDataURL('image/jpeg');
                    //     img.onload = () => {
                    //         texture.needsUpdate = true;
                    //         img.onload = false;
                    //         texture.dispose();
                    //     }
                    // }

                    // const material_front = new THREE.MeshBasicMaterial({
                    //     // color: 0x02A1E2,
                    //     // transparent: true,
                    //     // opacity: 0.6,
                    //     // side: THREE.DoubleSide,
                    //     // depthWrite: true
                    //     map: texture
                    // });

                    const mesh0 = new THREE.Mesh(geometry, [material_front, null]);
                    const mesh1 = new THREE.Mesh(geometry, [null, material_side]);
                    const line = new THREE.Line(lineGeometry, lineMaterial);

                    province.add(mesh0);
                    province.add(mesh1);
                    enableLight(mesh1, true);
                    province.add(line);
                    enableLight(line, true);
                });
            });

            // 将geo的属性放到省份模型中
            province.properties = elem.properties;
            if (elem.properties.contorid) {
                const [x, y] = projection(elem.properties.contorid);
                province.properties._centroid = [x, y];
            }

            _this.map.add(province);

        }

        this.scene.add(this.map)
    }

    resize(width, height) {
        super.resize(width, height);

        this.bloomPass.setSize(width / 2, height / 2);
        this.bloomComposer.setSize(width, height);
        this.finalComposer.setSize(width, height);
    }

    dispose() {
        super.dispose();
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

const LocalUVGenerator = {
    offset: new THREE.Vector2(),
    range: new THREE.Vector2(),
    generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {

        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];

        const offset = this.offset;
        const range = this.range;

        return [
            new THREE.Vector2((a_x + offset.x) / range.x, (a_y + offset.y) / range.y),
            new THREE.Vector2((b_x + offset.x) / range.x, (b_y + offset.y) / range.y),
            new THREE.Vector2((c_x + offset.x) / range.x, (c_y + offset.y) / range.y)
        ];

    },

    generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {

        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const a_z = vertices[indexA * 3 + 2];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const b_z = vertices[indexB * 3 + 2];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];
        const c_z = vertices[indexC * 3 + 2];
        const d_x = vertices[indexD * 3];
        const d_y = vertices[indexD * 3 + 1];
        const d_z = vertices[indexD * 3 + 2];

        if (Math.abs(a_y - b_y) < 0.01) {

            return [
                new THREE.Vector2(a_x, 1 - a_z),
                new THREE.Vector2(b_x, 1 - b_z),
                new THREE.Vector2(c_x, 1 - c_z),
                new THREE.Vector2(d_x, 1 - d_z)
            ];

        } else {

            return [
                new THREE.Vector2(a_y, 1 - a_z),
                new THREE.Vector2(b_y, 1 - b_z),
                new THREE.Vector2(c_y, 1 - c_z),
                new THREE.Vector2(d_y, 1 - d_z)
            ];

        }

    }

};

function gaussBlur(imgData) {
    var pixes = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var gaussMatrix = [],
        gaussSum = 0,
        x, y,
        r, g, b, a,
        i, j, k, len;

    var radius = 10;
    var sigma = 20;

    a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    b = -1 / (2 * sigma * sigma);
    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++, i++) {
        g = a * Math.exp(b * x * x);
        gaussMatrix[i] = g;
        gaussSum += g;

    }
    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0, len = gaussMatrix.length; i < len; i++) {
        gaussMatrix[i] /= gaussSum;
    }
    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            r = g = b = a = 0;
            gaussSum = 0;
            for (j = -radius; j <= radius; j++) {
                k = x + j;
                if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
                    //r,g,b,a 四个一组
                    i = (y * width + k) * 4;
                    r += pixes[i] * gaussMatrix[j + radius];
                    g += pixes[i + 1] * gaussMatrix[j + radius];
                    b += pixes[i + 2] * gaussMatrix[j + radius];
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius];
                }
            }
            i = (y * width + x) * 4;
            // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
            // console.log(gaussSum)
            pixes[i] = r / gaussSum;
            pixes[i + 1] = g / gaussSum;
            pixes[i + 2] = b / gaussSum;
            // pixes[i + 3] = a ;
        }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            r = g = b = a = 0;
            gaussSum = 0;
            for (j = -radius; j <= radius; j++) {
                k = y + j;
                if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
                    i = (k * width + x) * 4;
                    r += pixes[i] * gaussMatrix[j + radius];
                    g += pixes[i + 1] * gaussMatrix[j + radius];
                    b += pixes[i + 2] * gaussMatrix[j + radius];
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius];
                }
            }
            i = (y * width + x) * 4;
            pixes[i] = r / gaussSum;
            pixes[i + 1] = g / gaussSum;
            pixes[i + 2] = b / gaussSum;
        }
    }
    //end
    return imgData;
}
