export default class BaseScene {

    renderer;
    renderSize = { w: 0, h: 0 };
    isHidden = false;
    camera;
    scene;

    constructor(props) {
        if (new.target === BaseScene) {
            throw new Error('BaseScene class can`t instantiate');
        }
        this.renderer = props.renderer;
        this.renderSize = props.renderSize;

        this.init();
    }

    init() {
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
    }

    show() {
        this.isHidden = false;
    }

    _SetCamera() { }
    _InitPass() { }
    _InitPhysics() { }
    _InitBackGround() { }
    _InitLight() { }
    _InitGameObject() { }
    _InitHelper() { }


    dispose() {
        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.isMesh) {
                    child.geometry && child.geometry.dispose();
                    child.material && child.material.dispose();
                }
            })
            this.scene.clear();
        }
    }

    resize(width, height) {
        this.renderSize = { w: width, h: height };
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    update(delta) { }
}