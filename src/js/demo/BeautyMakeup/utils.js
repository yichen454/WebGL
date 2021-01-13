import * as THREE from 'three'


export const getRect = (camera) => {
    let rect = {};
    let p = screenPointToThreeCoords(1, 1, camera, 0)

    rect.x = 2 * p.x;
    rect.y = 2 * p.y;
    return rect
}

export const screenPointToThreeCoords = (x, y, camera, targetZ) => {
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse
    vec.set(x, y, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    var distance = (targetZ - camera.position.z) / vec.z;
    pos.copy(camera.position).add(vec.multiplyScalar(distance));
    return pos;
}