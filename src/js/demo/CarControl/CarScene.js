import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import BaseScene from '../../graphics/BaseScene'
import EventBus from '../../eventBus'

var root;
var body;
var lightHolder;

var steeringWheelSpeed = 1.5;
var maxSteeringRotation = Math.PI / 8;

var acceleration = 0;
var maxSpeedReverse, accelerationReverse, deceleration;

var frontLeftWheelRoot;
var frontRightWheelRoot;

var frontLeftWheel;
var frontRightWheel;
var backLeftWheel;
var backRightWheel;

var steeringWheel;
var steeringWheelOri;

var wheelOrientation = 0;
var carOrientation = 0;

var wheelDiameter = 1;
var length = 1;

export default class CarScene extends BaseScene{

    loaded = false;
    touchControls = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        brake: false
    }
    speed = 0
    maxSpeed = 180
    acceleration = 10
    turningRadius = 5
    brakePower = 10
    wheelRotationAxis = 'x'
    wheelTurnAxis = 'y'
    steeringWheelTurnAxis = 'z'
    bodyTurnAxis = 'z'
    bodyRunAxis = 'x'


    constructor(porps) {
        super(porps)
        document.title = 'webgl车辆简单渲染及控制系统';
        if (window['_czc']) {
            _czc.push(["_trackEvent", 'webgl', '进入', 'CarScene'])
        }
       
        maxSpeedReverse = -this.maxSpeed * 0.25;
        accelerationReverse = this.acceleration * 0.5;
        deceleration = this.acceleration * 2;

        EventBus.addListener(EventBus.Event.joystick_event, this.controlEvent);
    }

    controlEvent = (touchControls) => {
        this.touchControls = touchControls;
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
        this.camera.position.set(6, 4, 9);
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
        this.scene.fog = new THREE.Fog(0xd7cbb1, 1, 80);
        let cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader.setPath('./textures/cubemap/bluesky/');

        let cubeTexture = cubeTextureLoader.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
        this.scene.background = cubeTexture;
        this.scene.environment = cubeTexture;
    }

    _InitLight() {
        var hemiLight = new THREE.HemisphereLight(0x7c849b, 0xd7cbb1, 0.94);
        hemiLight.position.set(-1, 1, -1);
        this.scene.add(hemiLight);
    }

    _InitHelper() {
        var grid = new THREE.GridHelper(2400, 2400, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.depthWrite = false;
        grid.material.transparent = true;
        this.scene.add(grid);
    }

    _InitGameObject() {
        let scope = this;

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2400, 2400),
            new THREE.ShadowMaterial({
                color: 0x000000,
                opacity: 0.15,
                depthWrite: false
            }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.renderOrder = 1;
        this.scene.add(ground);

        var loader = new GLTFLoader();
        loader.load('https://qn.easonyi.com/lamborghini.glb', function (gltf) {
            //loader.load('./model/lamborghini.glb', function (gltf) {
            var model = gltf.scene;
            model.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scope._SetupShadows(model);
            root = new THREE.Group();
            body = changePivot(0, 0.352693, 0, model);
            root.add(body);
            scope._SetupWheels(root);
            scope.scene.add(root);
            scope.controls.target = root.position;
            scope.loaded = true;
            //scope.scene.add(new THREE.CameraHelper(shadowLight.shadow.camera));
        });

    }

    _SetupShadows(model) {
        lightHolder = new THREE.Group();
        var shadowLight = new THREE.DirectionalLight(0xffffee, 0.1);
        shadowLight.position.set(-1.5, 2, -1.5);
        shadowLight.castShadow = true;
        shadowLight.shadow.width = 256;
        shadowLight.shadow.height = 256;
        shadowLight.shadow.camera.top = 3;
        shadowLight.shadow.camera.bottom = -2;
        shadowLight.shadow.camera.left = -4;
        shadowLight.shadow.camera.right = 3;
        shadowLight.shadow.camera.far = 6;
        shadowLight.shadow.bias = -0.025;
        lightHolder.add(shadowLight, shadowLight.target);
        model.add(lightHolder);
    }

    _SetupWheels(root) {
        //拆分车轮 
        let flWheel = root.getObjectByName('Wheel_L');
        frontLeftWheel = changePivot(0.965727, 0.352693, 1.06293, flWheel);
        frontLeftWheelRoot = changePivot(0, 0, 0, frontLeftWheel);
        frontLeftWheelRoot.position.set(0.965727, 0.352693, 1.06293);

        let frwheel = root.getObjectByName('Wheel_R');
        frontRightWheel = changePivot(-0.908736, 0.352693, 1.06293, frwheel);
        frontRightWheelRoot = changePivot(0, 0, 0, frontRightWheel);
        frontRightWheelRoot.position.set(-0.908736, 0.352693, 1.06293);

        let blwheel = root.getObjectByName('Wheel_Back_L');
        backLeftWheel = changePivot(0.965727, 0.352693, -1.67831, blwheel);

        let brwheel = root.getObjectByName('Wheel_Back_R');
        backRightWheel = changePivot(-0.965727, 0.352693, -1.67831, brwheel);

        let swheel = root.getObjectByName('Steering_wheel');
        steeringWheelOri = changePivot(0.330569, 0.685193, 0.320228, swheel);
        steeringWheelOri.rotation.x = -Math.PI / 8;
        steeringWheel = changePivot(0, 0, 0, steeringWheelOri);
        steeringWheel.position.set(0.330569, 0.685193, 0.320228);
        steeringWheel.rotation.x = Math.PI / 8;

        root.add(frontLeftWheelRoot);
        root.add(frontRightWheelRoot);
        root.add(backLeftWheel);
        root.add(backRightWheel);
        root.add(steeringWheel);
    }

    dispose() {
        super.dispose();
        EventBus.removeListener(EventBus.Event.joystick_event, this.controlEvent);
        this.controls.dispose();
    }

    update(delta) {
        this.carMove(delta)
        this.renderer.render(this.scene, this.camera);
    }

    carMove(delta) {
        if (!this.loaded) {
            return;
        }

        var brakingDeceleration = 1;
        if (this.touchControls.brake) brakingDeceleration = this.brakePower;
        if (this.touchControls.moveForward) {
            this.speed = THREE.Math.clamp(this.speed - delta * this.acceleration, maxSpeedReverse, this.maxSpeed);
            acceleration = THREE.Math.clamp(acceleration - delta, -1, 1);
        }
        if (this.touchControls.moveBackward) {
            this.speed = THREE.Math.clamp(this.speed + delta * accelerationReverse, maxSpeedReverse, this.maxSpeed);
            acceleration = THREE.Math.clamp(acceleration + delta, -1, 1);
        }
        if (this.touchControls.moveLeft) {
            wheelOrientation = THREE.Math.clamp(wheelOrientation + delta * steeringWheelSpeed, -maxSteeringRotation, maxSteeringRotation);
        }
        if (this.touchControls.moveRight) {
            wheelOrientation = THREE.Math.clamp(wheelOrientation - delta * steeringWheelSpeed, -maxSteeringRotation, maxSteeringRotation);
        }
        // this.speed decay
        if (!(this.touchControls.moveForward || this.touchControls.moveBackward)) {
            if (this.speed > 0) {
                var k = exponentialEaseOut(this.speed / this.maxSpeed);
                this.speed = THREE.Math.clamp(this.speed - k * delta * deceleration * brakingDeceleration, 0, this.maxSpeed);
                acceleration = THREE.Math.clamp(acceleration - k * delta, 0, 1);
            } else {
                var k = exponentialEaseOut(this.speed / maxSpeedReverse);
                this.speed = THREE.Math.clamp(this.speed + k * delta * accelerationReverse * brakingDeceleration, maxSpeedReverse, 0);
                acceleration = THREE.Math.clamp(acceleration + k * delta, -1, 0);
            }
        }
        if (Math.abs(this.speed) < 0.00000001) {
            this.speed = 0;
        }
        // steering decay
        if (!(this.touchControls.moveLeft || this.touchControls.moveRight)) {
            if (wheelOrientation > 0) {
                wheelOrientation = THREE.Math.clamp(wheelOrientation - delta * steeringWheelSpeed, 0, maxSteeringRotation);
            } else {
                wheelOrientation = THREE.Math.clamp(wheelOrientation + delta * steeringWheelSpeed, -maxSteeringRotation, 0);
            }
        }
        var forwardDelta = -this.speed * delta;
        carOrientation += (forwardDelta * this.turningRadius * 0.02) * wheelOrientation;
        // movement of car
        let diffx = Math.sin(carOrientation) * forwardDelta * length;
        let diffz = Math.cos(carOrientation) * forwardDelta * length;
        root.position.x += diffx;
        root.position.z += diffz;
        //相机跟随
        this.camera.position.x += diffx;
        this.camera.position.z += diffz;
        // angle of car
        root.rotation.y = carOrientation;
        // wheels rolling
        var angularSpeedRatio = -2 / wheelDiameter;
        var wheelDelta = forwardDelta * angularSpeedRatio * length;
        frontLeftWheel.rotation[this.wheelRotationAxis] -= wheelDelta;
        frontRightWheel.rotation[this.wheelRotationAxis] -= wheelDelta;
        backLeftWheel.rotation[this.wheelRotationAxis] -= wheelDelta;
        backRightWheel.rotation[this.wheelRotationAxis] -= wheelDelta;
        // rotation while steering
        frontLeftWheelRoot.rotation[this.wheelTurnAxis] = wheelOrientation;
        frontRightWheelRoot.rotation[this.wheelTurnAxis] = wheelOrientation;
        body.rotation[this.bodyRunAxis] = Math.PI / 100 * this.speed / 90;
        body.rotation[this.bodyTurnAxis] = wheelOrientation / 40;
        if (steeringWheel)
            steeringWheel.rotation[this.steeringWheelTurnAxis] = -wheelOrientation * 6;

        lightHolder.rotation.y = -root.rotation.y;
    }
}

function exponentialEaseOut(k) {
    return k === 1 ? 1 : -Math.pow(2, -10 * k) + 1;
}

function changePivot(x, y, z, obj) {
    //新增父物体使本体中心偏移
    let wrapper = new THREE.Object3D();
    wrapper.position.set(x, y, z);
    wrapper.name = obj.name;
    wrapper.add(obj);
    obj.position.set(-x, -y, -z);
    return wrapper;
}