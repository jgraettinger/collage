precision mediump float;

varying vec2 vTextureOut0;
varying vec3 vLocal;

uniform sampler2D uSampler;
uniform vec4 gamma;

uniform vec3 clip1;
uniform vec3 clip2;
uniform vec3 clip3;
uniform vec3 clip4;

void main(void) {
  vec4 linColor = texture2D(uSampler, vec2(vTextureOut0.s, vTextureOut0.t));

  vec4 clipDistance = vec4(
   dot(vLocal, clip1),
   dot(vLocal, clip2),
   dot(vLocal, clip3),
   dot(vLocal, clip4));

  bool clip = any(lessThan(clipDistance, vec4(0.0)));

  vec4 grayColor = vec4(0.25 * vec3(dot(linColor.xyz, vec3(0.3333333))), 1.0) - linColor;
  linColor += float(clip) * grayColor;

  gl_FragColor = pow(linColor, gamma);
}
