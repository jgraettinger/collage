precision mediump float;

varying vec2 vTextureOut0;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureOut0.s, vTextureOut0.t));
}
