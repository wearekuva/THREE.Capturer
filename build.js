global.Promise = require('pinkie-promise');
const browserify = require('browserify');
const fs = require('fs');
const UglifyJS = require('uglify-js');

Promise.all(['Capturer.js'].map(runBuild)).catch(function (err) {
  console.error(err);
}).then(function () {
  console.log('Finished');
});

function runBuild (f) {
  return new Promise(function (resolve, reject) {
    console.log('Bundling', f);
    var b = browserify('src/' + f, {
      debug: false,
      // noparse: [ 'three' ]
    });
    // b.transform(require('babelify').configure({ presets: 'es2015' }));
    b.plugin(require('bundle-collapser/plugin'));
    var transforms = [['glslify', { global: true, transform: ['glslify-hex'] }]];
    transforms.forEach(function (t) {
      b.transform(t);
    });
    b.bundle(function (err, src) {
      if (err) return reject(err);
      console.log('Compressing', f);
      src = src.toString();
      fs.writeFileSync('dist/' + f, src);
      fs.writeFileSync('docs/js/' + f, src);
      var result = UglifyJS.minify(src, { fromString: true });
      console.log('Writing', f);
      fs.writeFileSync('dist/' + f.replace('.js','.min.js'), result.code);
      resolve();
    });
  });
}
