import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'

import CarScene from '../demo/CarControl/CarScene'
import GeoScene from '../demo/GeoJson/GeoScene'
import BeautyScene from '../demo/BeautyMakeup/BeautyScene'
import FaceScene from '../demo/BeautyMakeup/FaceScene'
import ReflectScene from '../demo/Reflect/ReflectScene'
import LedScene from '../demo/Led/LedScene'
import HeatmapScene from '../demo/Heatmap/HeatmapScene'

let renderer,
    clock = new THREE.Clock(true),
    stats = new Stats();
let renderSize = {
    w: 0,
    h: 0
};
let stopRender = false; //停止渲染
let destroyRender = false;
let sences = {};

let _this;

class Renderer {
    constructor(props) {
        _this = this;
        this.container = props.container;
        renderSize.w = props.width;
        renderSize.h = props.height;

        destroyRender = false;
        this._SetRender();
        this._ResizeSet();
        this.choseSence();
    }

    choseSence() {
        let query = _.getQueryStringByName('scene')
        switch (query) {
            case 'carScene':
                sences["carScene"] = new CarScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'geoScene':
                sences["geoScene"] = new GeoScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'beautyScene':
                sences["beautyScene"] = new BeautyScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'faceScene':
                sences["faceScene"] = new FaceScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'reflectScene':
                sences["reflectScene"] = new ReflectScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'ledScene':
                sences["ledScene"] = new LedScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            case 'heatmapScene':
                sences["heatmapScene"] = new HeatmapScene({
                    renderer: renderer,
                    renderSize: renderSize
                })
                break;
            default:
                break;
        }
    }

    _SetRender() {
        var canvas = document.createElement('canvas');
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            premultipliedAlpha: true,
            logarithmicDepthBuffer: false,
            alpha: true,
            stencil: true,
            canvas: canvas
        });
        renderer.setPixelRatio(window.devicePixelRatio || 2);
        renderer.setSize(renderSize.w, renderSize.h);
        renderer.sortObjects = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(renderer.domElement);
        this.container.appendChild(stats.dom);
        renderer.setAnimationLoop(this._Render.bind(this));
    }

    _Render() {
        if (destroyRender) {
            return;
        }
        if (!stopRender) {
            let delta = clock.getDelta();
            stats.update();
            for (const key in sences) {
                if (sences.hasOwnProperty(key)) {
                    const element = sences[key];
                    if (!element.isHidden) element.update(delta);
                }
            }
        }
    }

    onPause = () => {
        stopRender = true;
    }

    onResume = () => {
        stopRender = false;
    }

    onDestroy() {
        destroyRender = true;
        renderer.dispose();
        for (const key in sences) {
            if (sences.hasOwnProperty(key)) {
                const element = sences[key];
                element.dispose();
            }
        }
        EventBus.removeListener(EventBus.Event.UIMessage, this.onUIMessage);
    }

    _ResizeSet() {
        window.onresize = () => {
            let width, height;
            width = this.container.clientWidth;
            height = this.container.clientHeight;

            renderer.setSize(width, height);
            for (const key in sences) {
                if (sences.hasOwnProperty(key)) {
                    const element = sences[key];
                    element.resize(width, height);
                }
            }
        }
    }
}

export default Renderer