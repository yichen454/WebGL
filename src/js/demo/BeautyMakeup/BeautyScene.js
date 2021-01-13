import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'

import { getRect } from './utils'

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
        img.src = './textures/face/face1.jpg';
        img.onload = () => {
            let rect = getRect(_this.camera);
            _this.imgParams.width = img.width;
            _this.imgParams.height = img.height;
            let radio = img.width / img.height;
            let pw = rect.y * radio;
            let ph = rect.y

            var pg = new THREE.PlaneGeometry(pw, ph)
            let tex = new THREE.Texture();
            tex.encoding = THREE.sRGBEncoding;
            tex.image = img;
            tex.needsUpdate = true;
            var pm = new THREE.MeshBasicMaterial({ map: tex })
            _this.plane = new THREE.Mesh(pg, pm)
            _this.scene.add(_this.plane);
            var pm2 = new THREE.MeshBasicMaterial({ color: 0xff0000, map: tex })
            _this.plane2 = new THREE.Mesh(pg, pm2)
            _this.sceneRight.add(_this.plane2);

        }
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