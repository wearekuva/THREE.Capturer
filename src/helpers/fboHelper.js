var glslify = require('glslify');

var undef;

var _mesh;
var _scene;
var _camera;

var _hasInitialized = false;

var rawShaderPrefix = exports.rawShaderPrefix = undef;
var vertexShader = exports.vertexShader = undef;
var copyMaterial = exports.copyMaterial = undef;

var renderer = exports.renderer = undef;

exports.init = init;
exports.copy = copy;
exports.render = render;
exports.resizeRenderTarget = resizeRenderTarget;
exports.createRenderTarget = createRenderTarget;
exports.getColorState = getColorState;
exports.setColorState = setColorState;

function init(rendererRef) {

    if(_hasInitialized) return;

    renderer = exports.renderer = rendererRef;

    rawShaderPrefix = exports.rawShaderPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n';

    _scene = new THREE.Scene();
    _camera = new THREE.Camera();
    _camera.position.z = 1;

    copyMaterial = exports.copyMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: undef }
        },
        vertexShader: vertexShader = exports.vertexShader = rawShaderPrefix + glslify('./quad.vert'),
        fragmentShader: rawShaderPrefix + glslify('./quad.frag')
    });

    _mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), copyMaterial );
    _scene.add( _mesh );

    _hasInitialized = true;

}

function copy(inputTexture, renderTarget, forceClear) {
    _mesh.material = copyMaterial;
    copyMaterial.uniforms.u_texture.value = inputTexture;
    renderer.render( _scene, _camera, renderTarget, forceClear );
}

function render(material, renderTarget, forceClear) {
    _mesh.material = material;
    renderer.render( _scene, _camera, renderTarget, forceClear );
}

function resizeRenderTarget(renderTarget, width, height) {
    width = (width | 0) || 1;
    height = (height | 0) || 1;
    if((width !== renderTarget.width) || (height !== renderTarget.height))  {
        renderTarget.setSize(width, height);
    }
}

function createRenderTarget(width, height, format, type, minFilter, magFilter) {

    var renderTarget = new THREE.WebGLRenderTarget(width || 1, height || 1, {
        format: format || THREE.RGBFormat,
        type: type || THREE.UnsignedByteType,
        minFilter: minFilter || THREE.LinearFilter,
        magFilter: magFilter || THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false

    });

    renderTarget.texture.generateMipMaps = false;

    return renderTarget;

}

function getColorState() {
    return {
        autoClearColor : renderer.autoClearColor,
        clearColor : renderer.getClearColor().getHex(),
        clearAlpha : renderer.getClearAlpha()
    };
}

function setColorState(state) {
    renderer.setClearColor(state.clearColor, state.clearAlpha);
    renderer.autoClearColor = state.autoClearColor;
}
