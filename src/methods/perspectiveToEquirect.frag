
uniform sampler2D u_texture;
varying vec2 v_uv;

void main() {

    float y = fract(v_uv.y * 2.0);

    float phi = y * 3.1415926535897932384626433832795 / 2.0 - 3.1415926535897932384626433832795 / 4.0;

    gl_FragColor = texture2D(u_texture, vec2(v_uv.x, (tan(phi) * 0.25 + mix(0.25, 0.75, step(0.5, v_uv.y)))));

}
