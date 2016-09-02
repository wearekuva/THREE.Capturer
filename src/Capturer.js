var mixIn = require('mout/object/mixIn');
var fboHelper = require('./helpers/fboHelper');

var undef;

function Capturer(cfg) {

    mixIn(this, {

        fileName: 'capture',
        fileType: 'png',

        renderer: undef,
        camera: undef,
        scene: undef,
        method: undef

    }, cfg);

    fboHelper.init(this.renderer);

}

var _p = Capturer.prototype;
Capturer.methods = {
    ODS : require('./methods/MethodOds'),
    Equirectangular : require('./methods/MethodEquirectangular')
};
_p.render = render;
_p.capture = capture;

function render(renderTarget, forceClear) {

    var method = this.method;
    method.render( this.renderer, this.scene, this.camera, renderTarget, forceClear );

}

function capture(cb) {

    this.renderer.domElement.toBlob(toBlob.bind(this, cb), 'image/' + (this.fileType === 'jpg' ? 'jpeg' : this.fileType));

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
