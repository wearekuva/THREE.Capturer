uniform samplerCube u_texture;

varying vec2 v_uv;

void main() {
    vec2 thetaphi = ((v_uv * 2.0) - vec2(1.0)) * vec2(3.1415926535897932384626433832795, 1.5707963267948966192313216916398);
    vec3 rayDirection = vec3(cos(thetaphi.y) * cos(thetaphi.x), sin(thetaphi.y), cos(thetaphi.y) * sin(thetaphi.x));
    gl_FragColor = textureCube(u_texture, rayDirection);

}
