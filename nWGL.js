/**
 * @author Alex Mourtziapis <alex.mourtziapis@gmail.com>
 */

'use strict';

/**
 * nWGL namespace
 * @namespace
 */
var nWGL = nWGL || {};

/**
 * Get text from an external file
 * @param {string} - filepath
 */
nWGL.getTextFromFile = function (filepath) {
  let request = new XMLHttpRequest();
  let response;

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      response = request.responseText;
    }
  }
  request.open('GET', filepath, false);
  request.overrideMimeType("text/plain");
  request.send(null);
  return response;
};

/**
 * Shader Parser
 * @param {string} - filepath
 * @param {function} [callback] - callback function for a custom parser
 */
nWGL.parseShader = function (filepath, callback) {
  let string = nWGL.getTextFromFile(filepath);
  return (callback) ? callback(string) : string;
};

//-----------------------------------------------------------------------

/**
 * nWGL texture wrapper
 */
nWGL.texture = class {
  /**
   * @param {nWGL.main} nWGL - nWGL reference
   * @param {object} [opts] - texture's options
   * @param {string} [opts.internalformat = "RGBA"] - texture's internalformat ("sRGB8", "RGBA32F" etc.).
   * @param {string} [opts.url=null] - filepath of the image you want to load.
   * @param {number} [opts.width=nWGL.canvas.width] - texture's width.
   * @param {number} [opts.height=nWGL.canvas.height] - texture's height.
   * @param {ArrayBufferView} [opts.data] - texture's pixel data.
   */
  constructor(nWGL, opts) {

    opts = opts || {};

    /** @member {nWGL} */
    this.nWGL = nWGL;

    let gl = nWGL.gl;

    /** @member {number} - texture's width */
    this.width = undefined;
    /** @member {number} - texture's height */
    this.height = undefined;

    /** @member {HTMLImageElement | HTMLVideoElement} */
    this.image = undefined;
    /** @member {WebGLTexture} */
    this.texture = undefined;

    /** @member {GLfloat | GLint} */
    this.TEXTURE_WRAP_S = gl.CLAMP_TO_EDGE;
    /** @member {GLfloat | GLint} */
    this.TEXTURE_WRAP_T = gl.CLAMP_TO_EDGE;
    /** @member {GLfloat | GLint} */
    this.TEXTURE_MAG_FILTER = gl.LINEAR;
    /** @member {GLfloat | GLint} */
    this.TEXTURE_MIN_FILTER = gl.LINEAR;

    /** @member {GLenum} - texture's internal format */
    this.internalformat = gl[opts.internalformat || "RGBA"];

    /** @member {GLenum} - texture's format */
    this.format = gl.RGBA;
    /** @member {GLenum} - texture's data type */
    this.type = gl.UNSIGNED_BYTE;
    /** @member {number} - texture's color channels */
    this.colorChannels = 4;
    /** @member {ArrayBufferView.prototype} - texture's pixel data type */
    this.dataType = Uint8Array;

    switch (this.internalformat) {
      // RGB uint8_t
      case gl.RGB:
      case gl.RGB8:
      case gl.SRGB8:
        this.colorChannels = 3;

        this.format = gl.RGB;
        this.type = gl.UNSIGNED_BYTE;
        break;

        //------------------------------------------
        //------------------------------------------

        // RGB int16_t
      case gl.RGB16I:
        this.colorChannels = 3;
        this.dataType = Int16Array;

        this.format = gl.RGB_INTEGER;
        this.type = gl.SHORT;
        break;

        // RGBA int16_t
      case gl.RGBA16I:
        this.colorChannels = 4;
        this.dataType = Int16Array;

        this.format = gl.RGBA_INTEGER;
        this.type = gl.SHORT;
        break;

        //------------------------------------------

        // RGB int32_t
      case gl.RGB32I:
        this.colorChannels = 3;
        this.dataType = Int32Array;

        this.format = gl.RGB_INTEGER;
        this.type = gl.INT;
        break;

        // RGBA int32_t
      case gl.RGBA32I:
        this.colorChannels = 4;
        this.dataType = Int32Array;

        this.format = gl.RGBA_INTEGER;
        this.type = gl.INT;
        break;

        //------------------------------------------
        //------------------------------------------

        // RGB float16_t
      case gl.RGB16F:
        this.colorChannels = 3;
        this.dataType = Float32Array;

        this.format = gl.RGB;
        this.type = gl.HALF_FLOAT;
        break;

        // RGBA float16_t
      case gl.RGBA16F:
        this.colorChannels = 4;
        this.dataType = Float32Array;

        this.format = gl.RGBA;
        this.type = gl.HALF_FLOAT;
        break;

        //------------------------------------------

        // RGB float32_t
      case gl.RGB32F:
        this.colorChannels = 3;
        this.dataType = Float32Array;

        this.format = gl.RGB;
        this.type = gl.FLOAT;
        break;

        // RGBA float32_t
      case gl.RGBA32F:
        this.colorChannels = 4;
        this.dataType = Float32Array;

        this.format = gl.RGBA;
        this.type = gl.FLOAT;
        break;

      default:
        break;
    }

    //---------------------------
    if (opts.url) {
      this.loadImage(opts.url);
    } else {
      this.width = opts.width || nWGL.canvas.width || 1024;
      this.height = opts.height || nWGL.canvas.height || 768;
      // there's no need to store pixel data on the host side
      this.createTexture(opts.data || new this.dataType(this.width * this.height * this.colorChannels));
    }
  }

  /** 
   * Creates a GL texture.
   * @param {HTMLImageElement | HTMLVideoElement} [data=this.image] - data to put inside the GL texture
   */
  createTexture(data) {
    let gl = this.nWGL.gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.TEXTURE_WRAP_S);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.TEXTURE_WRAP_T);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.TEXTURE_MIN_FILTER);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.TEXTURE_MAG_FILTER);

    gl.texImage2D(gl.TEXTURE_2D,
      0,
      this.internalformat,
      this.width,
      this.height,
      0,
      this.format,
      this.type,
      data || this.image
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** 
   * Loads an image from the disk, afterwards creates a GL texture
   * and passes the pixel data.
   * @param {string} url - filepath of the image
   */
  loadImage(url) {
    this.image = new Image();

    let sandbox = this;
    this.image.onload = function () {
      sandbox.width = sandbox.image.width;
      sandbox.height = sandbox.image.height;

      sandbox.createTexture();
    };

    this.image.src = url;
  }

  /** 
   * Swaps the GL_texture of two nWGL.texture objects
   * @param {nWGL.texture | WebGLTexture} tex
   */
  swap(tex) {
    if(tex instanceof nWGL.texture){
      let temp = {};
      Object.assign(temp, this);
      Object.assign(this, tex);
      Object.assign(tex, temp);
    } else if(this.nWGL.gl.isTexture(tex)) {
      let temp = this.texture;
      this.texture = tex;
      tex = temp;
    } else {
      throw "cant do anything with what you gave me!";
    }
  }

  /**
   * Deletes WebGLTexture
   */
  delete() {
    this.nWGL.gl.deleteTexture(this.texture);
  }

  // texture getter
  get tex() {
    return this.texture;
  }

  // texture's pixel data setter
  set tex_data(opts) {
    let gl = this.nWGL.gl;

    if (opts.bind) gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texImage2D(gl.TEXTURE_2D,
      0,
      this.internalformat,
      this.width,
      this.height,
      0,
      this.format,
      this.type,
      opts.data || this.image
    );
  }

  // image getter
  get img() {
    return this.image;
  }

};

/**
 * nWGL cubemap wrapper
 */
nWGL.cubemap = class {
  /**
   * @param {nWGL.main} nWGL - nWGL reference
   * @param {object} opts - cubemaps's options
   * @param {string[]} opts.images_url - each cubemap's image filepath
   */
  constructor(nWGL, opts) {
    opts = opts || {};

    /** @member {nWGL} */
    this.nWGL = nWGL;
    /** @member {HTMLImageElement | HTMLVideoElement} */
    this.images = [];
    /** @member {WebGLTexture} */
    this.texture = null;

    let gl = nWGL.gl;

    if (!Array.isArray(opts.images_url) || opts.images_url.length != 6) {
      throw "You must pass 6 images to create a cubemap!";
    }

    let sandbox = this; 
    {
      let texture = gl.createTexture();

      const targets = [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z];

      for (let i = 0; i < 6; ++i) {
        let image = new Image();

        image.onload = function () {
          sandbox.images.push(image);

          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(targets[i], 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

          if (i === 5) {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            sandbox.texture = texture;
            console.log("laoded Cubemap!");
          }
        };

        image.src = opts.images_url[i];
      }
    }
  }

  get tex() {
    return this.texture;
  }
};

//-----------------------------------------------------------------------

/**
 * nWGL shader wrapper
 */
nWGL.shader = class {
  /**
   * @param {WebGL2RenderingContext} gl - WebGL context
   * @param {object} opts - shader's options
   * @param {boolean} [opts.isVert=false] - Is a vertex shader?
   * @param {string} opts.string - shader's source code.
   */
  constructor(gl, opts) {
    /** @member {WebGL2RenderingContext} */
    this.gl = gl;
    /** @member {boolean} */
    this.isVertexShader = (typeof opts.isVert === "boolean") ? opts.isVert : false;
    /** @member {string} */
    this.source = (typeof opts.string === "string") ? opts.string : null;
    /** @member {WebGLShader} */
    this.shader = null;

    this.compile();
  }

  /**
   * Compiles the shader
   * @param {string} [source=this.source] - the new source of the shader
   */
  compile(source){
    let gl = this.gl;

    // mark previous shader for deletion
    if(source && this.source && this.shader) gl.deleteShader(this.shader); 

    // update source if needed
    this.source = source || this.source;

    let shader = gl.createShader(this.isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, this.source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw ("could not compile shader: \n" + gl.getShaderInfoLog(shader));

    this.shader = shader;
  }
};

//-----------------------------------------------------------------------

/**
 * nWGL program wrapper
 */
nWGL.program = class {
  /**
   * @param {nWGL.main} nWGL - nWGL reference
   * @param {nWGL.shader[]} shaders - shaders to attach to the program
   */
  constructor(nWGL, shaders) {
    /** @member {nWGL} */
    this.nWGL = nWGL;
    /** @member {nWGL.shader[]} */
    this.shaders = shaders;
    /** @member {WebGLProgram} */
    this.program = null;
    /** @member {object} */
    this.uniforms = {};
    /** @member {object} */
    this.uniformsLocation = {};
    /** @member {number[]} - texture index array */
    this.textureIndex = {};

    this.initProgram();
  }
  
  /**
   * Create a new WebGLProgram
   * @param {nWGL.shader[]} - new shaders to attach to the program
   */
  initProgram(shaders){
    let gl = this.nWGL.gl;

    this.shaders = shaders || this.shaders;

    let program = gl.createProgram();
    for (let i = 0; i < this.shaders.length; i++) {
      if(!Array.isArray(this.shaders) || !this.shaders[i] || !(this.shaders[i] instanceof nWGL.shader) || !gl.isShader(this.shaders[i].shader) ) throw "something went wrong fella!";
      gl.attachShader(program, this.shaders[i].shader);
    }
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw "Unable to initialize the shader program: \n" + gl.getProgramInfoLog(program);

    this.program = program;
  }

  /**
   * Adds a uniform to the program
   * @param {string} name - uniform's name
   * @param {object} uniform - uniform's data type
   * @param {float[]} [data] - data to pass to the uniform
   */
  addUniform(name, uniform, ...data) {
    let gl = this.nWGL.gl;
    let uniformLocation = gl.getUniformLocation(this.program, name);

    if (gl.getError() == gl.NO_ERROR && uniformLocation) {
      if (uniform.charAt(uniform.length - 1) != 'v') {
        uniform += 'v';
      }

      this.uniforms[name] = uniform;
      this.uniformsLocation[name] = uniformLocation;

      if(data.length > 0) this.setUniform(name, data);
      return true;
    }

    // dont show warnings for default uniforms
    if(!(name == "u_resolution" || name == "u_time" || name == "u_mouse" || name == "u_frame")) console.warn("Couldn't find '" + name + "' uniform!");

    return false;
  }

  /**
   * Sets a value to the uniform with the name you have given
   * @param {string} name - uniform's name
   * @param {float[]} data - data to pass to the uniform
   */
  setUniform(name, ...data) {
    let gl = this.nWGL.gl;

    if(this.uniformsLocation[name])
      gl["uniform" + this.uniforms[name]](this.uniformsLocation[name], data);
  }

  /**
   * Sets/Adds a texture at a given position in the program
   * @param {string} name - texture's name
   * @param {WebGLTexture} tex - texture
   * @param {number} [pos] - texture's position
   * @param {GLenum} [target=gl.TEXTURE_2D] - binding point(target)
   */
  setTexture(name, tex, pos, target) {
    if(!tex || !name) return;

    pos = pos || this.textureIndex[name] || 0; 

    let gl = this.nWGL.gl;
    gl.activeTexture(gl.TEXTURE0 + pos);
    gl.bindTexture(gl[target || "TEXTURE_2D"], tex);
    if (!this.textureIndex[name] || this.textureIndex[name] != pos) {
      this.textureIndex[name] = pos;
    }
  }

  /**
   * Reorganizes textures using the "textureIndex" array 
   * @param {object} textures
   */
  refitTextures(textures){
    let names = Object.keys(this.textureIndex);
    for (let name in names) {
      this.setTexture(name, textures[name].tex);
    }
  }
};

//-----------------------------------------------------------------------

/**
 * nWGL buffer wrapper
 */
nWGL.buffer = class {
  /**
   * @param {nWGL.main} nWGL - nWGL reference
   * @param {object} [opts] - buffer's options
   * @param {GLenum} [opts.target = gl.ARRAY_BUFFER] - buffer's binding point
   * @param {GLenum} [opts.usage = gl.STATIC_DRAW] - usage pattern of the data store
   * @param {ArrayBuffer} [opts.data] - buffer's data
   */
  constructor(nWGL, opts) {
    opts = opts || {};

    /** @member {nWGL} */
    this.nWGL = nWGL;

    let gl = nWGL.gl;

    /** @member {WebGLBuffer} */
    this.buffer = gl.createBuffer();
    /** @member {GLenum} */
    this.target = opts.target || gl.ARRAY_BUFFER;
    /** @member {GLenum} */
    this.usage = opts.usage || gl.STATIC_DRAW;

    if (opts.data) this.fillBuffer(opts.data);
  }

  /**
   * Store data in the buffer
   * @param {ArrayBuffer} [opts.data] - buffer's data
   */
  fillBuffer(data) {
    let gl = this.nWGL.gl;

    gl.bindBuffer(this.target, this.buffer);
    gl.bufferData(this.target, data, this.usage);
  }

  /**
   * Delete buffer
   */
  delete() {
    let gl = this.nWGL.gl;

    gl.deleteBuffer(this.buffer);
  }

  // buffer getter
  get b() {
    return this.buffer;
  }
};


//-----------------------------------------------------------------------

/**
 * nWGL framebuffer wrapper
 */
nWGL.framebuffer = class {
  /**
   * @param {nWGL.main} nWGL - nWGL reference
   * @param {object} [opts] - framebuffer's options
   * @param {string} [opts.internalformat = "RGBA"] - texture's internalformat ("sRGB8", "RGBA32F" etc.).
   * @param {number} [opts.totalBuffers = (opts.internalformat.length | 1)] - total draw buffers.
   * @param {string} [opts.url=null] - filepath of the image you want to load.
   * @param {number} [opts.width=nWGL.canvas.width] - texture's width.
   * @param {number} [opts.height=nWGL.canvas.height] - texture's height.
   */
  constructor(nWGL, opts) {
    opts = opts || {};

    /** @member {nWGL} */
    this.nWGL = nWGL;
    /** @member {nWGL.texture[]} */
    this.textures = [];
    /** @member {WebGLFramebuffer} */
    this.framebuffer = null;
    /** @member {number} */
    this.totalBuffers = opts.totalBuffers || (opts.internalformat && Array.isArray(opts.internalformat) && opts.internalformat.length) || 1;

    this.createFrameBuffer(opts);
  }

  /**
   * Initializes framebuffer
   * @param {object} [opts] - framebuffer's texture options
   */
  createFrameBuffer(opts) {
    let gl = this.nWGL.gl;

    let framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);

    opts.internalformat = opts.internalformat || "RGBA32F";

    let drawBuffers = [];
    for (let i = 0; i < this.totalBuffers; ++i) {
      if(Array.isArray(opts.internalformat)){
        this.textures[i] = new nWGL.texture(this.nWGL, {"internalformat": opts.internalformat[Math.min(i, opts.internalformat.length - 1)]} );
      } else {
        this.textures[i] = new nWGL.texture(this.nWGL, opts);
      }

      drawBuffers[i] = gl.COLOR_ATTACHMENT0 + i;
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, drawBuffers[i], gl.TEXTURE_2D, this.textures[i].texture, 0);
    }

    gl.drawBuffers(drawBuffers);

    let status = gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
      console.log('fb status: ' + status);
      return;
    }
    this.framebuffer = framebuffer;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

  }

  /**
   * Assign a WebGLTexture to one of the drawbuffers
   * @param {number} pos - texture's attachment point
   * @param {WebGLTexture} tex - texture
   */
  setTexture(pos, tex) {
    let gl = this.nWGL.gl;

    if(gl.isTexture(tex))
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + pos, gl.TEXTURE_2D, tex, 0);
    else
      throw "that aint a texture!";  
  }

  /** @member {nWGL.texture[]} */
  get t() {
    return this.textures;
  }
  /** @member {nWGL.texture} */
  get t0() {
    return this.textures[0].tex;
  }
  /** @member {nWGL.texture} */
  get t1() {
    return this.textures[1].tex;
  }
  /** @member {nWGL.texture} */
  get t2() {
    return this.textures[2].tex;
  }
  /** @member {nWGL.texture} */
  get t3() {
    return this.textures[3].tex;
  }
  /** @member {nWGL.texture} */
  get t4() {
    return this.textures[4].tex;
  }
  /** @member {nWGL.texture} */
  get t5() {
    return this.textures[5].tex;
  }
  /** @member {nWGL.texture} */
  get t6() {
    return this.textures[6].tex;
  }
  /** @member {nWGL.texture} */
  get t7() {
    return this.textures[7].tex;
  }
  /** @member {nWGL.texture} */
  get t8() {
    return this.textures[8].tex;
  }
  /** @member {nWGL.texture} */
  get t9() {
    return this.textures[9].tex;
  }
  /** @member {nWGL.texture} */
  get t10() {
    return this.textures[10].tex;
  }
  /** @member {nWGL.texture} */
  get t11() {
    return this.textures[11].tex;
  }
  /** @member {nWGL.texture} */
  get t12() {
    return this.textures[12].tex;
  }
  /** @member {nWGL.texture} */
  get t13() {
    return this.textures[13].tex;
  }
  /** @member {nWGL.texture} */
  get t14() {
    return this.textures[14].tex;
  }
  /** @member {nWGL.texture} */
  get t15() {
    return this.textures[15].tex;
  }

  /** @member {WebGLFramebuffer} */
  get fb() {
    return this.framebuffer;
  }
};

/**
 * nWGL pass
 */
nWGL.pass = class {
  constructor(nWGL, opts){
    /** local references */
    this.nWGL = nWGL;

    /** variables */
    this.call = opts.call;
    this.swapBuffer = opts.swapBuffer || false;
    this.mode = opts.mode || "TRIANGLES";
  }

  render(){
    // execute callback function
    this.call();

    if (this.nWGL.activeProgram.uniforms["u_time"]) {
      this.nWGL.activeProgram.setUniform("u_time", performance.now() - this.nWGL.loadTime);
    }

    if (this.nWGL.activeProgram.uniforms["u_mouse"]) {
      this.nWGL.setMouse();
    }

    if (this.nWGL.activeProgram.uniforms["u_frame"]) {
      this.nWGL.activeProgram.setUniform("u_frame", this.nWGL.frame);
    }

    this.nWGL.gl.drawArrays(this.nWGL.gl[this.mode || "TRIANGLES"], 0, 6);
  }
};

//-----------------------------------------------------------------------
//-------------------------------- MAIN ---------------------------------
//-----------------------------------------------------------------------

let __T_CLONES__ = 0;

/**
 * nWGL
 */
nWGL.main = class {
  /**
   * @param {object} [opts] - nWGL's options
   * @param {number} [opts.width = 1024] - canva's width.
   * @param {number} [opts.height = 512] - canva's height.
   * @param {HTMLElement} [opts.el = document.body] - element to append the canvas to.
   */
  constructor(opts) {
    opts = opts || {};

    /** @member {HTMLElement} */
    this.canvas = document.createElement('canvas');
    this.canvas.width = opts.width || 1024;
    this.canvas.height = opts.height || 768;

    /** @member {HTMLElement} */
    this.el = opts.el || document.body;
    this.el.appendChild(this.canvas);

    let gl = null;
    try {
      gl = this.canvas.getContext('webgl2');
    } catch (e) {
      console.error("WebGL2 is not supported on your device!");
    }

    /** @member {WebGL2RenderingContext} */
    this.gl = gl;

    // WebGL2 extensions
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');

    /** @member {number} */
    this.loadTime = performance.now();

    /** @member {object} */
    this.textures = {};
    /** @member {object} */
    this.cubemap_textures = {};
    /** @member {object} */
    this.shaders = {};
    /** @member {object} */
    this.programs = {};
    /** @member {object} */
    this.buffers = {};
    /** @member {object} */
    this.framebuffers = {};
    /** @member {string[]} */
    this.fbo_names = [];
    /** @member {nWGL.program} */
    this.activeProgram = null;
    /** @member {number} */
    this.frame = 0;

    // vbo
    this.addBuffer({
      "data": new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0])
    }, "vbo");
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /** @member {object} - mouse position */
    this.mouse = {
      x: 0,
      y: 0
    };

    // 'mousemove' event listener
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX || e.pageX;
      this.mouse.y = e.clientY || e.pageY;
    }, false);

    console.log("Initialized sandbox No."+ (++__T_CLONES__));
  }

//----------------------------------------------
//-------------- Texture Handlers --------------
//----------------------------------------------

  /**
   * Adds a texture
   * @param {object} [opts] - texture's options
   * @param {string} name - texture's name
   */
  addTexture(opts, name) {
    console.log("⮚ %cAdding (" + name + ") texture.....", "color:#85e600");

    let tex = new nWGL.texture(this, opts);
    this.textures[name] = tex;

    return tex;
  }

  addCubemap(opts, name) {
    let tex = new nWGL.cubemap(this, opts);
    this.cubemap_textures[name] = tex;

    return tex;
  }

  /**
   * Sets/Adds a texture at a given position in the program
   * @param {string} name - texture's name
   * @param {WebGLTexture} [tex=this.textures[name].texture] - texture
   * @param {number} [pos] - texture's position
   * @param {target} [target=gl.TEXTURE_2D] - binding point
   */
  setTexture(name, tex, pos, target) {
    if (typeof name !== "string") return console.error("not correct name!");
    if (!((tex && tex instanceof WebGLTexture) || this.textures[name])) return console.error("not correct texture!");

    this.activeProgram.setTexture(
      name,
      tex || this.textures[name].texture,
      pos,
      target
    );
  }

//------------------------------------------
//-------------- VBO Handlers --------------
//------------------------------------------

  /**
   * Adds a buffer
   * @param {object} [opts] - buffer's options
   * @param {string} name - buffer's name
   */
  addBuffer(opts, name) {
    let buffer = new nWGL.buffer(this, opts);
    this.buffers[name] = buffer;

    return buffer;
  }

//---------------------------------------------
//-------------- Shader Handlers --------------
//---------------------------------------------

  /**
   * Adds a shader
   * @param {string} filepath - shader's filepath
   * @param {boolean} isVert - is a Vertex Shader?
   * @param {string} name - shader's name?
   */
  addShader(filepath, isVert, name) {
    console.log("⮚ %cAdding (" + name + ") shader.....", "color:#00e6e6");

    let shader = new nWGL.shader(this.gl, {
      "isVert": isVert,
      "string": nWGL.parseShader(filepath)
    });
    this.shaders[name] = shader;

    return shader;
  }

  /**
   * Adds a shader
   * @param {string} source - shader's source
   * @param {boolean} isVert - is a Vertex Shader?
   * @param {string} name - shader's name?
   */
  addShader2(source, isVert, name) {
    console.log("⮚ %cAdding (" + name + ") shader.....", "color:#00e6e6");

    let shader = new nWGL.shader(this.gl, {
      "isVert": isVert,
      "string": source
    });
    this.shaders[name] = shader;

    return shader;
  }

//----------------------------------------------
//-------------- Program Handlers --------------
//----------------------------------------------

  /**
   * Adds a program
   * @param {nWGL.shader[] || string[]} shaders - program's shaders
   * @param {string} name - program's name
   */
  addProgram(shaders, name) {
    if(Array.isArray(shaders))
      for(let i = 0; i < shaders.length; ++i) 
        if(typeof shaders[i] == "string")  
          shaders[i] = this.shaders[shaders[i]];

    let program = new nWGL.program(this, shaders);
    this.programs[name] = program;

    this.program = name;

    console.log("⮚ %cAdding (" + name + ") program.....", "color:#00e600");

    if (program.addUniform("u_resolution", "2f")) {
      program.setUniform("u_resolution", this.canvas.width, this.canvas.height);
    }

    if (program.addUniform("u_time", "1f")) {
      program.setUniform("u_time", 0.0);
    }

    if (program.addUniform("u_mouse", "2f")) {
      program.setUniform("u_mouse", this.mouse.x, this.mouse.y);
    }

    if (program.addUniform("u_frame", "1ui")) {
      program.setUniform("u_frame", 0);
    }

    return program;
  }

  addCopyShaderProgram(){
    return addProgram([
      addShader2(`
        #version 300 es

        precision highp float;
        
        layout(location = 0) in vec2 a_position;
        
        void main(void) {
            gl_Position.xy = a_position;
        }
      `, true, "copy_vertex_shader"), 
      addShader2(`
        #version 300 es

        precision highp float;

        layout(location = 0) out highp vec4 FragColor;
        
        uniform sampler2D u_tex;
              
        void main() {
          FragColor = texelFetch( u_tex, ivec2(gl_FragCoord.xy), 0 );
        }
      `, false, "copy_fragment_shader")
    ], "copyShaderProgram");
  }

  /**
   * Set uniform of a specific program
   * @param {string} - uniform's name 
   * @param {float[]} data - data to pass to the uniform
   * @param {string|nWGL.program} - program 
   */
  uniform(name, data, prog) {
    if (prog) {
      if (typeof prog === "string") {
        this.programs[prog].setUniform(name, data);
      } else if (prog instanceof nWGL.program) {
        this.program = prog;
        this.activeProgram.setUniform(name, data);
      }
    } else {
      this.activeProgram.setUniform(name, data);
    }
  }

  /**
   * Release active program
   */
  releaseProgram() {
    this.activeProgram = null;
    this.gl.useProgram(this.activeProgram);
  }

//------------------------------------------
//-------------- FBO Handlers --------------
//------------------------------------------

  /**
   * Adds a framebuffer
   * @param {object} [opts] - framebuffer's options
   * @param {string} name - framebuffer's name
   */
  addFrameBuffer(opts, name) {
    console.log("⮚ %cAdding (" + name + ") framebuffer.....", "color:#661aff");
    
    this.framebuffers[name] = new nWGL.framebuffer(this, opts);
    this.fbo_names.push(name);

    return this.framebuffers[name];
  }

  /**
   * Get framebuffer
   * @param {number | string} index - framebuffer's index
   */
  getFrameBuffer(index){
    switch(typeof index){
      case "number":
        return this.framebuffers[this.fbo_names[index]] || null;
      case "string":
        return this.framebuffers[index] || null;
      default:
        return null;
    }
  }

  /**
   * Binds given framebuffer to target
   * @param {WebGLFramebuffer} framebuffer - framebuffer
   * @param {string} [target="DRAW_FRAMEBUFFER"] - binding point(target)   
   */
  bindFramebuffer(framebuffer, target) {
    this.gl.bindFramebuffer(this.gl[target || "DRAW_FRAMEBUFFER"], framebuffer);
  }

//-----------------------------------------------
//-------------- Mouse Pos Handler --------------
//-----------------------------------------------

  /**
   * Gets the real mouse position in canvas and passes it
   * to the assigned uniform
   */
  setMouse() {
    let rect = this.canvas.getBoundingClientRect();
    let mouse = this.mouse;

    if (mouse &&
      mouse.x && mouse.x >= rect.left && mouse.x <= rect.right &&
      mouse.y && mouse.y >= rect.top && mouse.y <= rect.bottom) {
      this.activeProgram.setUniform("u_mouse", mouse.x - rect.left, this.canvas.height - (mouse.y - rect.top))
    }
  }

//--------------------------------------------
//-------------- Draw functions --------------
//--------------------------------------------

  /**
   * Render function
   * @param {string} [mode="TRIANGLES"] - render mode
   */
  draw(mode) {
    let gl = this.gl;
    ++this.frame;

    if (this.activeProgram.uniforms["u_time"]) {
      this.activeProgram.setUniform("u_time", performance.now() - this.loadTime);
    }

    if (this.activeProgram.uniforms["u_mouse"]) {
      this.setMouse();
    }

    if (this.activeProgram.uniforms["u_frame"]) {
      this.activeProgram.setUniform("u_frame", this.frame);
    }

    gl.drawArrays(this.gl[mode || "TRIANGLES"], 0, 6);
  }

  /**
   * Magic!
   * @param {nWGL.pass[]} calls - draw callback functions
   */
  m_draw(...calls) {
    for (const call of calls) 
      call.render();
    ++this.frame;
  }

//------------ Program Getter/Setter ------------
  get program() { return this.activeProgram; }

  set program(prog) {
    if(typeof prog === "string" && this.programs[prog]) prog = this.programs[prog];
    else if(!(prog instanceof nWGL.program)) return console.error("oops, you gotta give the name of a program!");

    this.activeProgram = prog;
    this.gl.useProgram(this.activeProgram.program);
  }
};
