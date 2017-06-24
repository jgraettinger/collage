attribute vec3 vPosition;

varying vec2 vTexture;

void main(void) {
  vTexture = vec2(
    0.5 + vPosition.x * 0.5,
    0.5 + vPosition.y * 0.5);
  gl_Position = vec4(vPosition, 1.0);
}
