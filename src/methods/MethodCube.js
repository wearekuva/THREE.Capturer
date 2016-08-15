var Method = require('./Method');
var fboHelper = require('../helpers/fboHelper');
var mixIn = require('mout/object/mixIn');
var glslify = require('glslify');

var CUBE_CAMERA_SETTINGS = {
    PX: {index: 0, up: [ 0, - 1, 0 ], target: [1, 0, 0 ]},
    NX: {index: 1, up: [ 0, - 1, 0 ], target: [- 1, 0, 0 ]},
    PY: {index: 2, up: [ 0, 0, 1 ], target: [0, 1, 0 ]},
    NY: {index: 3, up: [ 0, 0, - 1 ], target: [0, - 1, 0 ]},
    PZ: {index: 4, up: [ 0, - 1, 0 ], target: [0, 0, 1 ]},
    NZ: {index: 5, up: [ 0, - 1, 0 ], target: [0, 0, -1 ]}
};

function MethodCube(cfg) {
    _super.constructor.call(this, mixIn({
        method: 'Cube',
        width: 4096,
        height: 2048,
        cubeSize: 2048,
        cubeSideCameras: {}
    }, cfg));

    this.cubeRenderTarget = new THREE.WebGLRenderTargetCube(this.cubeSize, this.cubeSize, {
        format: THREE.RGBFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter
    });

    var cubeSideCameraSetting, cubeSideCamera;
    for(var cubeSideCameraId in CUBE_CAMERA_SETTINGS) {
        cubeSideCameraSetting = CUBE_CAMERA_SETTINGS[cubeSideCameraId];
        cubeSideCamera = this.cubeSideCameras[cubeSideCameraId] = new THREE.PerspectiveCamera( 90, 1 );
        cubeSideCamera.cubeIndex = cubeSideCameraSetting.index;
        cubeSideCamera.up.fromArray(cubeSideCameraSetting.up);
        cubeSideCamera.lookAt((new THREE.Vector3()).fromArray(cubeSideCameraSetting.target));
        cubeSideCamera.updateMatrix();
        this.add(cubeSideCamera);
    }

    this.cubeToEqurectangularMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: this.cubeRenderTarget }
        },
        vertexShader: fboHelper.rawShaderPrefix + fboHelper.vertexShader,
        fragmentShader: fboHelper.rawShaderPrefix + glslify('./cubeToEquirectangular.frag'),
    });

    this.rotation.y = Math.PI / 2;
}

module.exports = MethodCube;
var _super = Method.prototype;
var _p = MethodCube.prototype = Object.create(_super);
_p.constructor = MethodCube;

_p.render = render;

function render( renderer, scene, camera, renderTarget, forceClear ) {

    renderer.clearTarget(this.cubeRenderTarget, true, true, true);

    var autoUpdate = scene.autoUpdate;
    var cubeSideCamera;
    this.updateMatrixWorld(true);
    for(var cameraId in CUBE_CAMERA_SETTINGS) {
        cubeSideCamera = this.cubeSideCameras[cameraId];
        this._updateCameraNearFar(cubeSideCamera, camera);
        this.cubeRenderTarget.activeCubeFace  = cubeSideCamera.cubeIndex;
        renderer.render(scene, cubeSideCamera, this.cubeRenderTarget);
        scene.autoUpdate = false;
    }
    scene.autoUpdate = autoUpdate;

    if(renderTarget) {
        renderTarget.setSize(this.width, this.height);
    } else {
        renderer.setSize(this.width, this.height);
    }
    fboHelper.render(this.cubeToEqurectangularMaterial, renderTarget, forceClear);

}
