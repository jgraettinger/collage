attribute vec3 vPosition;
attribute vec2 vTexture0;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

varying vec2 vTextureOut0;

void main(void) {
  gl_Position = pMatrix * mvMatrix * vec4(vPosition, 1.0);
  vTextureOut0 = vTexture0;
}
