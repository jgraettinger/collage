precision mediump float;

varying vec2 vTextureOut0;

uniform sampler2D uSampler;
uniform vec4 gamma;

void main(void) {
  vec4 linColor = texture2D(uSampler, vec2(vTextureOut0.s, vTextureOut0.t));
  gl_FragColor = pow(linColor, gamma);
}
