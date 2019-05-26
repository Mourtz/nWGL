/**
 * @author Alex Mourtziapis <alex.mourtziapis@gmail.com>
 */

'use strict';

/**
 * nWGL namespace
 * @namespace
 */
var nWGL = nWGL || {};

// total instances of nWGL.main
nWGL["__T_CLONES__"] = 0;

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

// taken from https://webgl2fundamentals.org/
nWGL.helper = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    let rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    let a00 = a[0 * 4 + 0];
    let a01 = a[0 * 4 + 1];
    let a02 = a[0 * 4 + 2];
    let a03 = a[0 * 4 + 3];
    let a10 = a[1 * 4 + 0];
    let a11 = a[1 * 4 + 1];
    let a12 = a[1 * 4 + 2];
    let a13 = a[1 * 4 + 3];
    let a20 = a[2 * 4 + 0];
    let a21 = a[2 * 4 + 1];
    let a22 = a[2 * 4 + 2];
    let a23 = a[2 * 4 + 3];
    let a30 = a[3 * 4 + 0];
    let a31 = a[3 * 4 + 1];
    let a32 = a[3 * 4 + 2];
    let a33 = a[3 * 4 + 3];
    let b00 = b[0 * 4 + 0];
    let b01 = b[0 * 4 + 1];
    let b02 = b[0 * 4 + 2];
    let b03 = b[0 * 4 + 3];
    let b10 = b[1 * 4 + 0];
    let b11 = b[1 * 4 + 1];
    let b12 = b[1 * 4 + 2];
    let b13 = b[1 * 4 + 3];
    let b20 = b[2 * 4 + 0];
    let b21 = b[2 * 4 + 1];
    let b22 = b[2 * 4 + 2];
    let b23 = b[2 * 4 + 3];
    let b30 = b[3 * 4 + 0];
    let b31 = b[3 * 4 + 1];
    let b32 = b[3 * 4 + 2];
    let b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse: function(m) {
    let m00 = m[0 * 4 + 0];
    let m01 = m[0 * 4 + 1];
    let m02 = m[0 * 4 + 2];
    let m03 = m[0 * 4 + 3];
    let m10 = m[1 * 4 + 0];
    let m11 = m[1 * 4 + 1];
    let m12 = m[1 * 4 + 2];
    let m13 = m[1 * 4 + 3];
    let m20 = m[2 * 4 + 0];
    let m21 = m[2 * 4 + 1];
    let m22 = m[2 * 4 + 2];
    let m23 = m[2 * 4 + 3];
    let m30 = m[3 * 4 + 0];
    let m31 = m[3 * 4 + 1];
    let m32 = m[3 * 4 + 2];
    let m33 = m[3 * 4 + 3];
    let tmp_0  = m22 * m33;
    let tmp_1  = m32 * m23;
    let tmp_2  = m12 * m33;
    let tmp_3  = m32 * m13;
    let tmp_4  = m12 * m23;
    let tmp_5  = m22 * m13;
    let tmp_6  = m02 * m33;
    let tmp_7  = m32 * m03;
    let tmp_8  = m02 * m23;
    let tmp_9  = m22 * m03;
    let tmp_10 = m02 * m13;
    let tmp_11 = m12 * m03;
    let tmp_12 = m20 * m31;
    let tmp_13 = m30 * m21;
    let tmp_14 = m10 * m31;
    let tmp_15 = m30 * m11;
    let tmp_16 = m10 * m21;
    let tmp_17 = m20 * m11;
    let tmp_18 = m00 * m31;
    let tmp_19 = m30 * m01;
    let tmp_20 = m00 * m21;
    let tmp_21 = m20 * m01;
    let tmp_22 = m00 * m11;
    let tmp_23 = m10 * m01;

    let t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    let t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    let t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    let t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
            (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
            (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
            (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
            (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
            (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
            (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
            (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
            (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
            (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
            (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
            (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
            (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
    ];
  },

cross: function(a, b) {
    return [
       a[1] * b[2] - a[2] * b[1],
       a[2] * b[0] - a[0] * b[2],
       a[0] * b[1] - a[1] * b[0],
    ];
  },

  subtractVectors: function(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },

  normalize: function(v) {
    let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },

  lookAt: function(cameraPosition, target, up) {
    let zAxis = m4.normalize(
        m4.subtractVectors(cameraPosition, target));
    let xAxis = m4.normalize(m4.cross(up, zAxis));
    let yAxis = m4.normalize(m4.cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },

  transformVector: function(m, v) {
    let dst = [];
    for (let i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  }
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
        this.dataType = Uint16Array;

        this.format = gl.RGB;
        this.type = gl.HALF_FLOAT;
        this.nWGL.enableFloatEXT();
        break;

      // RGBA float16_t
      case gl.RGBA16F:
        this.colorChannels = 4;
        this.dataType = Uint16Array;

        this.format = gl.RGBA;
        this.type = gl.HALF_FLOAT;
        this.nWGL.enableFloatEXT();
        break;

      //------------------------------------------

      // RGB float32_t
      case gl.RGB32F:
        this.colorChannels = 3;
        this.dataType = Float32Array;

        this.format = gl.RGB;
        this.type = gl.FLOAT;
        this.nWGL.enableFloatEXT();
        break;

      // RGBA float32_t
      case gl.RGBA32F:
        this.colorChannels = 4;
        this.dataType = Float32Array;

        this.format = gl.RGBA;
        this.type = gl.FLOAT;
        this.nWGL.enableFloatEXT();
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
    if (tex instanceof nWGL.texture) {
      let temp = {};
      Object.assign(temp, this);
      Object.assign(this, tex);
      Object.assign(tex, temp);
    } else if (this.nWGL.gl.isTexture(tex)) {
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

  /**
   * Clone Texture
   */
  clone(){
    return Object.assign(Object.create(this), this);
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

  /**
   * Deletes WebGLTexture
   */
  delete() {
    this.nWGL.gl.deleteTexture(this.texture);
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
  compile(source) {
    let gl = this.gl;

    // mark previous shader for deletion
    if (source && this.source && this.shader) gl.deleteShader(this.shader);

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
  initProgram(shaders) {
    let gl = this.nWGL.gl;

    this.shaders = shaders || this.shaders;

    let program = gl.createProgram();
    for (let i = 0; i < this.shaders.length; i++) {
      if (!Array.isArray(this.shaders) || !this.shaders[i] || !(this.shaders[i] instanceof nWGL.shader) || !gl.isShader(this.shaders[i].shader)) throw "something went wrong fella!";
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

      if (data.length > 0) this.setUniform(name, data);
      return true;
    }

    // dont show warnings for default uniforms
    if (!(name == "u_resolution" || name == "u_time" || name == "u_mouse" || name == "u_frame")) console.warn("Couldn't find '" + name + "' uniform!");

    return false;
  }

  /**
   * Sets a value to the uniform with the name you have given
   * @param {string} name - uniform's name
   * @param {float[]} data - data to pass to the uniform
   */
  setUniform(name, ...data) {
    let gl = this.nWGL.gl;

    if (this.uniformsLocation[name])
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
    if (!tex || !name) return;

    pos = pos || this.textureIndex[name] || 0;
    this.nWGL.bounded_textures[pos] = tex;

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
  refitTextures(textures) {
    let names = Object.keys(this.textureIndex);
    for (let name in names) {
      this.setTexture(name, textures[name].tex);
    }
  }

  /**
   * Delete WebGLProgram
   */
  delete(){
    this.nWGL.gl.deleteProgram(this.program);
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
   * Bind buffer
   */
  bind(){
    this.nWGL.gl.bindBuffer(this.target, this.buffer);
  }

  /**
   * Clone buffer
   */
  clone(){
    return Object.assign(Object.create(this), this);
  }

  /**
   * Delete buffer
   */
  delete() {
    this.nWGL.gl.deleteBuffer(this.buffer);
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
      if (Array.isArray(opts.internalformat)) {
        this.textures[i] = new nWGL.texture(this.nWGL, { "internalformat": opts.internalformat[Math.min(i, opts.internalformat.length - 1)] });
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

    if (gl.isTexture(tex))
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
  constructor(nWGL, opts) {
    /** local references */
    this.nWGL = nWGL;

    /** variables */
    /** @member {function[]} */
    this.call = null;
    /** @member {boolean[]} [opts.swapBuffer=false] - needsSwap */
    this.swapBuffer = opts.swapBuffer || false;
    /** @member {string} [opts.mode="TRIANGLES"] - render mode */
    this.mode = opts.mode || "TRIANGLES";
  }

  remove(){
    let pos = this.composer.passes.indexOf(this);
    if(pos !== -1)
      delete this.composer.passes.splice(pos, 1);
  }
};

/** nWGL renderPass */
nWGL.renderPass = class extends nWGL.pass{
  constructor(nWGL, opts){
    super(nWGL, opts);
    this.call = opts.render;
  }

  render() {
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
}

/** nWGL computePass */
nWGL.computePass = class extends nWGL.pass{
  constructor(nWGL, opts){
    super(nWGL, opts);
    this.call = opts.compute;
  }

  render() {
    // execute callback function
    this.call();
  }
}

/**
 * nWGL composer
 */
nWGL.composer = class {
  constructor(nWGL){
    /** local references */
    this.nWGL = nWGL;

    this.readBuffer = nWGL.readBuffer;
    this.writeBuffer = nWGL.writeBuffer;

    /** @member {nWGL.pass[]} */
    this.passes = [];
  }

  /**
   * Adds a pass
   * @param {nWGL.pass | Function} [pass] - buffer's options
   */
  addPass(...pass) {
    for(let i = 0; i < pass.length; ++i){
      if(pass[i] instanceof nWGL.pass){
        this.passes.push(pass[i]);
      }
      else {
        if(!(pass[i] instanceof Object) || !(pass[i].compute || pass[i].render))
          throw 'unknown pass type!';

        this.passes.push(pass[i].compute ? new nWGL.computePass(this.nWGL, pass[i]) : new nWGL.renderPass(this.nWGL, pass[i]));
      }
    }
  }

  render(){
    for (const pass of this.passes){
      pass.render();

      if(pass.swapBuffer){
        let temp = readBuffer;
        readBuffer = writeBuffer;
        writeBuffer = temp;
      }
    }
  }

  get empty(){
    return (this.passes.length === 0);
  }
};

//-----------------------------------------------------------------------
//-------------------------------- MAIN ---------------------------------
//-----------------------------------------------------------------------

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
    this.FP_SUPP = false; 
    if (opts.enableFloatEXT) {
      this.enableFloatEXT();
    }

    /** @member {number} */
    this.loadTime = performance.now();

    /** @member {object} */
    this.textures = {};
    /** @member {object} */
    this.bounded_textures = {};
    for (let i = 0; i < 16; ++i) this.bounded_textures[i] = null;
    if (Object.seal) Object.seal(this.bounded_textures);

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
    /** @member {nWGL.program} */
    this.activeProgram = null;
    /** @member {number} */
    this.frame = 0;
    /** @member {nWGL.composer} */
    this.composer = new nWGL.composer(this);

    // vbo
    let quad_verts = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]); 
    this.addBuffer({ "data": quad_verts }, "quad_vbo");

    gl.enableVertexAttribArray(0);
    // this.buffers["quad_vbo"].bind(); // already bound
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
    
    this.swapBuffer = opts.swapBuffer;
    if(this.swapBuffer){
      this.addFrameBuffer({ "internalformat": "RGBA32F" }, "readBuffer");
      this.addFrameBuffer({ "internalformat": "RGBA32F" }, "writeBuffer");
    }

    console.log("Initialized sandbox No." + (++nWGL.__T_CLONES__));
  }

  enableFloatEXT(){
    if(this.FP_SUPP) return;
    
    let extensions = Object.values(this.gl.getSupportedExtensions());

    console.log("%c👍 %cEnabling float etensions...", "color:#ff0000", "color:#121212");
    if(extensions.includes("EXT_color_buffer_float"))
      this.gl.getExtension('EXT_color_buffer_float');
    else
      console.warn('"EXT_color_buffer_float" could not be detected! Check your browser\'s flag' );
    
    if(extensions.includes("EXT_color_buffer_float"))
      this.gl.getExtension('OES_texture_float_linear');
    else
      console.warn('"OES_texture_float_linear" could not be detected! Check your browser\'s flag' );

    this.FP_SUPP = true;
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

  /**
   * Delete texture
   * @param {string} name - texture's name
   */
  deleteTexture(name){
    this.textures[name].delete();
    delete this.textures[name];
  }

  /**
   * Adds a cubemap texture
   * @param {object} opts - cubemap's options
   * @param {string} name - cubemap's name 
   */
  addCubemap(opts, name) {
    let tex = new nWGL.cubemap(this, opts);
    this.cubemap_textures[name] = tex;

    return tex;
  }

  /**
   * delete cubemap
   * @param {string} name - cubemap's name 
   */
  deleteCubemap(name) {
    this.cubemap_textures[name].delete();
    delete this.cubemap_textures[name];
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

  //------------------------------------------
  //-------------- Pass Handlers --------------
  //------------------------------------------

  /**
   * Adds a pass
   * @param {nWGL.pass | Function[]} [opts] - buffer's options
   */
  addPass(pass) {
    this.composer.addPass(pass);
  }

  //---------------------------------------------
  //-------------- Shader Handlers --------------
  //---------------------------------------------

  /**
   * Adds a shader
   * @param {string} filepath - shader's filepath
   * @param {string} name - shader's name?
   * @param {boolean} [isVert = false] - is a Vertex Shader?
   */
  addShader(filepath, name, isVert) {
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
    if (Array.isArray(shaders))
      for (let i = 0; i < shaders.length; ++i)
        if (typeof shaders[i] == "string")
          if(this.shaders[shaders[i]])
            shaders[i] = this.shaders[shaders[i]];
          else
            throw (shaders[i] + "doesnt exist!!!");

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

  addCopyShaderProgram() {
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
   * Sets/Adds a texture at a given position in active program
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

  /**
   * Release active program
   */
  releaseActiveProgram() {
    this.activeProgram = null;
    this.gl.useProgram(this.activeProgram);
  }

  /**
   * Delete program
   * @param {string} name - program's name
   */
  deleteProgram(name){
    this.programs[name].delete();
    delete this.programs[name] ;
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
    return (this.framebuffers[name] = new nWGL.framebuffer(this, opts));
  }

  /**
   * Get framebuffer
   * @param {number | string} index - framebuffer's index
   */
  getFrameBuffer(index) {
    switch (typeof index) {
      case "number":
        return this.framebuffers[ Object.keys(this.framebuffers)[index] ] || null;
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
    ++this.frame;

    if(!this.composer.empty){
      this.composer.render();    
    } else {
      if (this.activeProgram.uniforms["u_time"]) {
        this.activeProgram.setUniform("u_time", performance.now() - this.loadTime);
      }
  
      if (this.activeProgram.uniforms["u_mouse"]) {
        this.setMouse();
      }
  
      if (this.activeProgram.uniforms["u_frame"]) {
        this.activeProgram.setUniform("u_frame", this.frame);
      }
  
      this.gl.drawArrays(this.gl[mode || "TRIANGLES"], 0, 6);
    }

    if(this.swapBuffer){
      // swap buffers
      let temp = this.framebuffers["readBuffer"];
      this.framebuffers["readBuffer"] = this.framebuffers["writeBuffer"];
      this.framebuffers["writeBuffer"] = temp;
    }
  }

  //------------ Program Getter/Setter ------------
  get program() { return this.activeProgram; }

  set program(prog) {
    if (typeof prog === "string" && this.programs[prog]) prog = this.programs[prog];
    else if (!(prog instanceof nWGL.program)) return console.error("oops, you gotta give the name of a program!");

    this.activeProgram = prog;
    this.gl.useProgram(this.activeProgram.program);
  }
};
