import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'
import GUIThree from '../../utils/GUIThree'
import Hammer from 'hammerjs'

export default class ScanScene extends BaseScene {

    scanSpeed = 10;

    constructor(porps) {
        super(porps)
        document.title = 'webgl 扫描效果';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'ScanScene'])
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
        let _this = this;
        this.camera = new THREE.PerspectiveCamera(45, this.renderSize.w / this.renderSize.h, 1, 100);
        this.camera.position.set(5, 5, 10);
        let dom = this.renderer.domElement;
        this.controls = new OrbitControls(this.camera, dom);
        this.controls.enablePan = false;
        dom.style.outline = 'none';
        this.scene = new THREE.Scene();

        this.raycaster = new THREE.Raycaster();

        this.game_hammer = new Hammer.Manager(dom);
        this.game_hammer.add(new Hammer.Tap());
        this.game_hammer.on("tap", function (event) {
            console.log(event);

            let point = {
                x: event.center.x / window.innerWidth * 2 - 1,
                y: 1 - event.center.y / window.innerHeight * 2
            }
            let ii = _this.renderRaycasterObj(point);
            console.log(ii.point);
            if (ii) {
                _this.postMaterial.uniforms.scanCenter.value.copy(ii.point);
                _this.postMaterial.uniforms.scanRange.value = 0.0;
            }
        });
        //this.camera.updateProjectionMatrix();
    }

    renderRaycasterObj(point) {
        this.raycaster.setFromCamera(point, this.camera);
        var intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            return intersects[0];
        } else {
            return null;
        }
    }

    _InitPass() {

    }

    _InitPhysics() { }

    _InitBackGround() {

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

        let size = new THREE.Vector2();
        this.renderer.getSize(size);
        let pixelRatio = this.renderer.getPixelRatio();

        let texture = new THREE.DepthTexture();
        this.depthRenderTarget = new THREE.WebGLRenderTarget(size.x * pixelRatio, size.y * pixelRatio, {
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps: false,
            encoding: this.renderer.outputEncoding,
            depthTexture: texture
        });

        let box = new THREE.BoxGeometry(2, 2, 2);
        let bm = new THREE.MeshBasicMaterial({
            color: 0x00FF00
        })
        let cube = new THREE.Mesh(box, bm);
        cube.position.set(0, 2, 0);
        this.scene.add(cube);

        let cube2 = cube.clone();
        cube2.position.set(5, 1, 0);
        this.scene.add(cube2);

        let cube3 = cube.clone();
        cube3.position.set(-5, 1, 0);
        this.scene.add(cube3);

        let pg = new THREE.PlaneGeometry(50, 50);
        let pm = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
        });

        let plane = new THREE.Mesh(pg, pm);
        plane.rotateX(-Math.PI / 2);
        this.scene.add(plane);

        this._SetupPost();

        console.log(this.scene);
    }

    dispose() {
        super.dispose();
        this.controls.dispose();
    }


    _SetupPost() {
        const worldVector = new THREE.Vector3(
            0, 0, 0
        );

        // Setup post processing stage
        this.postCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
        this.postMaterial = new THREE.ShaderMaterial({
            defines: {
                'PERSPECTIVE_CAMERA': 1,
            },
            uniforms: {
                resolution: { value: new THREE.Vector2(this.depthRenderTarget.width, this.depthRenderTarget.height) },
                cameraProjectionMatrix: { value: new THREE.Matrix4() },
                cameraInverseProjectionMatrix: { value: new THREE.Matrix4() },
                projScreenMatrixInverse: { value: new THREE.Matrix4() },
                cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far },
                tDiffuse: { value: null },
                tDepth: { value: null },
                scanCenter: { value: worldVector },
                maxRange: { value: 50.0 },
                scanRange: { value: 0.0 },
                scanWidth: { value: 0.1 },
                lineSb: { value: 1.0 },
                lineWidth: { value: 0.002 },
                scanColor: { value: new THREE.Color(0x0000FF) },
                scanLineColor: { value: new THREE.Color(0xFF0000) },
            },
            vertexShader:
                `
            varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
            `.trim(),
            fragmentShader:
                `
            #include <packing>
            #define PI 3.141592653589793
			varying vec2 vUv;
            uniform mat4 cameraProjectionMatrix;
            uniform mat4 cameraInverseProjectionMatrix;
            uniform mat4 projScreenMatrixInverse;
            uniform vec2 resolution;
			uniform sampler2D tDiffuse;
			uniform sampler2D tDepth;
			uniform float cameraNear;
			uniform float cameraFar;
            uniform vec3 scanCenter;
            uniform float maxRange;
            uniform float scanRange;
            uniform float scanWidth;
            uniform float lineSb;
            uniform float lineWidth;
            uniform vec3 scanColor;
            uniform vec3 scanLineColor;

            const vec3 rgb_to_g = vec3(0.2126, 0.7152, 0.0722);

			float getDepth( const in vec2 screenPosition ) {
			    return texture2D( tDepth, screenPosition ).x;
		    }

		    float getLinearDepth( const in vec2 screenPosition ) {
			    #if PERSPECTIVE_CAMERA == 1
				    float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			    #else
				    return texture2D( tDepth, screenPosition ).x;
			    #endif
		    }

		    float getViewZ( const in float depth ) {
			    #if PERSPECTIVE_CAMERA == 1
				    return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			    #else
				    return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			    #endif
		    }

		    vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
                float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
			    vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
			    clipPosition *= clipW;
			    return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
		    }

            vec3 getWorldPosition( const in vec2 screenPosition, const in float depth) {
			    vec4 ndc = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
                vec4 worldPos = projScreenMatrixInverse * ndc ;
                worldPos /= worldPos.w;
			    return worldPos.xyz;
		    }

            float getSlobel(){

                float sobelWidth = 4.0;
                vec2 texel = vec2( sobelWidth / resolution.x, sobelWidth / resolution.y );

			    const mat3 Gx = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1 ); // x direction kernel
			    const mat3 Gy = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1 ); // y direction kernel

		        // fetch the 3x3 neighbourhood of a fragment

		        // first column

			    float tx0y0 = dot(texture2D( tDiffuse, vUv + texel * vec2( -1, -1 ) ).rgb,rgb_to_g);
			    float tx0y1 = dot(texture2D( tDiffuse, vUv + texel * vec2( -1,  0 ) ).rgb,rgb_to_g);
			    float tx0y2 = dot(texture2D( tDiffuse, vUv + texel * vec2( -1,  1 ) ).rgb,rgb_to_g);

		        // second column

			    float tx1y0 = dot(texture2D( tDiffuse, vUv + texel * vec2(  0, -1 ) ).rgb,rgb_to_g);
			    float tx1y1 = dot(texture2D( tDiffuse, vUv + texel * vec2(  0,  0 ) ).rgb,rgb_to_g);
			    float tx1y2 = dot(texture2D( tDiffuse, vUv + texel * vec2(  0,  1 ) ).rgb,rgb_to_g);

		        // third column

			    float tx2y0 = dot(texture2D( tDiffuse, vUv + texel * vec2(  1, -1 ) ).rgb,rgb_to_g);
			    float tx2y1 = dot(texture2D( tDiffuse, vUv + texel * vec2(  1,  0 ) ).rgb,rgb_to_g);
			    float tx2y2 = dot(texture2D( tDiffuse, vUv + texel * vec2(  1,  1 ) ).rgb,rgb_to_g);

		        // gradient value in x direction

			    float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
				                Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
				                Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

		        // gradient value in y direction

			    float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
				                Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
				                Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

		        // magnitute of the total gradient

		        float G = sqrt( ( valueGx * valueGx ) + ( valueGy * valueGy ) );

                return G;
            }

			void main() {
				vec4 diffuse = texture2D( tDiffuse, vUv );
				float depth = getDepth( vUv );
                float viewZ = getViewZ( depth );
                float linearDepth = getLinearDepth( vUv );
                vec3 viewPosition = getViewPosition( vUv, depth, viewZ );
                vec3 worldPosition = getWorldPosition( vUv, depth );
                float slobel = getSlobel();
                
                float pixelDistance = distance(worldPosition.xyz, scanCenter.xyz);
                vec3 color = vec3(0.0,0.0,1.0);
                float _ScanRange = scanRange;
                float _ScanWidth = scanWidth;
                float _MaxRange = maxRange;
                float percent;
                if (_ScanRange - pixelDistance > 0.0 && linearDepth < 1.0)
                {
                    float scanPercent = 1.0 - (_ScanRange - pixelDistance) / _ScanWidth;
                    float maxPercent = 1.0 - (_MaxRange - pixelDistance) / _ScanWidth;
                    percent = mix(1.0,0.0,clamp(scanPercent / maxPercent,0.0,1.0));
                } else {
                    percent = 0.0;
                }

                float edgeCircleMask1 = clamp(pow(pixelDistance / 5.0, 2.0),0.0,1.0);
                float edgeCircleMask2 = 1.0 - clamp(round(cos(pixelDistance * 2.0 * PI / lineSb) + 1.5-lineWidth),0.0,1.0) + slobel;
                vec3 dst_color = mix(diffuse.rgb,scanColor,pow(percent, 2.0)*edgeCircleMask1);
                dst_color = mix(dst_color,scanLineColor,percent*edgeCircleMask2);
			    gl_FragColor = vec4(dst_color,diffuse.a);
			}
            `.trim()
        });
        const postPlane = new THREE.PlaneGeometry(2, 2);
        const postQuad = new THREE.Mesh(postPlane, this.postMaterial);
        this.postScene = new THREE.Scene();
        this.postScene.add(postQuad);

        this.postMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix);
        this.postMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse);
        this.postMaterial.uniforms.tDiffuse.value = this.depthRenderTarget.texture;
        this.postMaterial.uniforms.tDepth.value = this.depthRenderTarget.depthTexture;

        this.setGUI(this.postMaterial);
    }

    setGUI(mat) {
        let _this = this;
        let datGui = GUIThree.getGUI();
        let folder = datGui.addFolder("参数调节(点击场景可切换中心)");

        console.log(this.scanSpeed);
        let params = {
            '扫描速度': 10,
            '扫描范围': mat.uniforms.maxRange.value,
            '扫描线间隔': mat.uniforms.lineSb.value,
            '扫描线宽度': mat.uniforms.lineWidth.value,
            '扫描框颜色': mat.uniforms.scanColor.value.getHex(),
            '扫描线颜色': mat.uniforms.scanLineColor.value.getHex(),
            // '偏移': mat.uniforms.offset.value,
        }

        folder.add(params, "扫描速度", 1, 100).step(0.1).onChange((e) => {
            _this.scanSpeed = parseFloat(e);
        });

        folder.add(params, "扫描范围", 1, 100).step(0.1).onChange((e) => {
            mat.uniforms.maxRange.value = parseFloat(e);
        });

        folder.add(params, "扫描线间隔", 0.1, 10).step(0.01).onChange((e) => {
            mat.uniforms.lineSb.value = parseFloat(e);
        })

        folder.add(params, "扫描线宽度", 0.001, 0.1).step(0.001).onChange((e) => {
            mat.uniforms.lineWidth.value = parseFloat(e);
        })

        folder.addColor(params, "扫描框颜色").onChange((e) => {
            mat.uniforms.scanColor.value = new THREE.Color(e);
        })

        folder.addColor(params, "扫描线颜色").onChange((e) => {
            mat.uniforms.scanLineColor.value = new THREE.Color(e);
        })

        folder.open();
    }

    update(delta) {
        this.renderer.setRenderTarget(this.depthRenderTarget);
        this.renderer.render(this.scene, this.camera);

        let projScreenMatrixInverse = this.postMaterial.uniforms.projScreenMatrixInverse.value;
        projScreenMatrixInverse.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse).invert();

        this.postMaterial.uniforms.scanRange.value += delta * this.scanSpeed;
        if (this.postMaterial.uniforms.scanRange.value >= this.postMaterial.uniforms.maxRange.value) {
            this.postMaterial.uniforms.scanRange.value = 0.0;
        }

        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCamera);
    }

}