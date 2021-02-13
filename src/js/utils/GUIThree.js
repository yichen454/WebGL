import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { Pass } from 'three/examples/jsm/postprocessing/Pass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'

let datGui = null;
let isAdd = false;
class GUIThree {

    constructor() {
        if (!datGui) {
            datGui = new GUI();
        }

        if (!isAdd) {
            datGui.domElement.style.right = 0;
            datGui.domElement.style.position = 'absolute';
            datGui.domElement.style.zIndex = 20000;
            document.body.appendChild(datGui.domElement);
            isAdd = true;
        }
    }

    getGUI() {
        return datGui;
    }

    setTarget(target, name = target.type) {
        this.name = name
        if (target instanceof THREE.Object3D) {

        } else if (target instanceof THREE.Material) {
            this.inMaterial(target);
        } else if (target instanceof Pass) {
            this.inPass(target);
        }
    }

    inObject(obj) {

    }

    inMaterial(mat) {
        let folder = datGui.addFolder(this.name + " (" + mat.type + ")");

        addColor();
        folder.add(mat, "vertexColors", mat.vertexColors);
        addAlpha();
        folder.add(mat, 'blending', {
            'NoBlending': THREE.NoBlending,
            'NormalBlending': THREE.NormalBlending,
            'AdditiveBlending': THREE.AdditiveBlending,
            'SubtractiveBlending': THREE.SubtractiveBlending,
            'MultiplyBlending': THREE.MultiplyBlending,
            'CustomBlending': THREE.CustomBlending
        }).onChange((val) => {
            mat.blending = Number(val);
        });

        folder.add(mat, 'side', {
            'FrontSide': THREE.FrontSide,
            'BackSide': THREE.BackSide,
            'DoubleSide': THREE.DoubleSide
        }).onChange((val) => {
            mat.side = Number(val);
        });

        if (mat instanceof THREE.MeshBasicMaterial) {
            addGeneral();
        } else if (mat instanceof THREE.MeshStandardMaterial) {
            addEmissive();
            addGeneral();
            addMR();
            folder.add(mat, "envMapIntensity", 0, 10).step(0.01);
            addNomal();
            if (mat instanceof THREE.MeshPhysicalMaterial) {
                folder.add(mat, "clearcoat", 0, 1).step(0.01);
                folder.add(mat, "clearcoatRoughness", 0, 1).step(0.01);
            }
        } else {
            console.error('no debug material', mat);
        }

        function addColor() {
            let params = {
                color: mat.color.getHex(),
            }
            folder.addColor(params, "color").onChange((e) => {
                mat.color = new THREE.Color(e);
            });
        }

        function addGeneral() {
            folder.add(mat, "skinning", mat.skinning);
            folder.add(mat, "wireframe", mat.wireframe);
        }

        function addEmissive() {
            let params = {
                emissive: mat.emissive.getHex(),
            }
            folder.addColor(params, "emissive").onChange((e) => {
                mat.emissive = new THREE.Color(e);
            });
            folder.add(mat, "emissiveIntensity", 0, 10).step(0.01);
        }

        function addAlpha() {
            folder.add(mat, "transparent", mat.transparent);
            folder.add(mat, "opacity", 0, 1).step(0.01);
            folder.add(mat, "depthTest", mat.depthTest);
            folder.add(mat, "depthWrite", mat.depthWrite);
            folder.add(mat, "alphaTest", 0, 100).step(0.1);
        }

        function addMR() {
            folder.add(mat, "roughness", 0, 1).step(0.01);
            folder.add(mat, "metalness", 0, 1).step(0.01);
        }

        function addNomal() {
            let params = {
                normalMapType: mat.normalMapType,
                normalScaleX: mat.normalScale.x,
                normalScaleY: mat.normalScale.y,
            }
            folder.add(mat, 'normalMapType', { 'TangentSpaceNormalMap': THREE.TangentSpaceNormalMap, 'ObjectSpaceNormalMap': THREE.ObjectSpaceNormalMap }).onChange((val) => {
                mat.normalMapType = Number(val);
            });
            folder.add(params, 'normalScaleX', - 10, 100).step(0.01).onChange((val) => {
                mat.normalScale.x = Number(val);
            });
            folder.add(params, 'normalScaleY', - 10, 100).step(0.01).onChange((val) => {
                mat.normalScale.y = Number(val);
            });
        }
    }


    inPass(pass) {
        let folder = datGui.addFolder(this.name);

        if (pass instanceof UnrealBloomPass) {
            folder.add(pass, "strength", 0, 10).step(0.01);
            folder.add(pass, "threshold", 0, 1).step(0.001);
            folder.add(pass, "radius", -1, 1).step(0.01);
        } else if (pass instanceof OutlinePass) {

        } else {
            console.error('no debug pass', pass);
        }
    }
}

export default new GUIThree();