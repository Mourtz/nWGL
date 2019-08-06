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

nWGL.loadOBJ = function(filepath){
  let lines = nWGL.getTextFromFile(filepath).split("\n");
  
  // vertices / uv / normals
  let faces = [[], [], []];
  // w padding
  let vertices = [0,0,0];
  let normals = [0,0,0];
  let uvs = [0,0,0];

  
  for(const line of lines){
    // skip comments and empty lines
    if(line.length === 0 || line[0] === '#'){
      continue;
    }

    let atts = line.slice(2).trim().split(" ");

    if(line[0] === 'v'){
      for(const att of atts){
        if(line[1] === 'n'){
          normals.push(att);
        } 
        else if(line[1] === 't'){
          uvs.push(att);
        } 
        else if(line[1] === ' '){
          vertices.push(att);
        }
      }
    } else if(line[0] === 'f'){
      if(atts.length === 4){
        console.error("there's no support for quads yet!");
      } else {
        for(const face of atts){
          let val = face.split("/");

          for(let i = 0; i < val.length; ++i){
            // if its not empty
            if(val[i].length > 0)
              faces[i].push(val[i]);
          }
        }
      }
    }
  }

  faces[0] = new Uint16Array(faces[0]);
  faces[1] = new Uint16Array(faces[1]);
  faces[2] = new Uint16Array(faces[2]);

  vertices = new Float32Array(vertices);
  normals = new Float32Array(normals);
  uvs = new Float32Array(uvs);

  // if it has indices
  if(faces[0].length > 0){
    let new_normals = new Float32Array(vertices.length);
    for(let i = 0; i < faces[0].length; ++i){
      const vI = faces[0][i]*3;
      const nI = faces[2][i]*3;
      new_normals[vI+0] = normals[nI+0];
      new_normals[vI+1] = normals[nI+1];
      new_normals[vI+2] = normals[nI+2];
    }
    normals = new_normals;
  }

  return {
    "faces": faces,
    "vertices": vertices,
    "normals": normals,
    "uv": uvs
  };
}

// taken from https://webgl2fundamentals.org/
nWGL.helper = {
  /**
   * Computes a 4-by-4 perspective transformation matrix given the angular height
   * of the frustum, the aspect ratio, and the near and far clipping planes.  The
   * arguments define a frustum extending in the negative z direction.  The given
   * angle is the vertical angle of the frustum, and the horizontal angle is
   * determined to produce the given aspect ratio.  The arguments near and far are
   * the distances to the near and far clipping planes.  Note that near and far
   * are not z coordinates, but rather they are distances along the negative
   * z-axis.  The matrix generated sends the viewing frustum to the unit box.
   * We assume a unit box extending from -1 to 1 in the x and y dimensions and
   * from -1 to 1 in the z dimension.
   * @param {number} fieldOfViewInRadians field of view in y axis.
   * @param {number} aspect aspect of viewport (width / height)
   * @param {number} near near Z clipping plane
   * @param {number} far far Z clipping plane
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  perspective: function(fieldOfViewInRadians, aspect, near, far, dst) {
    dst = dst || new Float32Array(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    const rangeInv = 1.0 / (near - far);

    dst[ 0] = f / aspect;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = f;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = (near + far) * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far * rangeInv * 2;
    dst[15] = 0;

    return dst;
  },

  /**
   * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
   * planes defining the axis-aligned, box-shaped viewing volume.  The matrix
   * generated sends that box to the unit box.  Note that although left and right
   * are x coordinates and bottom and top are y coordinates, near and far
   * are not z coordinates, but rather they are distances along the negative
   * z-axis.  We assume a unit box extending from -1 to 1 in the x and y
   * dimensions and from -1 to 1 in the z dimension.
   * @param {number} left The x coordinate of the left plane of the box.
   * @param {number} right The x coordinate of the right plane of the box.
   * @param {number} bottom The y coordinate of the bottom plane of the box.
   * @param {number} top The y coordinate of the right plane of the box.
   * @param {number} near The negative z coordinate of the near plane of the box.
   * @param {number} far The negative z coordinate of the far plane of the box.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  orthographic: function(left, right, bottom, top, near, far, dst) {
    dst = dst || new Float32Array(16);

    dst[ 0] = 2 / (right - left);
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 2 / (top - bottom);
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = 2 / (far - near);
    dst[11] = 0;
    dst[12] = (left + right) / (left - right);
    dst[13] = (bottom + top) / (bottom - top);
    dst[14] = (near + far) / (near - far);
    dst[15] = 1;

    return dst;
  },

//-------------------------------------------------------

  /**
   * Mutliply by translation matrix.
   * @param {Matrix4} m matrix to multiply
   * @param {number} tx x translation.
   * @param {number} ty y translation.
   * @param {number} tz z translation.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  translate: function(m, tx, ty, tz, dst) {
    // This is the optimized version of
    // return multiply(m, translation(tx, ty, tz), dst);
    dst = dst || new Float32Array(16);

    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];

    if (m !== dst) {
      dst[ 0] = m00;
      dst[ 1] = m01;
      dst[ 2] = m02;
      dst[ 3] = m03;
      dst[ 4] = m10;
      dst[ 5] = m11;
      dst[ 6] = m12;
      dst[ 7] = m13;
      dst[ 8] = m20;
      dst[ 9] = m21;
      dst[10] = m22;
      dst[11] = m23;
    }

    dst[12] = m00 * tx + m10 * ty + m20 * tz + m30;
    dst[13] = m01 * tx + m11 * ty + m21 * tz + m31;
    dst[14] = m02 * tx + m12 * ty + m22 * tz + m32;
    dst[15] = m03 * tx + m13 * ty + m23 * tz + m33;

    return dst;
  },

//-------------------------------------------------------

  /**
   * Multiply by an x rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  xRotate: function(m, angleInRadians, dst) {
    // this is the optimized version of
    // return multiply(m, xRotation(angleInRadians), dst);
    dst = dst || new Float32Array(16);

    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    dst[4]  = c * m10 + s * m20;
    dst[5]  = c * m11 + s * m21;
    dst[6]  = c * m12 + s * m22;
    dst[7]  = c * m13 + s * m23;
    dst[8]  = c * m20 - s * m10;
    dst[9]  = c * m21 - s * m11;
    dst[10] = c * m22 - s * m12;
    dst[11] = c * m23 - s * m13;

    if (m !== dst) {
      dst[ 0] = m[ 0];
      dst[ 1] = m[ 1];
      dst[ 2] = m[ 2];
      dst[ 3] = m[ 3];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  },

  /**
   * Multiply by an y rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  yRotate: function(m, angleInRadians, dst) {
    // this is the optimized verison of
    // return multiply(m, yRotation(angleInRadians), dst);
    dst = dst || new Float32Array(16);

    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    dst[ 0] = c * m00 - s * m20;
    dst[ 1] = c * m01 - s * m21;
    dst[ 2] = c * m02 - s * m22;
    dst[ 3] = c * m03 - s * m23;
    dst[ 8] = c * m20 + s * m00;
    dst[ 9] = c * m21 + s * m01;
    dst[10] = c * m22 + s * m02;
    dst[11] = c * m23 + s * m03;

    if (m !== dst) {
      dst[ 4] = m[ 4];
      dst[ 5] = m[ 5];
      dst[ 6] = m[ 6];
      dst[ 7] = m[ 7];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  },

  /**
   * Multiply by an z rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  zRotate: function(m, angleInRadians, dst) {
    // This is the optimized verison of
    // return multiply(m, zRotation(angleInRadians), dst);
    dst = dst || new Float32Array(16);

    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    dst[ 0] = c * m00 + s * m10;
    dst[ 1] = c * m01 + s * m11;
    dst[ 2] = c * m02 + s * m12;
    dst[ 3] = c * m03 + s * m13;
    dst[ 4] = c * m10 - s * m00;
    dst[ 5] = c * m11 - s * m01;
    dst[ 6] = c * m12 - s * m02;
    dst[ 7] = c * m13 - s * m03;

    if (m !== dst) {
      dst[ 8] = m[ 8];
      dst[ 9] = m[ 9];
      dst[10] = m[10];
      dst[11] = m[11];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  },

  /**
   * Multiply by an axis rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {Vector3} axis axis to rotate around
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  axisRotate: function(m, axis, angleInRadians, dst) {
    // This is the optimized verison of
    // return multiply(m, axisRotation(axis, angleInRadians), dst);
    dst = dst || new Float32Array(16);

    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;

    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;

    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];

    dst[ 0] = r00 * m00 + r01 * m10 + r02 * m20;
    dst[ 1] = r00 * m01 + r01 * m11 + r02 * m21;
    dst[ 2] = r00 * m02 + r01 * m12 + r02 * m22;
    dst[ 3] = r00 * m03 + r01 * m13 + r02 * m23;
    dst[ 4] = r10 * m00 + r11 * m10 + r12 * m20;
    dst[ 5] = r10 * m01 + r11 * m11 + r12 * m21;
    dst[ 6] = r10 * m02 + r11 * m12 + r12 * m22;
    dst[ 7] = r10 * m03 + r11 * m13 + r12 * m23;
    dst[ 8] = r20 * m00 + r21 * m10 + r22 * m20;
    dst[ 9] = r20 * m01 + r21 * m11 + r22 * m21;
    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;

    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  },

//-------------------------------------------------------

  /**
   * Multiply by a scaling matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} sx x scale.
   * @param {number} sy y scale.
   * @param {number} sz z scale.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  scale: function(m, sx, sy, sz, dst) {
    // This is the optimized verison of
    // return multiply(m, scaling(sx, sy, sz), dst);
    dst = dst || new Float32Array(16);

    dst[ 0] = sx * m[0 * 4 + 0];
    dst[ 1] = sx * m[0 * 4 + 1];
    dst[ 2] = sx * m[0 * 4 + 2];
    dst[ 3] = sx * m[0 * 4 + 3];
    dst[ 4] = sy * m[1 * 4 + 0];
    dst[ 5] = sy * m[1 * 4 + 1];
    dst[ 6] = sy * m[1 * 4 + 2];
    dst[ 7] = sy * m[1 * 4 + 3];
    dst[ 8] = sz * m[2 * 4 + 0];
    dst[ 9] = sz * m[2 * 4 + 1];
    dst[10] = sz * m[2 * 4 + 2];
    dst[11] = sz * m[2 * 4 + 3];

    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  },

//-------------------------------------------------------

  radToDeg: function(r) {
    return r * 180 / Math.PI;
  },
  
  degToRad: function(d) {
    return d * Math.PI / 180;
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
      if(this.uniforms[name].includes("Matrix")){
        gl["uniform" + this.uniforms[name]](this.uniformsLocation[name], false, data[0][0]);
      } else {
        gl["uniform" + this.uniforms[name]](this.uniformsLocation[name], data);
      }
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
   * @param {string} [opts.target = "ARRAY_BUFFER"] - buffer's binding point
   * @param {string} [opts.usage = "STATIC_DRAW"] - usage pattern of the data store
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
    this.target = gl[opts.target || "ARRAY_BUFFER"];
    /** @member {GLenum} */
    this.usage = gl[opts.usage || "STATIC_DRAW"];

    if (opts.data) {
      this.data(opts.data);
    }
  }

  /**
   * Store data in the buffer
   * @param {number} opts.index - attribute's index number
   * @param {number} [opts.size = this.size || 2]
   * @param {GLenum} [opts.type = gl[this.type] || gl["FLOAT"]]
   * @param {boolean} [opts.normalized = this.normalized || false]
   * @param {number} [opts.stride = this.stride || 0]
   * @param {number} [opts.offset = this.offset || 0]
   * @param {boolean} [opts.divisor]
   */
  enableVertexAttribArray(opts) {
    let gl = this.nWGL.gl;

    if(opts.index === undefined) console.error("an index has to be provided!");

    /** @member {GLint} */
    this.size = opts.size || this.size || 2;
    /** @member {GLenum} */
    this.type = gl[opts.type] || gl[this.type] || gl["FLOAT"];
    /** @member {GLboolean} */
    this.normalized = opts.normalized || this.normalized || false;
    /** @member {GLsizei} */
    this.stride = opts.stride || this.stride || 0;
    /** @member {GLintptr} */
    this.offset = opts.offset || this.offset || 0;
    

    gl.enableVertexAttribArray(opts.index);
    this.bind();
    gl.vertexAttribPointer(opts.index, this.size, this.type, this.normalized, this.stride, this.offset);
    if(opts.divisor){
      gl.vertexAttribDivisor(opts.index, opts.divisor);
    }
  }

  /**
   * 
   * @param {ArrayBuffer} [data]  - buffer's data
   * @param {string} [target] - buffer's binding point
   * @param {string} [usage] - usage pattern of the data store
   */
  data(data, target, usage){
    this.target = this.nWGL.gl[target] || this.target;
    this.usage = this.nWGL.gl[usage] || this.usage;

    this.nWGL.gl.bindBuffer(this.target, this.buffer);
    this.nWGL.gl.bufferData(this.target, data, this.usage);
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

  render(vert_count) {
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

    this.nWGL.gl.drawArrays(this.nWGL.gl[this.mode || "TRIANGLES"], 0, vert_count || 6);
  }
}

/** nWGL computePass */
nWGL.computePass = class extends nWGL.pass{
  constructor(nWGL, opts){
    super(nWGL, opts);
    this.call = opts.compute;
  }

  render(vert_count) {
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

  render(vert_count){
    for (const pass of this.passes){
      pass.render(vert_count);

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

    if(!opts.disable_quad_vbo){
      // vbo
      let quad_verts = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]); 
      this.addBuffer({ "data": quad_verts, "index": 0, "size": 2 }, "quad_vbo");
    }

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
    console.log("⮚ %cAdding (" + name + ") buffer.....", "color:#85e600");

    let buffer = new nWGL.buffer(this, opts);
    this.buffers[name] = buffer;

    return buffer;
  }

  /**
   * Deletes
   * @param {string} name - buffer's name
   */
  deleteBuffer(name){
    if(name in this.buffers){
      console.log("⮚ %cDeleting (" + name + ") buffer.....", "color:#eb4034");

      this.buffers[name].delete();
      delete this.buffers[name];
    }
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
   * @param {number} [vertices=6] - total vertices
   * @param {number} [instances] - instances of the mesh
   */
  draw(mode, vertices, elements, instances) {
    ++this.frame;

    if(!this.composer.empty){
      this.composer.render(vertices);    
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
  
      if(elements){
        if(instances)
          this.gl.drawElementsInstanced(this.gl[mode || "TRIANGLES"], vertices || 6, this.gl.UNSIGNED_SHORT, 0, instances);
        else
          this.gl.drawElements(this.gl[mode || "TRIANGLES"], vertices || 6, this.gl.UNSIGNED_SHORT, 0);
      } else {
        if(instances)
          this.gl.drawArraysInstanced(this.gl[mode || "TRIANGLES"], 0, vertices || 6, instances);
        else
          this.gl.drawArrays(this.gl[mode || "TRIANGLES"], 0, vertices || 6);
      }
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
