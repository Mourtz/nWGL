# nWGL

Simple WebGL2 boilerplate. It's supposed to save me some time every time I start a new project.

## Demos
[smallpt](https://mourtz.github.io/nWGL/examples/smallpt/smallpt.html) 
([code](https://github.com/Mourtz/nWGL/blob/master/examples/smallpt/smallpt.html))

```js
const WIDTH = window.innerHeight/1.25, HEIGHT = window.innerHeight/1.25;
let sandbox = new nWGL.main({ "width": WIDTH, "height": HEIGHT });
//------------------------- Framebuffers -------------------------
let fb = sandbox.addFrameBuffer({ "internalformat": "RGBA32F" }, "backbuffer");
//------------------------- Textures -------------------------
let tex = sandbox.addTexture({ "internalformat": "RGBA32F" }, "tex0");

//------------------------- Shaders -------------------------
let vertex_shader = sandbox.addShader("vert.glsl", true, "vertex_shader");
let frag_shader = sandbox.addShader("smallpt.glsl", false, "pt_shader");
let display_shader = sandbox.addShader("display.glsl", false, "display_shader");

//------------------------- RayTracing Program -------------------------
sandbox.addProgram([
  sandbox.shaders["vertex_shader"], 
  sandbox.shaders["pt_shader"] 
], "raytracing");

sandbox.programs["raytracing"].addUniform("u_backbuffer", "1i");
sandbox.programs["raytracing"].setUniform("u_backbuffer", 0);
//------------------------- Display Program -------------------------
sandbox.addProgram([
    sandbox.shaders["vertex_shader"],
    sandbox.shaders["display_shader"]
  ], "display" );

sandbox.programs["display"].addUniform("u_cont", "1f");
sandbox.programs["display"].setUniform("u_cont", 1);

sandbox.programs["display"].addUniform("u_tex", "1i");
sandbox.programs["display"].setUniform("u_tex", 1);
//------------------------- Render Loop -------------------------
let frame = 1;
(function render() {
  sandbox.setProgram("raytracing")     
  sandbox.setTexture(0, "u_backbuffer", sandbox.textures["tex0"].tex);

  sandbox.gl.bindFramebuffer(sandbox.gl.FRAMEBUFFER, fb.fb);
  fb.setTexture(0, fb.t0);
  sandbox.draw();

  sandbox.setProgram("display")
  sandbox.programs["display"].setUniform("u_cont", 1.0 / frame);
  sandbox.setTexture(1, "u_tex", fb.t0);

  sandbox.gl.bindFramebuffer(sandbox.gl.FRAMEBUFFER, null);
  sandbox.draw();
  // texture ping pong
  sandbox.textures["tex0"].swap(fb.textures[0])

  // increment frame by 1
  frame++;

  window.requestAnimationFrame(render);
})();
```
[Raymarching Primitives](https://mourtz.github.io/nWGL/examples/raymarching_primitives/raymarching_primitives.html)
([code](https://github.com/Mourtz/nWGL/blob/master/examples/raymarching_primitives/raymarching_primitives.html))
```js
const WIDTH = window.innerHeight/1.25, HEIGHT = window.innerHeight/1.25;
let sandbox = new nWGL.main({ "width": WIDTH, "height": HEIGHT });

//------------------------- Shaders -------------------------
let vertex_shader = sandbox.addShader("vert.glsl", true, "vertex_shader");
let frag_shader = sandbox.addShader("Image.glsl", false, "image_shader");

//------------------------- Program -------------------------
sandbox.addProgram(
  [
    sandbox.shaders["vertex_shader"],
    sandbox.shaders["image_shader"]
  ],
  "mainProgram"
);
//------------------------- Render Loop -------------------------
(function render() {
  sandbox.draw();
  window.requestAnimationFrame(render);
})();
```
