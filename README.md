# nWGL

Simple WebGL2 boilerplate. It's supposed to save me some time every time I start a new project.

## Demos
[obj-viewer](https://mourtz.github.io/nWGL-examples/obj-viewer/index.html)
([code](https://github.com/Mourtz/nWGL-examples/tree/master/obj-viewer))

#### ! Draft extensions have to be enabled for the following demos !
[Subsurface Scattering experiment](https://mourtz.github.io/flattened-smallpt/index?scene=subsurface)

[flattened-smallpt](https://mourtz.github.io/flattened-smallpt/index) ([code](https://github.com/Mourtz/flattened-smallpt)) \
[Homogeneous Medium](https://mourtz.github.io/flattened-smallpt/index?scene=volume) ([code](https://github.com/Mourtz/flattened-smallpt/blob/master/medium0.glsl))

[smallpt](https://mourtz.github.io/nWGL-examples/smallpt/smallpt.html) 
([code](https://github.com/Mourtz/nWGL-examples/tree/master/smallpt))

```js
const W_SIZE = window.innerHeight/1.25;
let sandbox = new nWGL.main({ "width": W_SIZE, "height": W_SIZE });

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

sandbox.programs["raytracing"].addUniform("u_backbuffer", "1i", 0);

//------------------------- Display Program -------------------------
sandbox.addProgram([
    sandbox.shaders["vertex_shader"],
    sandbox.shaders["display_shader"]
  ], "display" );

sandbox.programs["display"].addUniform("u_cont", "1f", 1);    
sandbox.programs["display"].addUniform("u_tex", "1i", 1);

//------------------------- Render Loop -------------------------
(function render() {
  sandbox.m_draw([
    function(){
      sandbox.program = "raytracing";

      sandbox.setTexture("u_backbuffer", sandbox.textures["tex0"].tex, 0);

      sandbox.bindFramebuffer(fb.fb);
      fb.setTexture(0, fb.t0);
    },

    function(){
      sandbox.program = "display";

      sandbox.uniform("u_cont", 1.0 / (sandbox.frame+1));
      sandbox.setTexture("u_tex", fb.t0, 1);

      sandbox.bindFramebuffer(null);
    }
  ]);

  // texture ping pong
  sandbox.textures["tex0"].swap(fb.textures[0])

  window.requestAnimationFrame(render);
})();
```
[Raymarching Primitives](https://mourtz.github.io/nWGL-examples/raymarching_primitives/raymarching_primitives.html)
([code](https://github.com/Mourtz/nWGL-examples/tree/master/raymarching_primitives))
```js
const W_SIZE = window.innerHeight/1.25;
let sandbox = new nWGL.main({ "width": W_SIZE, "height": W_SIZE });

//------------------------- Program -------------------------
sandbox.addProgram([
    sandbox.addShader("vert.glsl", true, "vertex_shader"),
    sandbox.addShader("Image.glsl", false, "image_shader")
  ], "mainProgram"
);

//------------------------- Render Loop -------------------------
(function render() {
  sandbox.draw();
  window.requestAnimationFrame(render);
})();
```
