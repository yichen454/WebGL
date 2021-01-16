import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'

import MouthEntity from './mouthEntity'

import {
    getRect,
    screenPointToThreeCoords,
    imgPointToScreenPoint
} from './utils'

import face1 from './face/face1.jpg'
import data_face1 from './face/data_face1.json'

export default class BeautyScene extends BaseScene {

    splitX = 0
    imgParams = { width: 0, height: 0 }

    constructor(porps) {
        super(porps);
        document.title = '动态美妆-口红';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'BeautyScene'])
        }

        this.splitX = this.renderSize.w / 2;
        this.renderer.setScissorTest(true);
        this.renderer.toneMapping = THREE.NoToneMapping;
        EventBus.addListener(EventBus.Event.splicIcon_event, this.splicEvent);
    }

    _SetCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, .1, 100);
        this.camera.position.set(0, 0, 10);
        // let dom = this.renderer.domElement;
        // this.controls = new OrbitControls(this.camera, dom);
        // this.controls.enablePan = false;
        // dom.style.outline = 'none';
        this.scene = new THREE.Scene();
        this.sceneRight = new THREE.Scene();
    }

    _InitBackGround() {
        this.scene.background = new THREE.Color(0xFFFFFF);
        this.sceneRight.background = new THREE.Color(0xCCCCCC);
    }

    _InitGameObject() {
        let _this = this;
        let img = new Image();
        img.src = face1;
        img.onload = () => {

            _this.imgParams.width = img.width;
            _this.imgParams.height = img.height;

            const {
                planeWidth,
                planeHeight,
                offsetX,
                offsetY,
                scale
            } = _this.getPlaneSize(getRect(_this.camera), img.width, img.height);

            var pg = new THREE.PlaneGeometry(planeWidth, planeHeight)
            let tex = new THREE.Texture();
            tex.encoding = THREE.sRGBEncoding;
            tex.image = img;
            tex.needsUpdate = true;
            _this.faceTexture = tex;
            var pm = new THREE.MeshBasicMaterial({ map: tex })
            _this.plane = new THREE.Mesh(pg, pm)
            _this.scene.add(_this.plane);
            var pm2 = new THREE.MeshBasicMaterial({ map: tex })
            _this.plane2 = new THREE.Mesh(pg, pm2)
            _this.sceneRight.add(_this.plane2);

            var geometry = new THREE.Geometry();
            var pointMaterial = new THREE.PointsMaterial({
                color: 0x000000,
                size: .1
            });
            let landmark = data_face1.faces[0].landmark;
            let landmarkThree = {}
            for (const key in landmark) {
                if (Object.hasOwnProperty.call(landmark, key)) {
                    const element = landmark[key];
                    var pos = imgPointToScreenPoint(element.x, element.y, offsetX, offsetY, scale);
                    var vec = screenPointToThreeCoords(pos.x / _this.renderSize.w * 2 - 1, 1 - pos.y / _this.renderSize.h * 2, _this.camera, .1);
                    geometry.vertices.push(vec);
                    landmarkThree[key] = vec;
                }
            }
            let mouthEntity = new MouthEntity({
                texture: _this.faceTexture,
                imgParams: _this.imgParams,
                parent: _this.plane2,
                landmark: landmark,
                landmarkThree: landmarkThree
            })
            var points = new THREE.Points(geometry, pointMaterial);
            _this.plane.add(points.clone());
        }
    }

    getPlaneSize(rect, imgWidth, imgHeight) {
        let radio = imgWidth / imgHeight;
        let pw, ph, diffX, diffY, scale;
        if (this.renderSize.w / this.renderSize.h > radio) {
            pw = rect.y * radio;
            ph = rect.y
            diffX = (this.renderSize.w - this.renderSize.h / imgHeight * imgWidth) / 2;
            diffY = 0;
            scale = this.renderSize.h / imgHeight;
        } else {
            pw = rect.x
            ph = rect.x / radio;
            diffX = 0;
            diffY = (this.renderSize.h - this.renderSize.w / imgWidth * imgHeight) / 2;
            scale = this.renderSize.w / imgWidth;
        }
        return { planeWidth: pw, planeHeight: ph, offsetX: diffX, offsetY: diffY, scale: scale };
    }

    splicEvent = (diffX) => {
        this.splitX = this.renderSize.w / 2 + diffX;
    }

    dispose() {
        EventBus.removeListener(EventBus.Event.splicIcon_event, this.splicEvent);
        super.dispose();
        if (this.sceneRight) {
            this.sceneRight.traverse((child) => {
                if (child.isMesh) {
                    child.geometry && child.geometry.dispose();
                    child.material && child.material.dispose();
                }
            })
            this.sceneRight.clear();
        }
        this.renderer.setScissorTest(false);
    }

    update(delta) {
        this.renderer.setScissor(0, 0, this.splitX, this.renderSize.h);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setScissor(this.splitX, 0, this.renderSize.w, this.renderSize.h);
        this.renderer.render(this.sceneRight, this.camera);
    }

}