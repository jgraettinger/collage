precision mediump float;

varying vec2 vTexture;

uniform sampler2D uSamplerHigh;
uniform sampler2D uSamplerLow;
const float scaler = 1.0 / 256.0;

void main(void) {
  vec4 colorHigh = texture2D(uSamplerHigh, vTexture);
  vec4 colorLow = texture2D(uSamplerLow, vTexture);

  gl_FragColor = vec4(
    colorHigh.r + colorLow.r * scaler,
    colorHigh.g + colorLow.g * scaler,
    colorHigh.b + colorLow.b * scaler,
    1.0);
}
