import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import BaseScene from '../../graphics/BaseScene'
import GUIThree from '../../utils/GUIThree'

import rain_eff from './rain_eff.png'
import raindrop from './rain.png'

import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { MathUtils } from 'three'

export default class RainScene extends BaseScene {

    constructor(porps) {
        super(porps)
        document.title = 'webgl 雨天效果';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'RainScene'])
        }

    MathUtils
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
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, .1, 1000);
        this.camera.position.set(0, 20, 20);
        let dom = this.renderer.domElement;
        this.controls = new OrbitControls(this.camera, dom);
        this.controls.enablePan = false;
        dom.style.outline = 'none';
        this.scene = new THREE.Scene();
    }

    _InitPass() {
        THREE.RectAreaLight
    }

    _InitPhysics() {
    }

    _InitBackGround() {
    }

    _InitLight() {
    }

    _InitHelper() {
        var axisHelper = new THREE.AxesHelper(100);
        this.scene.add(axisHelper);

        // var grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        // this.scene.add(grid);
    }

    _InitGameObject() {
        let _this = this;
        let pw = 5;
        let ph = 5;
        var pg = new THREE.PlaneGeometry(pw, ph);
        var pm = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const worldWidth = 256, worldDepth = 256;
        const data = this.generateHeight(worldWidth, worldDepth);

        let eff_tex = new THREE.TextureLoader().load(rain_eff);
        eff_tex.wrapS = THREE.RepeatWrapping;
        eff_tex.wrapT = THREE.RepeatWrapping;

        let ct = new THREE.CanvasTexture(this.generateTexture(data, worldWidth, worldDepth));
        ct.wrapS = THREE.ClampToEdgeWrapping;
        ct.wrapT = THREE.ClampToEdgeWrapping;

        var customMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: {
                    value: ct
                },
                mTexture: {
                    value: eff_tex
                },
                flowSpeed: {
                    value: 0.2
                },
                time: {
                    value: 0.0
                }
            },
            vertexShader:
                `
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                void main() {
                    vUv = uv;
                    vWorldNormal = (modelMatrix * vec4(normal, 1.0 )).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
                `.trim(),
            fragmentShader:
                `
                #define PI 3.141592653589793
                uniform sampler2D mTexture;
                uniform sampler2D map;
                uniform float flowSpeed;
                uniform float time;
                varying vec2 vUv;
                varying vec3 vWorldNormal;

                void main() {
                    vec2 uv = vUv*50.0;
                    vec4 ori_tex = texture2D(map, vUv);
                    vec4 diffuse = texture2D(mTexture, uv);
                    float ripple_color = texture2D(mTexture, uv).r;
                    float ripple_color2 = texture2D(mTexture, uv+vec2(0.75,0.75)).r;
                    float stream_color = diffuse.g;

                    vec2 uv_flow = uv+vec2(0.0,time*flowSpeed);
                    float flow_color = pow(texture2D(mTexture, uv_flow).b,5.0);
                    float up = 1.0-clamp(vWorldNormal.y,0.0,1.0);
                    float final_flow_color = stream_color*flow_color*up;
    
                    float emissiveSpeed = time*1.0;
                    float emissive = clamp(1.0-fract(emissiveSpeed) - ripple_color, 0.0, 1.0);
                    float emissive2 = clamp(1.0-fract(emissiveSpeed + 0.5) - ripple_color2, 0.0, 1.0);
                    float mask_color = (1.0-distance(emissive,0.05)/0.05) * ripple_color;
                    float mask_color2 = (1.0-distance(emissive2,0.05)/0.05) * ripple_color2;
                    float maskSwitch = clamp(abs(sin((emissiveSpeed*PI))), 0.0, 1.0);
                    float final_ripple_color = clamp(mix(mask_color , mask_color2 ,maskSwitch ), 0.0, 1.0)*(1.0-up);
                    float final_color = mix(final_ripple_color,final_flow_color,final_flow_color);
                    gl_FragColor = vec4(ori_tex.rgb+vec3(final_color),1.0);
                    //gl_FragColor = vec4(vWorldNormal,1.0);
                }
                `.trim(),
            transparent: true,
        });
        this.mat = customMaterial;


        // let BoxGeometry = new THREE.BoxGeometry(2, 2, 2);
        // let cube = new THREE.Mesh(BoxGeometry, customMaterial);
        // cube.position.set(0, 5, 0);
        // this.scene.add(cube);

        const geometry = new THREE.PlaneGeometry(20, 20, worldWidth - 1, worldDepth - 1);
        geometry.rotateX(- Math.PI / 2);

        const vertices = geometry.attributes.position.array;


        for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

            vertices[j + 1] = data[i] * .05;

        }
        geometry.computeVertexNormals();
        let terrainMesh = new THREE.Mesh(geometry, customMaterial);
        this.scene.add(terrainMesh);


        let rainMesh = this.createRain();
        this.rainMat = rainMesh.material;
        this.scene.add(rainMesh);
    }

    createRain() {

        var geometry = new THREE.BufferGeometry();

        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        var box = new THREE.Box3(
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 10, 10)
        );

        for (let i = 0; i < 10000; i++) {
            const pos = new THREE.Vector3();
            pos.x = Math.random() * (box.max.x - box.min.x) + box.min.x;
            pos.y = Math.random() * (box.max.y - box.min.y) + box.min.y;
            pos.z = Math.random() * (box.max.z - box.min.z) + box.min.z;

            const height = (box.max.y - box.min.y) / 15;
            const width = height / 50;

            vertices.push(
                pos.x + width,
                pos.y + height,
                pos.z,
                pos.x - width,
                pos.y + height,
                pos.z,
                pos.x - width,
                pos.y,
                pos.z,
                pos.x + width,
                pos.y,
                pos.z
            );

            normals.push(
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z
            );

            uvs.push(1, 1, 0, 1, 0, 0, 1, 0);

            indices.push(
                i * 4 + 0,
                i * 4 + 1,
                i * 4 + 2,
                i * 4 + 0,
                i * 4 + 2,
                i * 4 + 3
            );
        }
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(vertices), 3)
        );
        geometry.setAttribute(
            "normal",
            new THREE.BufferAttribute(new Float32Array(normals), 3)
        );
        geometry.setAttribute(
            "uv",
            new THREE.BufferAttribute(new Float32Array(uvs), 2)
        );
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));


        let rain_tex = new THREE.TextureLoader().load(raindrop);
        let material = new THREE.MeshBasicMaterial({
            map: rain_tex,
            transparent: true,
            depthWrite: false,
            opacity: 0.3,
        });

        material.onBeforeCompile = function (shader, renderer) {
            const getFoot = `
            uniform float top;
            uniform float bottom;
            uniform float time;
            #include <common>
            float angle(float x, float y){
              return atan(y, x);
            }
            vec2 getFoot(vec2 camera,vec2 normal,vec2 pos){
                vec2 position;

                float distanceLen = distance(pos, normal);

                float a = angle(camera.x - normal.x, camera.y - normal.y);

                pos.x > normal.x ? a -= 0.785 : a += 0.785; 

                position.x = cos(a) * distanceLen;
                position.y = sin(a) * distanceLen;
                
                return position + normal;
            }
            `;
            const begin_vertex = `
            vec2 foot = getFoot(vec2(cameraPosition.x, cameraPosition.z),  vec2(normal.x, normal.z), vec2(position.x, position.z));
            float height = top - bottom;
            float y = normal.y - bottom - height * time;
            y = y + (y < 0.0 ? height : 0.0);
            float ratio = (1.0 - y / height) * (1.0 - y / height);
            y = height * (1.0 - ratio);
            y += bottom;
            y += position.y - normal.y;
            vec3 transformed = vec3( foot.x, y, foot.y );
            // vec3 transformed = vec3( position );
            `;
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                getFoot
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                begin_vertex
            );

            shader.uniforms.cameraPosition = {
                value: new THREE.Vector3(0, 0, 0),
            };
            shader.uniforms.top = {
                value: 10,
            };
            shader.uniforms.bottom = {
                value: 0,
            };
            shader.uniforms.time = {
                value: 0,
            };
            material.uniforms = shader.uniforms;
        }
        let mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    generateHeight(width, height) {

        let seed = Math.PI / 4;
        let random = function () {

            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);

        };

        const size = width * height, data = new Uint8Array(size);
        const perlin = new ImprovedNoise(), z = random() * 100;

        let quality = 1;

        for (let j = 0; j < 4; j++) {

            for (let i = 0; i < size; i++) {

                const x = i % width, y = ~ ~(i / width);
                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

            }

            quality *= 5;

        }

        return data;

    }

    generateTexture(data, width, height) {

        let context, image, imageData, shade;

        const vector3 = new THREE.Vector3(0, 0, 0);

        const sun = new THREE.Vector3(1, 1, 1);
        sun.normalize();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);

        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

            vector3.x = data[j - 2] - data[j + 2];
            vector3.y = 2;
            vector3.z = data[j - width * 2] - data[j + width * 2];
            vector3.normalize();

            shade = vector3.dot(sun);

            imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
            imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
            imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);

        }

        context.putImageData(image, 0, 0);

        // Scaled 4x

        const canvasScaled = document.createElement('canvas');
        canvasScaled.width = width * 4;
        canvasScaled.height = height * 4;

        context = canvasScaled.getContext('2d');
        context.scale(4, 4);
        context.drawImage(canvas, 0, 0);

        image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
        imageData = image.data;

        for (let i = 0, l = imageData.length; i < l; i += 4) {

            const v = ~ ~(Math.random() * 5);

            imageData[i] += v;
            imageData[i + 1] += v;
            imageData[i + 2] += v;

        }

        context.putImageData(image, 0, 0);

        return canvasScaled;

    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }


    time = 0;
    update(delta) {
        let material = this.rainMat;
        this.time = (this.time + delta * 0.4) % 1;

        if (material.uniforms) {
            material.uniforms.cameraPosition.value.copy(this.camera.position);
            material.uniforms.time.value = this.time;
        }
        this.renderer.render(this.scene, this.camera);
        this.mat.uniforms.time.value += delta;
    }

}