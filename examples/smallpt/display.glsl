#version 300 es

precision highp float;
precision mediump int;
precision mediump sampler3D;
precision mediump sampler2DArray;
precision mediump usampler2D;

layout(location = 0) out highp vec4 FragColor;

uniform sampler2D u_tex;
uniform float u_cont;

const vec3 gamma = vec3(1./2.2);

void main() {
    vec3 col = texelFetch( u_tex, ivec2(gl_FragCoord.xy), 0 ).rgb * u_cont;
	FragColor = vec4(pow(col, gamma), 1.0);
}