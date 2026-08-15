// Ported from src/shaders/particles/fragment.glsl
// The #include <tonemapping_fragment> / #include <colorspace_fragment> lines are
// resolved by three.js's own ShaderChunk system at material compile time -
// that's unrelated to vite-plugin-glsl and works the same with any bundler.
const particlesFragmentShader = /* glsl */ `
varying vec3 vColor;

void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - 0.5);
    float alpha = 0.05 / distanceToCenter - 0.1;

    gl_FragColor = vec4(vColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`

export default particlesFragmentShader
