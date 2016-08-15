var mixIn = require('mout/object/mixIn');

function Method(cfg) {

    THREE.Object3D.call( this );

    mixIn(this, {
        width: 0,
        height: 0
    }, cfg);
}

module.exports = Method;

var _super = THREE.Object3D.prototype;
var _p = Method.prototype = Object.create(_super);
_p.constructor = Method;

_p.render = render;
_p._updateCameraNearFar = _updateCameraNearFar;

function render(renderer, scene, camera, renderTarget, forceClear) {}

function _updateCameraNearFar(camera, refCamera) {
    if((camera.near !== refCamera.near) || (camera.far !== refCamera.far)) {
        camera.near = refCamera.near;
        camera.far = refCamera.far;
        camera.updateProjectionMatrix();
    }
}
