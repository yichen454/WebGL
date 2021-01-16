import * as THREE from 'three'

import { getDistance2d, createCurve2d } from './utils'
import GUIThree from '../GUIThree'

import lip_color from './res/lip_color.png'

export default class MouthEntity {

    constructor(props) {
        this.originTex = props.texture;
        this.parent = props.parent;
        this.imgParams = props.imgParams;
        let geometry = this.createGeometry(props.landmark, props.landmarkThree);
        // let material = new THREE.MeshBasicMaterial({
        //     color: 0xFF0000,
        // })
        let material = this.createMaterial();
        let mesh = new THREE.Mesh(geometry, material)
        // new GUIThree(material);
        this.parent.add(mesh);

        this.setGUI(material);
    }

    createGeometry(landmark, landmarkThree) {
        let _this = this;
        var vertices_upper_name = [
            'mouth_left_corner', //45
            'mouth_upper_lip_left_contour2', //51
            'mouth_upper_lip_left_contour1', //49
            'mouth_upper_lip_top', //46
            'mouth_upper_lip_right_contour1', //48
            'mouth_upper_lip_right_contour2', //50
            'mouth_right_corner', //44
            'mouth_upper_lip_right_contour3', //52
            'mouth_upper_lip_bottom', //47
            'mouth_upper_lip_left_contour3', //53
        ];
        var vertices_lower_name = [
            'mouth_left_corner', //45
            'mouth_lower_lip_left_contour2', //61
            'mouth_lower_lip_left_contour3', //60
            'mouth_lower_lip_bottom', //55
            'mouth_lower_lip_right_contour3', //59
            'mouth_lower_lip_right_contour2', //58
            'mouth_right_corner', //44
            // 'mouth_lower_lip_right_contour1', //56
            // 'mouth_lower_lip_top', //54
            // 'mouth_lower_lip_left_contour1', //57
            'mouth_upper_lip_right_contour3', //52
            'mouth_upper_lip_bottom', //47
            'mouth_upper_lip_left_contour3', //53
        ];

        let length = getDistance2d(landmark['mouth_upper_lip_top'], landmark['mouth_upper_lip_bottom']);
        console.log(length);

        let vertices_upper_landmark = []
        let vertices_lower_landmark = []

        let vertices_upper_landmarkThree = []
        let vertices_lower_landmarkThree = []

        vertices_upper_name.forEach(key => {
            landmark[key].z = 0;
            vertices_upper_landmark.push(landmark[key]);
            vertices_upper_landmarkThree.push(landmarkThree[key])
        });

        vertices_lower_name.forEach(key => {
            landmark[key].z = 0;
            vertices_lower_landmark.push(landmark[key]);
            let lowerThree = landmarkThree[key];
            lowerThree.z = landmarkThree[key].z * 0.9;
            vertices_lower_landmarkThree.push(lowerThree)
        });

        let mouth = {
            vertices: [],
            uvs: [],
            uvs2: [],
            indices: []
        }

        let resultPointOri = [];
        createCurve2d(vertices_upper_landmark, resultPointOri, 20, 0.6);
        createCurve2d(vertices_lower_landmark, resultPointOri, 20, 0.6);

        let resultPointThree = [];
        createCurve2d(vertices_upper_landmarkThree, resultPointThree, 20, 0.6);
        createCurve2d(vertices_lower_landmarkThree, resultPointThree, 20, 0.6);



        // var pointGeometry = new THREE.Geometry();
        // var pointMaterial = new THREE.PointsMaterial({
        //     color: 0xFF0000,
        //     size: .05
        // });
        // resultPoint.forEach(element => {
        //     pointGeometry.vertices.push(element);
        // });
        // let points = new THREE.Points(pointGeometry, pointMaterial);
        // this.parent.add(points);

        resultPointOri.forEach(element => {
            mouth.uvs2.push(element.x / _this.imgParams.width);
            mouth.uvs2.push(1 - element.y / _this.imgParams.height);
        });

        resultPointThree.forEach(element => {
            mouth.vertices.push(element.x);
            mouth.vertices.push(element.y);
            mouth.vertices.push(element.z);
        });

        let faces = lipObjData.split("\n");
        for (let i = 0; i < faces.length; i++) {
            var row = faces[i].split(" ");
            switch (row[0]) {
                case "vt":
                    mouth.uvs.push(parseFloat(row[1]));
                    mouth.uvs.push(1.0 - parseFloat(row[2]));
                    break;
                case "f":
                    mouth.indices.push(parseInt(row[1]) - 1);
                    mouth.indices.push(parseInt(row[2]) - 1);
                    mouth.indices.push(parseInt(row[3]) - 1);
                    break;
            }
        }

        let vertices = new Float32Array(mouth.vertices);
        let verticesPosition = new THREE.BufferAttribute(vertices, 3);
        let uvs = new Float32Array(mouth.uvs);
        let uvPosition = new THREE.BufferAttribute(uvs, 2);
        let uvs2 = new Float32Array(mouth.uvs2);
        let uvPosition2 = new THREE.BufferAttribute(uvs2, 2);
        let indices = new Int32Array(mouth.indices);
        let intPosition = new THREE.Uint16BufferAttribute(indices, 1);
        let geometry = new THREE.BufferGeometry();

        geometry.setAttribute('position', verticesPosition);
        geometry.setAttribute('uv', uvPosition);
        geometry.setAttribute('uv2', uvPosition2);
        geometry.setIndex(intPosition);

        return geometry;
    }

    createMaterial() {
        let _this = this;
        let texLoader = new THREE.TextureLoader();
        let material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: {
                    value: _this.originTex
                },
                lipstick_median_texture: {
                    value: texLoader.load(lip_color)
                },
                lipstick_color_0: {
                    type: "c",
                    value: new THREE.Color(0xFF0000)
                },
                mixed_coefficient: {
                    type: 'f',
                    value: 6.18
                },
                force_bright_threshold: {
                    type: 'f',
                    value: 0.8
                },
                shimmer_normalize_factor: {
                    type: 'f',
                    value: 0.01
                },
            },
            vertexShader: [
                'attribute vec2 uv2;',
                'varying vec2 vUv;',
                'varying vec2 vUv2;',

                'void main() {',
                'vUv = uv;',
                'vUv2 = uv2;',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join("\n"),
            fragmentShader: [
                'uniform sampler2D uTexture;',
                'uniform sampler2D lipstick_median_texture;',

                'uniform vec3 lipstick_color_0;',

                'uniform float mixed_coefficient;',
                'uniform float force_bright_threshold;',
                'uniform float shimmer_normalize_factor;',

                'varying vec2 vUv;',
                'varying vec2 vUv2;',

                'const lowp vec3 rgb_to_y = vec3(0.299, 0.587, 0.114);',
                'const lowp float flt_epsilon = 0.001;',

                'float HardLight(float color, float layer) {',
                'if(color < 0.5) {',
                'color = 2.0 * layer * color;',
                '} else {',
                'color = 1.0 - 2.0 * (1.0 - layer) * (1.0 - color);',
                '}',
                'return(color);}',

                'vec3 RGBtoHCV(vec3 rgb) {',
                'vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1.0, 0.66666667) : vec4(rgb.gb, 0.0, -0.33333333);',
                'vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);',
                'float c = q.x - min(q.w, q.y);',
                'float h = abs((q.w - q.y) / (6.0 * c + flt_epsilon) + q.z);',
                'return(vec3(h, c, q.x));}',

                'vec3 RGBtoHSL(vec3 rgb) {',
                'vec3 hcv = RGBtoHCV(rgb);',
                'float l = hcv.z - hcv.y * 0.5;',
                'float s = hcv.y / (1.0 - abs(l * 2.0 - 1.0) + flt_epsilon);',
                'return(vec3(hcv.x, s, l));}',

                'vec3 HSLtoRGB(vec3 hsl) {',
                'vec3 rgb;',
                'float x = hsl.x * 6.0;',
                'rgb.r = abs(x - 3.0) - 1.0;',
                'rgb.g = 2.0 - abs(x - 2.0);',
                'rgb.b = 2.0 - abs(x - 4.0);',
                'rgb = clamp(rgb, 0.0, 1.0);',
                'float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;',
                'rgb = clamp((rgb - vec3(0.5)) * vec3(c) + vec3(hsl.z), 0.0, 1.0);',
                'return(rgb);}',

                'void main() {',
                'vec4 source = texture2D(uTexture, vUv2);',
                'float gray = dot(source.rgb, rgb_to_y);',
                'float grayColor = dot(lipstick_color_0, rgb_to_y);',
                'vec3 dst_color = source.rgb;',
                'vec4 medianColor = texture2D(lipstick_median_texture, vUv);',
                'float alpha = medianColor.a;',
                'vec4 baseColor = medianColor + 1.0 * (1.0 - medianColor.a);',
                'baseColor.rgb = 1.0 - (1.0 - baseColor.rgb) * (1.0 - lipstick_color_0);',
                'vec4 blendColor = medianColor;',
                'blendColor.rgb = (1.0 - blendColor.rgb) * lipstick_color_0;',
                'vec3 color = mix(blendColor.rgb * source.rgb, blendColor.rgb, gray);',
                'dst_color = mix(color, source.rgb, pow(gray,mixed_coefficient));',

                'float diff = max(gray - force_bright_threshold, 0.0) * alpha;',
                'dst_color = vec3(1.0) - (vec3(1.0) - dst_color) * vec3(1.0 - diff);',

                'float transition_ratio = (min(max(abs(vUv.x - 0.5), 0.083), 0.5) - 0.083) / 0.417;',
                'float luma_weight = gray * shimmer_normalize_factor;',
                'float shimmer_weight = 1.0 - 0.3 * transition_ratio;',

                'vec3 hsl = RGBtoHSL(dst_color);',
                'hsl.z = min(hsl.z + shimmer_weight * luma_weight * alpha, 1.0);',
                'dst_color = HSLtoRGB(hsl);',

                'gl_FragColor = vec4(dst_color, alpha);',
                '}'
            ].join("\n"),
            transparent: true,
        })

        return material;
    }


    update(delta) {

    }


    setGUI(mat) {
        let datGui = GUIThree.getGUI();
        let folder = datGui.addFolder("口红");

        let params = {
            '颜色': mat.uniforms.lipstick_color_0.value.getHex(),
            '混合系数': mat.uniforms.mixed_coefficient.value,
            '亮区阈值': mat.uniforms.force_bright_threshold.value,
            '微光': mat.uniforms.shimmer_normalize_factor.value,
        }
        folder.addColor(params, "颜色").onChange((e) => {
            mat.uniforms.lipstick_color_0.value = new THREE.Color(e);
        });

        folder.add(params, "混合系数", 0, 10).step(0.01).onChange((e) => {
            mat.uniforms.mixed_coefficient.value = parseFloat(e);
        })

        folder.add(params, "亮区阈值", 0, 1).step(0.01).onChange((e) => {
            mat.uniforms.force_bright_threshold.value = parseFloat(e);
        })

        folder.add(params, "微光", 0, 1).step(0.01).onChange((e) => {
            mat.uniforms.shimmer_normalize_factor.value = parseFloat(e);
        })
    }
}


var lipObjData =
    "vt 0.039063 0.480469\n" +
    "vt 0.038747 0.476381\n" +
    "vt 0.040331 0.471054\n" +
    "vt 0.043654 0.464613\n" +
    "vt 0.048556 0.457181\n" +
    "vt 0.054877 0.448883\n" +
    "vt 0.062455 0.439842\n" +
    "vt 0.071132 0.430183\n" +
    "vt 0.080747 0.420028\n" +
    "vt 0.091139 0.409503\n" +
    "vt 0.102148 0.398730\n" +
    "vt 0.113615 0.387835\n" +
    "vt 0.125378 0.376941\n" +
    "vt 0.137278 0.366171\n" +
    "vt 0.149154 0.355650\n" +
    "vt 0.160846 0.345502\n" +
    "vt 0.172194 0.335850\n" +
    "vt 0.183037 0.326819\n" +
    "vt 0.193216 0.318532\n" +
    "vt 0.202569 0.311114\n" +
    "vt 0.210938 0.304688\n" +
    "vt 0.218963 0.298796\n" +
    "vt 0.227361 0.292916\n" +
    "vt 0.236083 0.287073\n" +
    "vt 0.245081 0.281294\n" +
    "vt 0.254306 0.275604\n" +
    "vt 0.263709 0.270030\n" +
    "vt 0.273241 0.264598\n" +
    "vt 0.282853 0.259334\n" +
    "vt 0.292497 0.254264\n" +
    "vt 0.302124 0.249414\n" +
    "vt 0.311685 0.244810\n" +
    "vt 0.321131 0.240478\n" +
    "vt 0.330414 0.236444\n" +
    "vt 0.339485 0.232735\n" +
    "vt 0.348294 0.229376\n" +
    "vt 0.356794 0.226394\n" +
    "vt 0.364935 0.223814\n" +
    "vt 0.372669 0.221663\n" +
    "vt 0.379946 0.219966\n" +
    "vt 0.386719 0.218750\n" +
    "vt 0.393168 0.218189\n" +
    "vt 0.399509 0.218387\n" +
    "vt 0.405748 0.219265\n" +
    "vt 0.411887 0.220744\n" +
    "vt 0.417932 0.222745\n" +
    "vt 0.423886 0.225189\n" +
    "vt 0.429753 0.227997\n" +
    "vt 0.435538 0.231091\n" +
    "vt 0.441243 0.234390\n" +
    "vt 0.446875 0.237817\n" +
    "vt 0.452436 0.241293\n" +
    "vt 0.457931 0.244737\n" +
    "vt 0.463364 0.248073\n" +
    "vt 0.468739 0.251219\n" +
    "vt 0.474060 0.254099\n" +
    "vt 0.479331 0.256631\n" +
    "vt 0.484557 0.258739\n" +
    "vt 0.489741 0.260342\n" +
    "vt 0.494887 0.261361\n" +
    "vt 0.500000 0.261719\n" +
    "vt 0.505113 0.261361\n" +
    "vt 0.510259 0.260342\n" +
    "vt 0.515443 0.258739\n" +
    "vt 0.520669 0.256631\n" +
    "vt 0.525940 0.254099\n" +
    "vt 0.531261 0.251219\n" +
    "vt 0.536636 0.248073\n" +
    "vt 0.542069 0.244738\n" +
    "vt 0.547564 0.241293\n" +
    "vt 0.553125 0.237817\n" +
    "vt 0.558757 0.234390\n" +
    "vt 0.564462 0.231091\n" +
    "vt 0.570247 0.227997\n" +
    "vt 0.576114 0.225189\n" +
    "vt 0.582068 0.222745\n" +
    "vt 0.588112 0.220744\n" +
    "vt 0.594252 0.219265\n" +
    "vt 0.600491 0.218387\n" +
    "vt 0.606832 0.218189\n" +
    "vt 0.613281 0.218750\n" +
    "vt 0.620054 0.219966\n" +
    "vt 0.627331 0.221663\n" +
    "vt 0.635065 0.223814\n" +
    "vt 0.643206 0.226394\n" +
    "vt 0.651706 0.229376\n" +
    "vt 0.660515 0.232735\n" +
    "vt 0.669586 0.236444\n" +
    "vt 0.678869 0.240478\n" +
    "vt 0.688315 0.244810\n" +
    "vt 0.697876 0.249414\n" +
    "vt 0.707503 0.254264\n" +
    "vt 0.717147 0.259334\n" +
    "vt 0.726759 0.264598\n" +
    "vt 0.736291 0.270030\n" +
    "vt 0.745694 0.275604\n" +
    "vt 0.754919 0.281294\n" +
    "vt 0.763917 0.287073\n" +
    "vt 0.772639 0.292916\n" +
    "vt 0.781037 0.298796\n" +
    "vt 0.789063 0.304688\n" +
    "vt 0.797431 0.311114\n" +
    "vt 0.806784 0.318532\n" +
    "vt 0.816963 0.326819\n" +
    "vt 0.827806 0.335850\n" +
    "vt 0.839154 0.345502\n" +
    "vt 0.850846 0.355650\n" +
    "vt 0.862722 0.366171\n" +
    "vt 0.874622 0.376941\n" +
    "vt 0.886385 0.387835\n" +
    "vt 0.897852 0.398730\n" +
    "vt 0.908861 0.409503\n" +
    "vt 0.919253 0.420028\n" +
    "vt 0.928868 0.430183\n" +
    "vt 0.937545 0.439842\n" +
    "vt 0.945123 0.448883\n" +
    "vt 0.951444 0.457181\n" +
    "vt 0.956346 0.464613\n" +
    "vt 0.959669 0.471054\n" +
    "vt 0.961253 0.476381\n" +
    "vt 0.960938 0.480469\n" +
    "vt 0.958569 0.483467\n" +
    "vt 0.954215 0.485650\n" +
    "vt 0.948046 0.487080\n" +
    "vt 0.940231 0.487819\n" +
    "vt 0.930942 0.487930\n" +
    "vt 0.920348 0.487477\n" +
    "vt 0.908620 0.486522\n" +
    "vt 0.895928 0.485128\n" +
    "vt 0.882443 0.483358\n" +
    "vt 0.868335 0.481274\n" +
    "vt 0.853774 0.478940\n" +
    "vt 0.838931 0.476419\n" +
    "vt 0.823976 0.473772\n" +
    "vt 0.809080 0.471064\n" +
    "vt 0.794412 0.468356\n" +
    "vt 0.780144 0.465712\n" +
    "vt 0.766445 0.463195\n" +
    "vt 0.753486 0.460867\n" +
    "vt 0.741437 0.458792\n" +
    "vt 0.730469 0.457031\n" +
    "vt 0.719931 0.455264\n" +
    "vt 0.709081 0.453156\n" +
    "vt 0.697955 0.450755\n" +
    "vt 0.686588 0.448106\n" +
    "vt 0.675012 0.445258\n" +
    "vt 0.663264 0.442255\n" +
    "vt 0.651378 0.439145\n" +
    "vt 0.639388 0.435975\n" +
    "vt 0.627328 0.432791\n" +
    "vt 0.615234 0.429639\n" +
    "vt 0.603141 0.426566\n" +
    "vt 0.591081 0.423619\n" +
    "vt 0.579091 0.420844\n" +
    "vt 0.567205 0.418288\n" +
    "vt 0.555457 0.415997\n" +
    "vt 0.543881 0.414019\n" +
    "vt 0.532513 0.412399\n" +
    "vt 0.521387 0.411184\n" +
    "vt 0.510538 0.410421\n" +
    "vt 0.500000 0.410156\n" +
    "vt 0.489462 0.410421\n" +
    "vt 0.478613 0.411184\n" +
    "vt 0.467487 0.412399\n" +
    "vt 0.456119 0.414019\n" +
    "vt 0.444543 0.415997\n" +
    "vt 0.432795 0.418288\n" +
    "vt 0.420909 0.420844\n" +
    "vt 0.408919 0.423619\n" +
    "vt 0.396859 0.426566\n" +
    "vt 0.384766 0.429639\n" +
    "vt 0.372672 0.432791\n" +
    "vt 0.360612 0.435975\n" +
    "vt 0.348622 0.439145\n" +
    "vt 0.336736 0.442255\n" +
    "vt 0.324988 0.445258\n" +
    "vt 0.313412 0.448106\n" +
    "vt 0.302045 0.450755\n" +
    "vt 0.290919 0.453156\n" +
    "vt 0.280069 0.455264\n" +
    "vt 0.269531 0.457031\n" +
    "vt 0.258563 0.458792\n" +
    "vt 0.246514 0.460867\n" +
    "vt 0.233555 0.463195\n" +
    "vt 0.219856 0.465712\n" +
    "vt 0.205588 0.468356\n" +
    "vt 0.190920 0.471064\n" +
    "vt 0.176024 0.473772\n" +
    "vt 0.161069 0.476419\n" +
    "vt 0.146226 0.478940\n" +
    "vt 0.131665 0.481274\n" +
    "vt 0.117557 0.483358\n" +
    "vt 0.104072 0.485128\n" +
    "vt 0.091380 0.486522\n" +
    "vt 0.079652 0.487477\n" +
    "vt 0.069058 0.487930\n" +
    "vt 0.059769 0.487819\n" +
    "vt 0.051954 0.487080\n" +
    "vt 0.045785 0.485650\n" +
    "vt 0.041431 0.483468\n" +
    "vt 0.039063 0.535156\n" +
    "vt 0.038376 0.538856\n" +
    "vt 0.039222 0.543230\n" +
    "vt 0.041472 0.548205\n" +
    "vt 0.045000 0.553712\n" +
    "vt 0.049680 0.559680\n" +
    "vt 0.055384 0.566037\n" +
    "vt 0.061986 0.572714\n" +
    "vt 0.069359 0.579637\n" +
    "vt 0.077377 0.586738\n" +
    "vt 0.085913 0.593945\n" +
    "vt 0.094840 0.601187\n" +
    "vt 0.104031 0.608394\n" +
    "vt 0.113360 0.615493\n" +
    "vt 0.122700 0.622416\n" +
    "vt 0.131924 0.629089\n" +
    "vt 0.140906 0.635444\n" +
    "vt 0.149519 0.641408\n" +
    "vt 0.157636 0.646911\n" +
    "vt 0.165130 0.651882\n" +
    "vt 0.171875 0.656250\n" +
    "vt 0.178312 0.660236\n" +
    "vt 0.184954 0.664108\n" +
    "vt 0.191785 0.667867\n" +
    "vt 0.198787 0.671513\n" +
    "vt 0.205945 0.675046\n" +
    "vt 0.213240 0.678467\n" +
    "vt 0.220656 0.681777\n" +
    "vt 0.228175 0.684975\n" +
    "vt 0.235781 0.688063\n" +
    "vt 0.243457 0.691040\n" +
    "vt 0.251186 0.693907\n" +
    "vt 0.258950 0.696666\n" +
    "vt 0.266733 0.699315\n" +
    "vt 0.274518 0.701855\n" +
    "vt 0.282288 0.704288\n" +
    "vt 0.290025 0.706613\n" +
    "vt 0.297713 0.708830\n" +
    "vt 0.305335 0.710941\n" +
    "vt 0.312874 0.712945\n" +
    "vt 0.320313 0.714844\n" +
    "vt 0.327894 0.716679\n" +
    "vt 0.335848 0.718490\n" +
    "vt 0.344138 0.720268\n" +
    "vt 0.352725 0.722006\n" +
    "vt 0.361572 0.723697\n" +
    "vt 0.370642 0.725333\n" +
    "vt 0.379897 0.726906\n" +
    "vt 0.389300 0.728409\n" +
    "vt 0.398813 0.729835\n" +
    "vt 0.408398 0.731177\n" +
    "vt 0.418019 0.732426\n" +
    "vt 0.427637 0.733575\n" +
    "vt 0.437216 0.734617\n" +
    "vt 0.446717 0.735544\n" +
    "vt 0.456104 0.736349\n" +
    "vt 0.465337 0.737025\n" +
    "vt 0.474382 0.737563\n" +
    "vt 0.483198 0.737957\n" +
    "vt 0.491750 0.738199\n" +
    "vt 0.500000 0.738281\n" +
    "vt 0.508250 0.738199\n" +
    "vt 0.516802 0.737957\n" +
    "vt 0.525618 0.737563\n" +
    "vt 0.534663 0.737025\n" +
    "vt 0.543896 0.736349\n" +
    "vt 0.553283 0.735544\n" +
    "vt 0.562784 0.734617\n" +
    "vt 0.572362 0.733575\n" +
    "vt 0.581981 0.732426\n" +
    "vt 0.591602 0.731177\n" +
    "vt 0.601187 0.729835\n" +
    "vt 0.610700 0.728409\n" +
    "vt 0.620103 0.726906\n" +
    "vt 0.629358 0.725333\n" +
    "vt 0.638428 0.723697\n" +
    "vt 0.647275 0.722006\n" +
    "vt 0.655862 0.720268\n" +
    "vt 0.664152 0.718490\n" +
    "vt 0.672106 0.716679\n" +
    "vt 0.679688 0.714844\n" +
    "vt 0.687126 0.712945\n" +
    "vt 0.694665 0.710941\n" +
    "vt 0.702287 0.708830\n" +
    "vt 0.709975 0.706612\n" +
    "vt 0.717712 0.704288\n" +
    "vt 0.725482 0.701855\n" +
    "vt 0.733267 0.699315\n" +
    "vt 0.741050 0.696666\n" +
    "vt 0.748814 0.693908\n" +
    "vt 0.756543 0.691040\n" +
    "vt 0.764219 0.688063\n" +
    "vt 0.771825 0.684975\n" +
    "vt 0.779344 0.681777\n" +
    "vt 0.786760 0.678467\n" +
    "vt 0.794055 0.675046\n" +
    "vt 0.801213 0.671512\n" +
    "vt 0.808215 0.667867\n" +
    "vt 0.815046 0.664108\n" +
    "vt 0.821688 0.660236\n" +
    "vt 0.828125 0.656250\n" +
    "vt 0.834870 0.651882\n" +
    "vt 0.842364 0.646911\n" +
    "vt 0.850481 0.641408\n" +
    "vt 0.859094 0.635444\n" +
    "vt 0.868076 0.629089\n" +
    "vt 0.877300 0.622416\n" +
    "vt 0.886640 0.615493\n" +
    "vt 0.895969 0.608394\n" +
    "vt 0.905160 0.601187\n" +
    "vt 0.914087 0.593945\n" +
    "vt 0.922623 0.586738\n" +
    "vt 0.930641 0.579638\n" +
    "vt 0.938014 0.572714\n" +
    "vt 0.944616 0.566037\n" +
    "vt 0.950320 0.559680\n" +
    "vt 0.955000 0.553712\n" +
    "vt 0.958528 0.548205\n" +
    "vt 0.960778 0.543230\n" +
    "vt 0.961624 0.538856\n" +
    "vt 0.960938 0.535156\n" +
    "vt 0.958637 0.531952\n" +
    "vt 0.954806 0.529012\n" +
    "vt 0.949563 0.526323\n" +
    "vt 0.943031 0.523875\n" +
    "vt 0.935330 0.521655\n" +
    "vt 0.926581 0.519652\n" +
    "vt 0.916905 0.517855\n" +
    "vt 0.906422 0.516250\n" +
    "vt 0.895254 0.514827\n" +
    "vt 0.883520 0.513574\n" +
    "vt 0.871344 0.512479\n" +
    "vt 0.858844 0.511531\n" +
    "vt 0.846142 0.510718\n" +
    "vt 0.833358 0.510027\n" +
    "vt 0.820615 0.509448\n" +
    "vt 0.808031 0.508969\n" +
    "vt 0.795729 0.508577\n" +
    "vt 0.783829 0.508262\n" +
    "vt 0.772452 0.508011\n" +
    "vt 0.761719 0.507813\n" +
    "vt 0.751021 0.507795\n" +
    "vt 0.739709 0.508075\n" +
    "vt 0.727845 0.508618\n" +
    "vt 0.715488 0.509394\n" +
    "vt 0.702698 0.510370\n" +
    "vt 0.689536 0.511514\n" +
    "vt 0.676062 0.512796\n" +
    "vt 0.662337 0.514181\n" +
    "vt 0.648422 0.515640\n" +
    "vt 0.634375 0.517139\n" +
    "vt 0.620258 0.518647\n" +
    "vt 0.606131 0.520131\n" +
    "vt 0.592055 0.521561\n" +
    "vt 0.578089 0.522904\n" +
    "vt 0.564294 0.524127\n" +
    "vt 0.550731 0.525200\n" +
    "vt 0.537460 0.526090\n" +
    "vt 0.524541 0.526765\n" +
    "vt 0.512034 0.527194\n" +
    "vt 0.500000 0.527344\n" +
    "vt 0.487966 0.527194\n" +
    "vt 0.475459 0.526765\n" +
    "vt 0.462540 0.526090\n" +
    "vt 0.449269 0.525200\n" +
    "vt 0.435706 0.524127\n" +
    "vt 0.421911 0.522904\n" +
    "vt 0.407945 0.521561\n" +
    "vt 0.393869 0.520131\n" +
    "vt 0.379742 0.518647\n" +
    "vt 0.365625 0.517139\n" +
    "vt 0.351578 0.515640\n" +
    "vt 0.337662 0.514181\n" +
    "vt 0.323938 0.512796\n" +
    "vt 0.310464 0.511514\n" +
    "vt 0.297302 0.510370\n" +
    "vt 0.284512 0.509394\n" +
    "vt 0.272155 0.508618\n" +
    "vt 0.260291 0.508075\n" +
    "vt 0.248979 0.507795\n" +
    "vt 0.238281 0.507813\n" +
    "vt 0.227548 0.508011\n" +
    "vt 0.216171 0.508262\n" +
    "vt 0.204271 0.508577\n" +
    "vt 0.191969 0.508969\n" +
    "vt 0.179385 0.509448\n" +
    "vt 0.166642 0.510027\n" +
    "vt 0.153858 0.510718\n" +
    "vt 0.141156 0.511531\n" +
    "vt 0.128656 0.512479\n" +
    "vt 0.116479 0.513574\n" +
    "vt 0.104746 0.514827\n" +
    "vt 0.093578 0.516250\n" +
    "vt 0.083095 0.517855\n" +
    "vt 0.073419 0.519652\n" +
    "vt 0.064670 0.521655\n" +
    "vt 0.056969 0.523875\n" +
    "vt 0.050437 0.526323\n" +
    "vt 0.045194 0.529012\n" +
    "vt 0.041363 0.531952\n" +
    "f 1 200 2\n" +
    "f 200 199 2\n" +
    "f 2 199 3\n" +
    "f 199 198 3\n" +
    "f 3 198 4\n" +
    "f 198 197 4\n" +
    "f 4 197 5\n" +
    "f 197 196 5\n" +
    "f 5 196 6\n" +
    "f 196 195 6\n" +
    "f 6 195 7\n" +
    "f 195 194 7\n" +
    "f 7 194 8\n" +
    "f 194 193 8\n" +
    "f 8 193 9\n" +
    "f 193 192 9\n" +
    "f 9 192 10\n" +
    "f 192 191 10\n" +
    "f 10 191 11\n" +
    "f 191 190 11\n" +
    "f 11 190 12\n" +
    "f 190 189 12\n" +
    "f 12 189 13\n" +
    "f 189 188 13\n" +
    "f 13 188 14\n" +
    "f 188 187 14\n" +
    "f 14 187 15\n" +
    "f 187 186 15\n" +
    "f 15 186 16\n" +
    "f 186 185 16\n" +
    "f 16 185 17\n" +
    "f 185 184 17\n" +
    "f 17 184 18\n" +
    "f 184 183 18\n" +
    "f 18 183 19\n" +
    "f 183 182 19\n" +
    "f 19 182 20\n" +
    "f 182 181 20\n" +
    "f 20 181 21\n" +
    "f 181 180 21\n" +
    "f 21 180 22\n" +
    "f 180 179 22\n" +
    "f 22 179 23\n" +
    "f 179 178 23\n" +
    "f 23 178 24\n" +
    "f 178 177 24\n" +
    "f 24 177 25\n" +
    "f 177 176 25\n" +
    "f 25 176 26\n" +
    "f 176 175 26\n" +
    "f 26 175 27\n" +
    "f 175 174 27\n" +
    "f 27 174 28\n" +
    "f 174 173 28\n" +
    "f 28 173 29\n" +
    "f 173 172 29\n" +
    "f 29 172 30\n" +
    "f 172 171 30\n" +
    "f 30 171 31\n" +
    "f 171 170 31\n" +
    "f 31 170 32\n" +
    "f 170 169 32\n" +
    "f 32 169 33\n" +
    "f 169 168 33\n" +
    "f 33 168 34\n" +
    "f 168 167 34\n" +
    "f 34 167 35\n" +
    "f 167 166 35\n" +
    "f 35 166 36\n" +
    "f 166 165 36\n" +
    "f 36 165 37\n" +
    "f 165 164 37\n" +
    "f 37 164 38\n" +
    "f 164 163 38\n" +
    "f 38 163 39\n" +
    "f 163 162 39\n" +
    "f 39 162 40\n" +
    "f 162 161 40\n" +
    "f 40 161 41\n" +
    "f 41 161 42\n" +
    "f 42 161 43\n" +
    "f 43 161 44\n" +
    "f 44 161 45\n" +
    "f 45 161 46\n" +
    "f 46 161 47\n" +
    "f 47 161 48\n" +
    "f 48 161 49\n" +
    "f 49 161 50\n" +
    "f 50 161 51\n" +
    "f 51 161 52\n" +
    "f 52 161 53\n" +
    "f 53 161 54\n" +
    "f 54 161 55\n" +
    "f 55 161 56\n" +
    "f 56 161 57\n" +
    "f 57 161 58\n" +
    "f 58 161 59\n" +
    "f 59 161 60\n" +
    "f 60 161 61\n" +
    "f 61 161 62\n" +
    "f 62 161 63\n" +
    "f 63 161 64\n" +
    "f 64 161 65\n" +
    "f 65 161 66\n" +
    "f 66 161 67\n" +
    "f 67 161 68\n" +
    "f 68 161 69\n" +
    "f 69 161 70\n" +
    "f 70 161 71\n" +
    "f 71 161 72\n" +
    "f 72 161 73\n" +
    "f 73 161 74\n" +
    "f 74 161 75\n" +
    "f 75 161 76\n" +
    "f 76 161 77\n" +
    "f 77 161 78\n" +
    "f 78 161 79\n" +
    "f 79 161 80\n" +
    "f 80 161 81\n" +
    "f 81 161 160\n" +
    "f 81 160 82\n" +
    "f 160 159 82\n" +
    "f 82 159 83\n" +
    "f 159 158 83\n" +
    "f 83 158 84\n" +
    "f 158 157 84\n" +
    "f 84 157 85\n" +
    "f 157 156 85\n" +
    "f 85 156 86\n" +
    "f 156 155 86\n" +
    "f 86 155 87\n" +
    "f 155 154 87\n" +
    "f 87 154 88\n" +
    "f 154 153 88\n" +
    "f 88 153 89\n" +
    "f 153 152 89\n" +
    "f 89 152 90\n" +
    "f 152 151 90\n" +
    "f 90 151 91\n" +
    "f 151 150 91\n" +
    "f 91 150 92\n" +
    "f 150 149 92\n" +
    "f 92 149 93\n" +
    "f 149 148 93\n" +
    "f 93 148 94\n" +
    "f 148 147 94\n" +
    "f 94 147 95\n" +
    "f 147 146 95\n" +
    "f 95 146 96\n" +
    "f 146 145 96\n" +
    "f 96 145 97\n" +
    "f 145 144 97\n" +
    "f 97 144 98\n" +
    "f 144 143 98\n" +
    "f 98 143 99\n" +
    "f 143 142 99\n" +
    "f 99 142 100\n" +
    "f 142 141 100\n" +
    "f 100 141 101\n" +
    "f 141 140 101\n" +
    "f 101 140 102\n" +
    "f 140 139 102\n" +
    "f 102 139 103\n" +
    "f 139 138 103\n" +
    "f 103 138 104\n" +
    "f 138 137 104\n" +
    "f 104 137 105\n" +
    "f 137 136 105\n" +
    "f 105 136 106\n" +
    "f 136 135 106\n" +
    "f 106 135 107\n" +
    "f 135 134 107\n" +
    "f 107 134 108\n" +
    "f 134 133 108\n" +
    "f 108 133 109\n" +
    "f 133 132 109\n" +
    "f 109 132 110\n" +
    "f 132 131 110\n" +
    "f 110 131 111\n" +
    "f 131 130 111\n" +
    "f 111 130 112\n" +
    "f 130 129 112\n" +
    "f 112 129 113\n" +
    "f 129 128 113\n" +
    "f 113 128 114\n" +
    "f 128 127 114\n" +
    "f 114 127 115\n" +
    "f 127 126 115\n" +
    "f 115 126 116\n" +
    "f 126 125 116\n" +
    "f 116 125 117\n" +
    "f 125 124 117\n" +
    "f 117 124 118\n" +
    "f 124 123 118\n" +
    "f 118 123 119\n" +
    "f 123 122 119\n" +
    "f 119 122 120\n" +
    "f 122 121 120\n" +
    "f 201 202 400\n" +
    "f 400 202 399\n" +
    "f 202 203 399\n" +
    "f 399 203 398\n" +
    "f 203 204 398\n" +
    "f 398 204 397\n" +
    "f 204 205 397\n" +
    "f 397 205 396\n" +
    "f 205 206 396\n" +
    "f 396 206 395\n" +
    "f 206 207 395\n" +
    "f 395 207 394\n" +
    "f 207 208 394\n" +
    "f 394 208 393\n" +
    "f 208 209 393\n" +
    "f 393 209 392\n" +
    "f 209 210 392\n" +
    "f 392 210 391\n" +
    "f 210 211 391\n" +
    "f 391 211 390\n" +
    "f 211 212 390\n" +
    "f 390 212 389\n" +
    "f 212 213 389\n" +
    "f 389 213 388\n" +
    "f 213 214 388\n" +
    "f 388 214 387\n" +
    "f 214 215 387\n" +
    "f 387 215 386\n" +
    "f 215 216 386\n" +
    "f 386 216 385\n" +
    "f 216 217 385\n" +
    "f 385 217 384\n" +
    "f 217 218 384\n" +
    "f 384 218 383\n" +
    "f 218 219 383\n" +
    "f 383 219 382\n" +
    "f 219 220 382\n" +
    "f 382 220 381\n" +
    "f 220 221 381\n" +
    "f 381 221 380\n" +
    "f 221 222 380\n" +
    "f 380 222 379\n" +
    "f 222 223 379\n" +
    "f 379 223 378\n" +
    "f 223 224 378\n" +
    "f 378 224 377\n" +
    "f 224 225 377\n" +
    "f 377 225 376\n" +
    "f 225 226 376\n" +
    "f 376 226 375\n" +
    "f 226 227 375\n" +
    "f 375 227 374\n" +
    "f 227 228 374\n" +
    "f 374 228 373\n" +
    "f 228 229 373\n" +
    "f 373 229 372\n" +
    "f 229 230 372\n" +
    "f 372 230 371\n" +
    "f 230 231 371\n" +
    "f 371 231 370\n" +
    "f 231 232 370\n" +
    "f 370 232 369\n" +
    "f 232 233 369\n" +
    "f 369 233 368\n" +
    "f 233 234 368\n" +
    "f 368 234 367\n" +
    "f 234 235 367\n" +
    "f 367 235 366\n" +
    "f 235 236 366\n" +
    "f 366 236 365\n" +
    "f 236 237 365\n" +
    "f 365 237 364\n" +
    "f 237 238 364\n" +
    "f 364 238 363\n" +
    "f 238 239 363\n" +
    "f 363 239 362\n" +
    "f 239 240 362\n" +
    "f 362 240 361\n" +
    "f 240 241 361\n" +
    "f 241 242 361\n" +
    "f 242 243 361\n" +
    "f 243 244 361\n" +
    "f 244 245 361\n" +
    "f 245 246 361\n" +
    "f 246 247 361\n" +
    "f 247 248 361\n" +
    "f 248 249 361\n" +
    "f 249 250 361\n" +
    "f 250 251 361\n" +
    "f 251 252 361\n" +
    "f 252 253 361\n" +
    "f 253 254 361\n" +
    "f 254 255 361\n" +
    "f 255 256 361\n" +
    "f 256 257 361\n" +
    "f 257 258 361\n" +
    "f 258 259 361\n" +
    "f 259 260 361\n" +
    "f 260 261 361\n" +
    "f 261 262 361\n" +
    "f 262 263 361\n" +
    "f 263 264 361\n" +
    "f 264 265 361\n" +
    "f 265 266 361\n" +
    "f 266 267 361\n" +
    "f 267 268 361\n" +
    "f 268 269 361\n" +
    "f 269 270 361\n" +
    "f 270 271 361\n" +
    "f 271 272 361\n" +
    "f 272 273 361\n" +
    "f 273 274 361\n" +
    "f 274 275 361\n" +
    "f 275 276 361\n" +
    "f 276 277 361\n" +
    "f 277 278 361\n" +
    "f 278 279 361\n" +
    "f 279 280 361\n" +
    "f 280 281 361\n" +
    "f 281 360 361\n" +
    "f 281 282 360\n" +
    "f 360 282 359\n" +
    "f 282 283 359\n" +
    "f 359 283 358\n" +
    "f 283 284 358\n" +
    "f 358 284 357\n" +
    "f 284 285 357\n" +
    "f 357 285 356\n" +
    "f 285 286 356\n" +
    "f 356 286 355\n" +
    "f 286 287 355\n" +
    "f 355 287 354\n" +
    "f 287 288 354\n" +
    "f 354 288 353\n" +
    "f 288 289 353\n" +
    "f 353 289 352\n" +
    "f 289 290 352\n" +
    "f 352 290 351\n" +
    "f 290 291 351\n" +
    "f 351 291 350\n" +
    "f 291 292 350\n" +
    "f 350 292 349\n" +
    "f 292 293 349\n" +
    "f 349 293 348\n" +
    "f 293 294 348\n" +
    "f 348 294 347\n" +
    "f 294 295 347\n" +
    "f 347 295 346\n" +
    "f 295 296 346\n" +
    "f 346 296 345\n" +
    "f 296 297 345\n" +
    "f 345 297 344\n" +
    "f 297 298 344\n" +
    "f 344 298 343\n" +
    "f 298 299 343\n" +
    "f 343 299 342\n" +
    "f 299 300 342\n" +
    "f 342 300 341\n" +
    "f 300 301 341\n" +
    "f 341 301 340\n" +
    "f 301 302 340\n" +
    "f 340 302 339\n" +
    "f 302 303 339\n" +
    "f 339 303 338\n" +
    "f 303 304 338\n" +
    "f 338 304 337\n" +
    "f 304 305 337\n" +
    "f 337 305 336\n" +
    "f 305 306 336\n" +
    "f 336 306 335\n" +
    "f 306 307 335\n" +
    "f 335 307 334\n" +
    "f 307 308 334\n" +
    "f 334 308 333\n" +
    "f 308 309 333\n" +
    "f 333 309 332\n" +
    "f 309 310 332\n" +
    "f 332 310 331\n" +
    "f 310 311 331\n" +
    "f 331 311 330\n" +
    "f 311 312 330\n" +
    "f 330 312 329\n" +
    "f 312 313 329\n" +
    "f 329 313 328\n" +
    "f 313 314 328\n" +
    "f 328 314 327\n" +
    "f 314 315 327\n" +
    "f 327 315 326\n" +
    "f 315 316 326\n" +
    "f 326 316 325\n" +
    "f 316 317 325\n" +
    "f 325 317 324\n" +
    "f 317 318 324\n" +
    "f 324 318 323\n" +
    "f 318 319 323\n" +
    "f 323 319 322\n" +
    "f 319 320 322\n" +
    "f 322 320 321";