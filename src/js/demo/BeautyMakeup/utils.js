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

export const imgPointToScreenPoint = (x, y, offsetX, offsetY, scale) => {
    var pos = new THREE.Vector2();
    pos.setX(x * scale + offsetX);
    pos.setY(y * scale + offsetY);
    return pos;
}

export const getDistance2d = (p1, p2) => {
    return Math.pow(Math.sqrt(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 1 / 2);
}

export const getDistance3d = (p1, p2) => {
    return Math.pow(Math.sqrt(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

export const createCurve2d = (originPoint, curvePoint, p2pNum, scale) => {
    var originCount = originPoint.length;
    var midpoints = [originCount];
    for (let i = 0; i < originCount; i++) {
        let nexti = (i + 1) % originCount;
        let x = (originPoint[i].x + originPoint[nexti].x) / 2.0;
        let y = (originPoint[i].y + originPoint[nexti].y) / 2.0;
        midpoints[i] = new THREE.Vector2(x, y);
    }
    var extrapoints = [2 * originCount];
    for (let i = 0; i < originCount; i++) {
        let nexti = (i + 1) % originCount;
        let backi = (i + originCount - 1) % originCount;
        let midinmid = new THREE.Vector2(0, 0);
        midinmid.x = (midpoints[i].x + midpoints[backi].x) / 2.0;
        midinmid.y = (midpoints[i].y + midpoints[backi].y) / 2.0;
        let offsetx = originPoint[i].x - midinmid.x;
        let offsety = originPoint[i].y - midinmid.y;
        let extraindex = 2 * i;
        extrapoints[extraindex] = new THREE.Vector2(0, 0);
        extrapoints[extraindex].x = midpoints[backi].x + offsetx;
        extrapoints[extraindex].y = midpoints[backi].y + offsety;
        let addx = (extrapoints[extraindex].x - originPoint[i].x) * scale;
        let addy = (extrapoints[extraindex].y - originPoint[i].y) * scale;
        extrapoints[extraindex].x = originPoint[i].x + addx;
        extrapoints[extraindex].y = originPoint[i].y + addy;
        let extranexti = (extraindex + 1) % (2 * originCount);
        extrapoints[extranexti] = new THREE.Vector2(0, 0);
        extrapoints[extranexti].x = midpoints[i].x + offsetx;
        extrapoints[extranexti].y = midpoints[i].y + offsety;
        addx = (extrapoints[extranexti].x - originPoint[i].x) * scale;
        addy = (extrapoints[extranexti].y - originPoint[i].y) * scale;
        extrapoints[extranexti].x = originPoint[i].x + addx;
        extrapoints[extranexti].y = originPoint[i].y + addy;
    }
    var controlPoint = [4];
    for (let i = 0; i < originCount; i++) {
        controlPoint[0] = originPoint[i];
        let extraindex = 2 * i;
        controlPoint[1] = extrapoints[extraindex + 1];
        let extranexti = (extraindex + 2) % (2 * originCount);
        controlPoint[2] = extrapoints[extranexti];
        let nexti = (i + 1) % originCount;
        controlPoint[3] = originPoint[nexti];
        let u = 1;
        let density = 1 / p2pNum;
        for (let j = 0; j < p2pNum; j++) {
            let index = u - j * density;
            let px = bezier3funcX(index, controlPoint);
            let py = bezier3funcY(index, controlPoint);
            //存入曲线点
            curvePoint.push(new THREE.Vector3(px, py, originPoint[i].z));
        }
    }
}

const bezier3funcX = (uu, controlP) => {
    let part0 = controlP[0].x * uu * uu * uu;
    let part1 = 3 * controlP[1].x * uu * uu * (1 - uu);
    let part2 = 3 * controlP[2].x * uu * (1 - uu) * (1 - uu);
    let part3 = controlP[3].x * (1 - uu) * (1 - uu) * (1 - uu);
    return part0 + part1 + part2 + part3;
}

const bezier3funcY = (uu, controlP) => {
    let part0 = controlP[0].y * uu * uu * uu;
    let part1 = 3 * controlP[1].y * uu * uu * (1 - uu);
    let part2 = 3 * controlP[2].y * uu * (1 - uu) * (1 - uu);
    let part3 = controlP[3].y * (1 - uu) * (1 - uu) * (1 - uu);
    return part0 + part1 + part2 + part3;
}