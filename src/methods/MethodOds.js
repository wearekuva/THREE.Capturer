var Method = require('./Method');
var fboHelper = require('../helpers/fboHelper');

var mixIn = require('mout/object/mixIn');
var glslify = require('glslify');

function MethodOds(cfg) {

    _super.constructor.call(this, mixIn({
        method: 'ODS',
        size: 4096,
        ipd: 0.064
    }, cfg));
    this.width = this.size;
    this.height = this.size;
    this.viewWidth = this.width;
    this.viewHeight = this.height >> 1;
    this.pixelWidthRenderTarget = fboHelper.createRenderTarget(1, 1);
    this.pixelWidthRenderTarget.depthBuffer = true;
    this.pixelWidthRenderTarget.stencilBuffer = true;
    this.eyeRenderTarget = fboHelper.createRenderTarget(this.viewWidth, this.viewHeight);
    this.outRenderTarget = fboHelper.createRenderTarget(this.width, this.height);

    // vertical fov 90deg, hoziontal fov = 360 / width, FOV_h = 2*atan((x/y)tan(FOV_v/2))
    this.pixelWidthCamera = new THREE.PerspectiveCamera(90, Math.atan(Math.PI / this.width));
    this.add(this.pixelWidthCamera);
    this.lookAtTarget = new THREE.Vector3();

    this.perspectiveToEquirectMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: this.eyeRenderTarget }
        },
        depthTest: false,
        depthWrite: false,
        vertexShader: fboHelper.vertexShader,
        fragmentShader: fboHelper.rawShaderPrefix + glslify('./perspectiveToEquirect.frag')
    });

}

module.exports = MethodOds;
var _super = Method.prototype;
var _p = MethodOds.prototype = Object.create(_super);
_p.constructor = MethodOds;

_p.render = render;
_p.renderEye = renderEye;

function render( renderer, scene, camera, renderTarget, forceClear ) {
    var autoUpdate = scene.autoUpdate;
    this.renderEye(-1, renderer, scene, camera);
    this.renderEye(1, renderer, scene, camera);
    scene.autoUpdate = autoUpdate;

    if(renderTarget) {
        renderTarget.setSize(this.width, this.height);
    } else {
        renderer.setSize(this.width, this.height);
    }
    fboHelper.copy(this.outRenderTarget, renderTarget, forceClear);
}

function renderEye(side, renderer, scene, camera) {

    var viewWidth = this.viewWidth;
    var viewHeight = this.viewHeight;
    var viewHalfHeight = viewHeight / 2;

    var pixelWidthCamera = this.pixelWidthCamera;
    var lookAtTarget = this.lookAtTarget;
    var eyeRenderTarget = this.eyeRenderTarget;
    var pixelWidthRenderTarget = this.pixelWidthRenderTarget;
    var origin = pixelWidthCamera.position;

    var eyeOffset = this.ipd / 2 * side;

    var x, theta, phi, sinTheta, cosTheta, sinPhi, cosPhi;

    eyeRenderTarget.scissorTest = true;
    renderer.clearTarget(eyeRenderTarget, true, true, true);

    this.updateMatrixWorld(true);
    this._updateCameraNearFar(pixelWidthCamera, camera);
    pixelWidthRenderTarget.setSize(1, viewHalfHeight);

    for(var i = 0; i < viewWidth; i++) {

        x = (i + 0.5) / viewWidth; // add 0.5 to sample the center of the pixel

        theta = (x * 2 - 1) * Math.PI;
        sinTheta = Math.sin(theta);
        cosTheta = Math.cos(theta);

        // top 90 deg
        phi = Math.PI / 2 - 0.25 * Math.PI;
        sinPhi = Math.sin(phi);
        cosPhi = Math.cos(phi);

        origin.set(cosTheta * eyeOffset, 0 , sinTheta * eyeOffset);
        lookAtTarget.set(sinTheta * cosPhi, sinPhi, -cosTheta * cosPhi).add(origin);
        pixelWidthCamera.lookAt(lookAtTarget);
        pixelWidthCamera.updateMatrixWorld(true);

        renderer.render(scene, pixelWidthCamera, pixelWidthRenderTarget);
        eyeRenderTarget.viewport.set(i, viewHalfHeight, 1, viewHalfHeight);
        eyeRenderTarget.scissor.set(i, viewHalfHeight, 1, viewHalfHeight);
        fboHelper.copy(pixelWidthRenderTarget, eyeRenderTarget);

        scene.autoUpdate = false;

        // bottom 90 deg
        phi = Math.PI / 2 - 0.75 * Math.PI;
        sinPhi = Math.sin(phi);
        cosPhi = Math.cos(phi);

        lookAtTarget.set(sinTheta * cosPhi, sinPhi, -cosTheta * cosPhi).add(origin);
        pixelWidthCamera.lookAt(lookAtTarget);
        pixelWidthCamera.updateMatrixWorld(true);

        // postprocessing.render(deltaTime, true);
        renderer.render(scene, pixelWidthCamera, pixelWidthRenderTarget);
        eyeRenderTarget.viewport.set(i, 0, 1, viewHalfHeight);
        eyeRenderTarget.scissor.set(i, 0, 1, viewHalfHeight);
        fboHelper.copy(pixelWidthRenderTarget, eyeRenderTarget);

    }

    this.outRenderTarget.scissorTest = true;
    this.outRenderTarget.viewport.set(0, side < 0 ? this.viewHeight : 0, this.width, this.viewHeight);
    this.outRenderTarget.scissor.set(0, side < 0 ? this.viewHeight : 0, this.width, this.viewHeight);
    fboHelper.render(this.perspectiveToEquirectMaterial, this.outRenderTarget);
    this.outRenderTarget.scissorTest = false;


}
