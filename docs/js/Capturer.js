(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var hasOwn = require(3);

    var _hasDontEnumBug,
        _dontEnums;

    function checkDontEnum(){
        _dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];

        _hasDontEnumBug = true;

        for (var key in {'toString': null}) {
            _hasDontEnumBug = false;
        }
    }

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forIn(obj, fn, thisObj){
        var key, i = 0;
        // no need to check if argument is a real object that way we can use
        // it for arrays, functions, date, etc.

        //post-pone check till needed
        if (_hasDontEnumBug == null) checkDontEnum();

        for (key in obj) {
            if (exec(fn, obj, key, thisObj) === false) {
                break;
            }
        }


        if (_hasDontEnumBug) {
            var ctor = obj.constructor,
                isProto = !!ctor && obj === ctor.prototype;

            while (key = _dontEnums[i++]) {
                // For constructor, if it is a prototype object the constructor
                // is always non-enumerable unless defined otherwise (and
                // enumerated above).  For non-prototype objects, it will have
                // to be defined on this object, since it cannot be defined on
                // any prototype objects.
                //
                // For other [[DontEnum]] properties, check if the value is
                // different than Object prototype value.
                if (
                    (key !== 'constructor' ||
                        (!isProto && hasOwn(obj, key))) &&
                    obj[key] !== Object.prototype[key]
                ) {
                    if (exec(fn, obj, key, thisObj) === false) {
                        break;
                    }
                }
            }
        }
    }

    function exec(fn, obj, key, thisObj){
        return fn.call(thisObj, obj[key], key, obj);
    }

    module.exports = forIn;



},{"3":3}],2:[function(require,module,exports){
var hasOwn = require(3);
var forIn = require(1);

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forOwn(obj, fn, thisObj){
        forIn(obj, function(val, key){
            if (hasOwn(obj, key)) {
                return fn.call(thisObj, obj[key], key, obj);
            }
        });
    }

    module.exports = forOwn;



},{"1":1,"3":3}],3:[function(require,module,exports){


    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



},{}],4:[function(require,module,exports){
var forOwn = require(2);

    /**
    * Combine properties from all the objects into first one.
    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
    * @param {object} target    Target Object
    * @param {...object} objects    Objects to be combined (0...n objects).
    * @return {object} Target Object.
    */
    function mixIn(target, objects){
        var i = 0,
            n = arguments.length,
            obj;
        while(++i < n){
            obj = arguments[i];
            if (obj != null) {
                forOwn(obj, copyProp, target);
            }
        }
        return target;
    }

    function copyProp(val, key){
        this[key] = val;
    }

    module.exports = mixIn;


},{"2":2}],5:[function(require,module,exports){
var mixIn = require(4);
var fboHelper = require(6);

var undef;

function Capturer(cfg) {

    mixIn(this, {

        fileName: 'capture',
        fileType: 'png',
        imageQuality: 0.8,

        renderer: undef,
        camera: undef,
        scene: undef,
        method: undef

    }, cfg);

    fboHelper.init(this.renderer);

}

var _p = Capturer.prototype;
Capturer.methods = {
    ODS : require(9),
    Equirectangular : require(8)
};
_p.render = render;
_p.capture = capture;

function render(renderTarget, forceClear) {

    var method = this.method;
    method.render( this.renderer, this.scene, this.camera, renderTarget, forceClear );

}

function capture(cb) {

    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {

            var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
            len = binStr.length,
            arr = new Uint8Array(len);

            for (var i=0; i<len; i++ ) {
                arr[i] = binStr.charCodeAt(i);
            }

            callback( new Blob( [arr], {type: type || 'image/png'} ) );
            }
        });
    }
    var domElement = this.renderer.domElement;
    var fileType = 'image/' + (this.fileType === 'jpg' ? 'jpeg' : this.fileType);
    var imageQuality = this.imageQuality;

    if(domElement.toBlob) {
        domElement.toBlob(toBlob.bind(this, cb), fileType, imageQuality);
    } else {

        // polyfill based on https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
        var binStr = atob( domElement.toDataURL(fileType, imageQuality).split(',')[1] );
        var len = binStr.length;
        var arr = new Uint8Array(len);
        for (var i = 0; i < len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
        }
        toBlob.call( this,  cb, new Blob( [arr], {type: fileType} ));
    }

}

function toBlob( cb, blob ) {

    // based on https://github.com/spite/THREE.CubemapToEquirectangular/blob/master/src/CubemapToEquirectangular.js
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement( 'a' );
    anchor.href = url;
    anchor.setAttribute('download', this.fileName + '.' + this.fileType);
    anchor.className = 'download-js-link';
    anchor.innerHTML = 'downloading...';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    setTimeout(function() {
        anchor.click();
        document.body.removeChild(anchor);
        if(cb) cb();
    }, 1 );

}

if(window.THREE) window.THREE.Capturer = Capturer;
if (typeof define === 'function' && define.amd) { //AMD
    define(function () { return Capturer; });
} else if (typeof module !== 'undefined' && module.exports) { //node
    module.exports = Capturer;
}

},{"4":4,"6":6,"8":8,"9":9}],6:[function(require,module,exports){


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
        vertexShader: vertexShader = exports.vertexShader = rawShaderPrefix + "#define GLSLIFY 1\nattribute vec3 position;\nattribute vec2 uv;\n\nvarying vec2 v_uv;\n\nvoid main() {\n    v_uv = uv;\n    gl_Position = vec4( position, 1.0 );\n}\n",
        fragmentShader: rawShaderPrefix + "#define GLSLIFY 1\nuniform sampler2D u_texture;\n\nvarying vec2 v_uv;\n\nvoid main() {\n    gl_FragColor = texture2D( u_texture, v_uv );\n}\n"
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

},{}],7:[function(require,module,exports){
var mixIn = require(4);

function Method(cfg) {

    THREE.Object3D.call( this );

    mixIn(this, cfg);
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

},{"4":4}],8:[function(require,module,exports){
var Method = require(7);
var fboHelper = require(6);
var mixIn = require(4);


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
        method: 'Equirectangular',
        size: 4096,
        cubeSize: 2048,
    }, cfg));
    this.width = this.size;
    this.height = this.width >> 1;
    this.cubeRenderTarget = new THREE.WebGLRenderTargetCube(this.cubeSize, this.cubeSize, {
        format: THREE.RGBFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter
    });

    this.cubeSideCameras = {};
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
        fragmentShader: fboHelper.rawShaderPrefix + "#define GLSLIFY 1\nuniform samplerCube u_texture;\n\nvarying vec2 v_uv;\n\nvoid main() {\n    vec2 thetaphi = ((v_uv * 2.0) - vec2(1.0)) * vec2(3.1415926535897932384626433832795, 1.5707963267948966192313216916398);\n    vec3 rayDirection = vec3(cos(thetaphi.y) * cos(thetaphi.x), sin(thetaphi.y), cos(thetaphi.y) * sin(thetaphi.x));\n    gl_FragColor = textureCube(u_texture, rayDirection);\n\n}\n",
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

},{"4":4,"6":6,"7":7}],9:[function(require,module,exports){
var Method = require(7);
var fboHelper = require(6);

var mixIn = require(4);


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
        fragmentShader: fboHelper.rawShaderPrefix + "#define GLSLIFY 1\nuniform sampler2D u_texture;\nvarying vec2 v_uv;\n\nvoid main() {\n\n    float y = fract(v_uv.y * 2.0);\n\n    float phi = y * 3.1415926535897932384626433832795 / 2.0 - 3.1415926535897932384626433832795 / 4.0;\n\n    gl_FragColor = texture2D(u_texture, vec2(v_uv.x, (tan(phi) * 0.25 + mix(0.25, 0.75, step(0.5, v_uv.y)))));\n\n}\n"
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

},{"4":4,"6":6,"7":7}]},{},[5]);
