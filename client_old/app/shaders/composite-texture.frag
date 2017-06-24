precision mediump float;

varying vec2 vTexture;

uniform sampler2D uSamplerHigh;
uniform sampler2D uSamplerLow;

const float scalerHigh = 1.0;
const float scalerLow  = 1.0 / 256.0;

void main(void) {
  vec4 colorHigh = texture2D(uSamplerHigh, vTexture);
  vec4 colorLow = texture2D(uSamplerLow, vTexture);

  gl_FragColor = vec4(
    colorHigh.r * scalerHigh + colorLow.r * scalerLow,
    colorHigh.g * scalerHigh + colorLow.g * scalerLow,
    colorHigh.b * scalerHigh + colorLow.b * scalerLow,
    1.0);
}
