


export default class oSimplex {

  constructor() {
    this.perm;
    this.permGradIndex3D;
    this.setup3D();
  }
  
  // LCG based gen...
  seed(seed) {
    seed = seed || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    let lcg = (function () {
      let m = 4294967296;
      let a = 1664525;
      let c = 1013904223;
      let seed, z;

      return {
        setSeed: function (val) {
          z = seed = (val == null ? Math.random() * m : val) >>> 0;
        },
        getSeed: function () {
          return seed;
        },
        rand: function () {
          z = (a * z + c) % m;
          return z / m;
        }
      }

    })();

    lcg.setSeed(seed);
    this.perm = new Array(256);
    this.permGradIndex3D = new Array(256);

    let source = new Array(256);
    for (let i = 0; i < 256; i++) { source[i] = i };

    for (let i = 255; i >= 0; i--) {

      let r = Math.floor(lcg.rand()*Number.MAX_SAFE_INTEGER) % (i + 1);

      this.perm[i] = source[r];
      this.permGradIndex3D[i] = (this.perm[i] % (this.gradients3D.length / 3)) * 3;
      source[r] = source[i];
    }

  };

  setup2D() {
    this.NORM_2D = 47;
    this.STRETCH_2D = -0.211324865405187;    //(1/Math.sqrt(2+1)-1)/2;
    this.SQUISH_2D = 0.366025403784439;      //(Math.sqrt(2+1)-1)/2;

    this.gradients2D = [
       5,  2,    2,  5,
      -5,  2,   -2,  5,
       5, -2,    2, -5,
      -5, -2,   -2, -5 
    ]

  }

  setup3D() {
    this.NORM_3D = 103;
    this.STRETCH_3D = -1.0 / 6;              //(1/Math.sqrt(3+1)-1)/3;
    this.SQUISH_3D = 1.0 / 3;                //(Math.sqrt(3+1)-1)/3;

    this.gradients3D = [
      -11,  4,  4,     -4,  11,  4,    -4,  4,  11,
       11,  4,  4,      4,  11,  4,     4,  4,  11,
      -11, -4,  4,     -4, -11,  4,    -4, -4,  11,
       11, -4,  4,      4, -11,  4,     4, -4,  11,
      -11,  4, -4,     -4,  11, -4,    -4,  4, -11,
       11,  4, -4,      4,  11, -4,     4,  4, -11,
      -11, -4, -4,     -4, -11, -4,    -4, -4, -11,
       11, -4, -4,      4, -11, -4,     4, -4, -11
    ]
  }

  // For the lazy coder...
  noise() {
    if (this.perm === undefined) { this.seed() };

    if (arguments.length === 2) {
      if (this.NORM_2D === undefined) { this.setup2D() };
      return this.noise2D(...arguments);
    }

    if (arguments.length === 3) {
      if (this.NORM_3D === undefined) { this.setup3D() };
      return this.noise3D(...arguments);
    }
  };

  _extrapolate2D(xsb, ysb, dx, dy) {
    let index = this.perm[(this.perm[xsb & 0xFF] + ysb) & 0xFF] & 0x0E;
    return this.gradients2D[index] * dx + this.gradients2D[index + 1] * dy;
  }

  _extrapolate3D(xsb, ysb, zsb, dx, dy, dz) {
		let index = this.permGradIndex3D[(this.perm[(this.perm[xsb & 0xFF] + ysb) & 0xFF] + zsb) & 0xFF];
		return this.gradients3D[index] * dx
      + this.gradients3D[index + 1] * dy
			+ this.gradients3D[index + 2] * dz;
  }

  noise2D(x, y) {
    //Place input coordinates onto grid.
    let stretchOffset = (x + y) * this.STRETCH_2D;
    let xs = x + stretchOffset;
    let ys = y + stretchOffset;

    //Place input coordinates onto grid.
    let xsb = Math.floor(xs);
    let ysb = Math.floor(ys);

    //Skew out to get actual coordinates of rhombus origin. We'll need these later.
    let squishOffset = (xsb + ysb) * this.SQUISH_2D;
    let xb = xsb + squishOffset;
    let yb = ysb + squishOffset;

    //Compute grid coordinates relative to rhombus origin.
    let xins = xs - xsb;
    let yins = ys - ysb;

    //Sum those together to get a value that determines which region we're in.
    let inSum = xins + yins;

    //Position relative to origin point.
    let dx0 = x - xb;
    let dy0 = y - yb;

    //We'll be defining these inside the next block and using them afterwards.
    let dx_ext, dy_ext, xsv_ext, ysv_ext;

    let value = 0;

    //Contribution (1,0)
    let dx1 = dx0 - 1 - this.SQUISH_2D;
    let dy1 = dy0 - this.SQUISH_2D;
    let attn1 = 2 - dx1**2 - dy1**2;
    if (attn1 > 0) {
      value += attn1**4 * this._extrapolate2D(xsb + 1, ysb, dx1, dy1);
    }

    //Contribution (0,1)
    let dx2 = dx0 - this.SQUISH_2D;
    let dy2 = dy0 - 1 - this.SQUISH_2D;
    let attn2 = 2 - dx2**2 - dy2**2;
    if (attn2 > 0) {
      value += attn2**4 * this._extrapolate2D(xsb, ysb + 1, dx2, dy2);
    }

    if (inSum <= 1) { //We're inside the triangle (2-Simplex) at (0,0)
      let zins = 1 - inSum;

      if (zins > xins || zins > yins) { //(0,0) is one of the closest two triangular vertices

        if (xins > yins) {
          xsv_ext = xsb + 1;
          ysv_ext = ysb - 1;
          dx_ext = dx0 - 1;
          dy_ext = dy0 + 1;
        } else {
          xsv_ext = xsb - 1;
          ysv_ext = ysb + 1;
          dx_ext = dx0 + 1;
          dy_ext = dy0 - 1;
        }

      } else { //(1,0) and (0,1) are the closest two vertices.
        xsv_ext = xsb + 1;
        ysv_ext = ysb + 1;
        dx_ext = dx0 - 1 - 2 * this.SQUISH_2D;
        dy_ext = dy0 - 1 - 2 * this.SQUISH_2D;
      }

    } else { //We're inside the triangle (2-Simplex) at (1,1)
      let zins = 2 - inSum;

      if (zins < xins || zins < yins) { //(0,0) is one of the closest two triangular vertices

        if (xins > yins) {
          xsv_ext = xsb + 2;
          ysv_ext = ysb;
          dx_ext = dx0 - 2 - 2 * this.SQUISH_2D;
          dy_ext = dy0 -2 * this.SQUISH_2D;
        } else {
          xsv_ext = xsb;
          ysv_ext = ysb + 2;
          dx_ext = dx0 - 2 * this.SQUISH_2D;
          dy_ext = dy0 - 2 - 2 * this.SQUISH_2D;
        }

      } else { //(1,0) and (0,1) are the closest two vertices.
        dx_ext = dx0;
        dy_ext = dy0;
        xsv_ext = xsb;
        ysv_ext = ysb;
      }

      xsb += 1;
      ysb += 1;
      dx0 = dx0 - 1 - 2 * this.SQUISH_2D;
      dy0 = dy0 - 1 - 2 * this.SQUISH_2D;
    }

    //Contribution (0,0) or (1,1)
    let attn0 = 2 - dx0**2 - dy0**2;
    if (attn0 > 0) {
      value += attn0**4 * this._extrapolate2D(xsb, ysb, dx0, dy0);
    }

    //Extra Vertex
    let attn_ext = 2 - dx_ext**2 - dy_ext**2;
    if (attn_ext > 0) {
      value += attn_ext**4 * this._extrapolate2D(xsv_ext, ysv_ext, dx_ext, dy_ext);
    }

    return value / this.NORM_2D;
  }

  //3D OpenSimplex Noise.
  noise3D(x, y, z) {

    //Place input coordinates on simplectic honeycomb.
    let stretchOffset = (x + y + z) * this.STRETCH_3D;
    let xs = x + stretchOffset;
    let ys = y + stretchOffset;
    let zs = z + stretchOffset;

    //Floor to get simplectic honeycomb coordinates of rhombohedron (stretched cube) super-cell origin.
    let xsb = Math.floor(xs);
    let ysb = Math.floor(ys);
    let zsb = Math.floor(zs);

    //Skew out to get actual coordinates of rhombohedron origin. We'll need these later.
    let squishOffset = (xsb + ysb + zsb) * this.SQUISH_3D;
    let xb = xsb + squishOffset;
    let yb = ysb + squishOffset;
    let zb = zsb + squishOffset;

    //Compute simplectic honeycomb coordinates relative to rhombohedral origin.
    let xins = xs - xsb;
    let yins = ys - ysb;
    let zins = zs - zsb;

    //Sum those together to get a value that determines which region we're in.
    let inSum = xins + yins + zins;

    //Positions relative to origin point.
    let dx0 = x - xb;
    let dy0 = y - yb;
    let dz0 = z - zb;

    //We'll be defining these inside the next block and using them afterwards.
    let dx_ext0, dy_ext0, dz_ext0;
    let dx_ext1, dy_ext1, dz_ext1;
    let xsv_ext0, ysv_ext0, zsv_ext0;
    let xsv_ext1, ysv_ext1, zsv_ext1;

    let value = 0;
    if (inSum <= 1) { //We're inside the tetrahedron (3-Simplex) at (0,0,0)

      //Determine which two of (0,0,1), (0,1,0), (1,0,0) are closest.
      let aPoint = 0x01;
      let aScore = xins;
      let bPoint = 0x02;
      let bScore = yins;
      if (aScore >= bScore && zins > bScore) {
        bScore = zins;
        bPoint = 0x04;
      } else if (aScore < bScore && zins > aScore) {
        aScore = zins;
        aPoint = 0x04;
      }

      //Now we determine the two lattice points not part of the tetrahedron that may contribute.
      //This depends on the closest two tetrahedral vertices, including (0,0,0)
      let wins = 1 - inSum;
      if (wins > aScore || wins > bScore) { //(0,0,0) is one of the closest two tetrahedral vertices.
        let c = (bScore > aScore ? bPoint : aPoint); //Our other closest vertex is the closest out of a and b.

        if ((c & 0x01) === 0) {
          xsv_ext0 = xsb - 1;
          xsv_ext1 = xsb;
          dx_ext0 = dx0 + 1;
          dx_ext1 = dx0;
        } else {
          xsv_ext0 = xsv_ext1 = xsb + 1;
          dx_ext0 = dx_ext1 = dx0 - 1;
        }

        if ((c & 0x02) === 0) {
          ysv_ext0 = ysv_ext1 = ysb;
          dy_ext0 = dy_ext1 = dy0;
          if ((c & 0x01) === 0) {
            ysv_ext1 -= 1;
            dy_ext1 += 1;
          } else {
            ysv_ext0 -= 1;
            dy_ext0 += 1;
          }
        } else {
          ysv_ext0 = ysv_ext1 = ysb + 1;
          dy_ext0 = dy_ext1 = dy0 - 1;
        }

        if ((c & 0x04) === 0) {
          zsv_ext0 = zsb;
          zsv_ext1 = zsb - 1;
          dz_ext0 = dz0;
          dz_ext1 = dz0 + 1;
        } else {
          zsv_ext0 = zsv_ext1 = zsb + 1;
          dz_ext0 = dz_ext1 = dz0 - 1;
        }
      } else { //(0,0,0) is not one of the closest two tetrahedral vertices.
        let c = (aPoint | bPoint); //Our two extra vertices are determined by the closest two.

        if ((c & 0x01) === 0) {
          xsv_ext0 = xsb;
          xsv_ext1 = xsb - 1;
          dx_ext0 = dx0 - 2 * this.SQUISH_3D;
          dx_ext1 = dx0 + 1 - this.SQUISH_3D;
        } else {
          xsv_ext0 = xsv_ext1 = xsb + 1;
          dx_ext0 = dx0 - 1 - 2 * this.SQUISH_3D;
          dx_ext1 = dx0 - 1 - this.SQUISH_3D;
        }

        if ((c & 0x02) === 0) {
          ysv_ext0 = ysb;
          ysv_ext1 = ysb - 1;
          dy_ext0 = dy0 - 2 * this.SQUISH_3D;
          dy_ext1 = dy0 + 1 - this.SQUISH_3D;
        } else {
          ysv_ext0 = ysv_ext1 = ysb + 1;
          dy_ext0 = dy0 - 1 - 2 * this.SQUISH_3D;
          dy_ext1 = dy0 - 1 - this.SQUISH_3D;
        }

        if ((c & 0x04) === 0) {
          zsv_ext0 = zsb;
          zsv_ext1 = zsb - 1;
          dz_ext0 = dz0 - 2 * this.SQUISH_3D;
          dz_ext1 = dz0 + 1 - this.SQUISH_3D;
        } else {
          zsv_ext0 = zsv_ext1 = zsb + 1;
          dz_ext0 = dz0 - 1 - 2 * this.SQUISH_3D;
          dz_ext1 = dz0 - 1 - this.SQUISH_3D;
        }
      }

      //Contribution (0,0,0)
      let attn0 = 2 - dx0**2 - dy0**2 - dz0**2;
      if (attn0 > 0) {
        attn0 *= attn0;
        value += attn0 * attn0 * this._extrapolate3D(xsb, ysb, zsb, dx0, dy0, dz0);
      }

      //Contribution (1,0,0)
      let dx1 = dx0 - 1 - this.SQUISH_3D;
      let dy1 = dy0 - 0 - this.SQUISH_3D;
      let dz1 = dz0 - 0 - this.SQUISH_3D;
      let attn1 = 2 - dx1**2 - dy1**2 - dz1**2;
      if (attn1 > 0) {
        attn1 *= attn1;
        value += attn1 * attn1 * this._extrapolate3D(xsb + 1, ysb , zsb, dx1, dy1, dz1);
      }

      //Contribution (0,1,0)
      let dx2 = dx0 - 0 - this.SQUISH_3D;
      let dy2 = dy0 - 1 - this.SQUISH_3D;
      let dz2 = dz1;
      let attn2 = 2 - dx2**2 - dy2**2 - dz2**2;
      if (attn2 > 0) {
        attn2 *= attn2;
        value += attn2 * attn2 * this._extrapolate3D(xsb, ysb + 1, zsb, dx2, dy2, dz2);
      }

      //Contribution (0,0,1)
      let dx3 = dx2;
      let dy3 = dy1;
      let dz3 = dz0 - 1 - this.SQUISH_3D;
      let attn3 = 2 - dx3**2 - dy3**2 - dz3**2;
      if (attn3 > 0) {
        attn3 *= attn3;
        value += attn3 * attn3 * this._extrapolate3D(xsb, ysb, zsb + 1, dx3, dy3, dz3);
      }
    } else if (inSum >= 2) { //We're inside the tetrahedron (3-Simplex) at (1,1,1)

      //Determine which two tetrahedral vertices are the closest, out of (1,1,0), (1,0,1), (0,1,1) but not (1,1,1).
      let aPoint = 0x06;
      let aScore = xins;
      let bPoint = 0x05;
      let bScore = yins;
      if (aScore <= bScore && zins < bScore) {
        bScore = zins;
        bPoint = 0x03;
      } else if (aScore > bScore && zins < aScore) {
        aScore = zins;
        aPoint = 0x03;
      }

      //Now we determine the two lattice points not part of the tetrahedron that may contribute.
      //This depends on the closest two tetrahedral vertices, including (1,1,1)
      let wins = 3 - inSum;
      if (wins < aScore || wins < bScore) { //(1,1,1) is one of the closest two tetrahedral vertices.
        let c = (bScore < aScore ? bPoint : aPoint); //Our other closest vertex is the closest out of a and b.

        if ((c & 0x01) !== 0) {
          xsv_ext0 = xsb + 2;
          xsv_ext1 = xsb + 1;
          dx_ext0 = dx0 - 2 - 3 * this.SQUISH_3D;
          dx_ext1 = dx0 - 1 - 3 * this.SQUISH_3D;
        } else {
          xsv_ext0 = xsv_ext1 = xsb;
          dx_ext0 = dx_ext1 = dx0 - 3 * this.SQUISH_3D;
        }

        if ((c & 0x02) !== 0) {
          ysv_ext0 = ysv_ext1 = ysb + 1;
          dy_ext0 = dy_ext1 = dy0 - 1 - 3 * this.SQUISH_3D;
          if ((c & 0x01) !== 0) {
            ysv_ext1 += 1;
            dy_ext1 -= 1;
          } else {
            ysv_ext0 += 1;
            dy_ext0 -= 1;
          }
        } else {
          ysv_ext0 = ysv_ext1 = ysb;
          dy_ext0 = dy_ext1 = dy0 - 3 * this.SQUISH_3D;
        }

        if ((c & 0x04) !== 0) {
          zsv_ext0 = zsb + 1;
          zsv_ext1 = zsb + 2;
          dz_ext0 = dz0 - 1 - 3 * this.SQUISH_3D;
          dz_ext1 = dz0 - 2 - 3 * this.SQUISH_3D;
        } else {
          zsv_ext0 = zsv_ext1 = zsb;
          dz_ext0 = dz_ext1 = dz0 - 3 * this.SQUISH_3D;
        }
      } else { //(1,1,1) is not one of the closest two tetrahedral vertices.
        let c = (aPoint & bPoint); //Our two extra vertices are determined by the closest two.

        if ((c & 0x01) !== 0) {
          xsv_ext0 = xsb + 1;
          xsv_ext1 = xsb + 2;
          dx_ext0 = dx0 - 1 - this.SQUISH_3D;
          dx_ext1 = dx0 - 2 - 2 * this.SQUISH_3D;
        } else {
          xsv_ext0 = xsv_ext1 = xsb;
          dx_ext0 = dx0 - this.SQUISH_3D;
          dx_ext1 = dx0 - 2 * this.SQUISH_3D;
        }

        if ((c & 0x02) !== 0) {
          ysv_ext0 = ysb + 1;
          ysv_ext1 = ysb + 2;
          dy_ext0 = dy0 - 1 - this.SQUISH_3D;
          dy_ext1 = dy0 - 2 - 2 * this.SQUISH_3D;
        } else {
          ysv_ext0 = ysv_ext1 = ysb;
          dy_ext0 = dy0 - this.SQUISH_3D;
          dy_ext1 = dy0 - 2 * this.SQUISH_3D;
        }

        if ((c & 0x04) !== 0) {
          zsv_ext0 = zsb + 1;
          zsv_ext1 = zsb + 2;
          dz_ext0 = dz0 - 1 - this.SQUISH_3D;
          dz_ext1 = dz0 - 2 - 2 * this.SQUISH_3D;
        } else {
          zsv_ext0 = zsv_ext1 = zsb;
          dz_ext0 = dz0 - this.SQUISH_3D;
          dz_ext1 = dz0 - 2 * this.SQUISH_3D;
        }
      }

      //Contribution (1,1,0)
      let dx3 = dx0 - 1 - 2 * this.SQUISH_3D;
      let dy3 = dy0 - 1 - 2 * this.SQUISH_3D;
      let dz3 = dz0 - 0 - 2 * this.SQUISH_3D;
      let attn3 = 2 - dx3**2 - dy3**2 - dz3**2;
      if (attn3 > 0) {
        attn3 *= attn3;
        value += attn3 * attn3 * this._extrapolate3D(xsb + 1, ysb + 1, zsb, dx3, dy3, dz3);
      }

      //Contribution (1,0,1)
      let dx2 = dx3;
      let dy2 = dy0 - 0 - 2 * this.SQUISH_3D;
      let dz2 = dz0 - 1 - 2 * this.SQUISH_3D;
      let attn2 = 2 - dx2**2 - dy2**2 - dz2**2;
      if (attn2 > 0) {
        attn2 *= attn2;
        value += attn2 * attn2 * this._extrapolate3D(xsb + 1, ysb, zsb + 1, dx2, dy2, dz2);
      }

      //Contribution (0,1,1)
      let dx1 = dx0 - 0 - 2 * this.SQUISH_3D;
      let dy1 = dy3;
      let dz1 = dz2;
      let attn1 = 2 - dx1**2 - dy1**2 - dz1**2;
      if (attn1 > 0) {
        attn1 *= attn1;
        value += attn1 * attn1 * this._extrapolate3D(xsb, ysb + 1, zsb + 1, dx1, dy1, dz1);
      }

      //Contribution (1,1,1)
      dx0 = dx0 - 1 - 3 * this.SQUISH_3D;
      dy0 = dy0 - 1 - 3 * this.SQUISH_3D;
      dz0 = dz0 - 1 - 3 * this.SQUISH_3D;
      let attn0 = 2 - dx0**2 - dy0**2 - dz0**2;
      if (attn0 > 0) {
        attn0 *= attn0;
        value += attn0 * attn0 * this._extrapolate3D(xsb + 1, ysb + 1, zsb + 1, dx0, dy0, dz0);
      }
    } else { //We're inside the octahedron (Rectified 3-Simplex) in between.
      let aScore;
      let aPoint;
      let aIsFurtherSide;
      let bScore;
      let bPoint;
      let bIsFurtherSide;

      //Decide between point (0,0,1) and (1,1,0) as closest
      let p1 = xins + yins;
      if (p1 > 1) {
        aScore = p1 - 1;
        aPoint = 0x03;
        aIsFurtherSide = true;
      } else {
        aScore = 1 - p1;
        aPoint = 0x04;
        aIsFurtherSide = false;
      }

      //Decide between point (0,1,0) and (1,0,1) as closest
      let p2 = xins + zins;
      if (p2 > 1) {
        bScore = p2 - 1;
        bPoint = 0x05;
        bIsFurtherSide = true;
      } else {
        bScore = 1 - p2;
        bPoint = 0x02;
        bIsFurtherSide = false;
      }

      //The closest out of the two (1,0,0) and (0,1,1) will replace the furthest out of the two decided above, if closer.
      let p3 = yins + zins;
      if (p3 > 1) {
        let score = p3 - 1;
        if (aScore <= bScore && aScore < score) {
          aScore = score;
          aPoint = 0x06;
          aIsFurtherSide = true;
        } else if (aScore > bScore && bScore < score) {
          bScore = score;
          bPoint = 0x06;
          bIsFurtherSide = true;
        }
      } else {
        let score = 1 - p3;
        if (aScore <= bScore && aScore < score) {
          aScore = score;
          aPoint = 0x01;
          aIsFurtherSide = false;
        } else if (aScore > bScore && bScore < score) {
          bScore = score;
          bPoint = 0x01;
          bIsFurtherSide = false;
        }
      }

      //Where each of the two closest points are determines how the extra two vertices are calculated.
      if (aIsFurtherSide === bIsFurtherSide) {
        if (aIsFurtherSide) { //Both closest points on (1,1,1) side

          //One of the two extra points is (1,1,1)
          dx_ext0 = dx0 - 1 - 3 * this.SQUISH_3D;
          dy_ext0 = dy0 - 1 - 3 * this.SQUISH_3D;
          dz_ext0 = dz0 - 1 - 3 * this.SQUISH_3D;
          xsv_ext0 = xsb + 1;
          ysv_ext0 = ysb + 1;
          zsv_ext0 = zsb + 1;

          //Other extra point is based on the shared axis.
          let c = (aPoint & bPoint);
          if ((c & 0x01) !== 0) {
            dx_ext1 = dx0 - 2 - 2 * this.SQUISH_3D;
            dy_ext1 = dy0 - 2 * this.SQUISH_3D;
            dz_ext1 = dz0 - 2 * this.SQUISH_3D;
            xsv_ext1 = xsb + 2;
            ysv_ext1 = ysb;
            zsv_ext1 = zsb;
          } else if ((c & 0x02) !== 0) {
            dx_ext1 = dx0 - 2 * this.SQUISH_3D;
            dy_ext1 = dy0 - 2 - 2 * this.SQUISH_3D;
            dz_ext1 = dz0 - 2 * this.SQUISH_3D;
            xsv_ext1 = xsb;
            ysv_ext1 = ysb + 2;
            zsv_ext1 = zsb;
          } else {
            dx_ext1 = dx0 - 2 * this.SQUISH_3D;
            dy_ext1 = dy0 - 2 * this.SQUISH_3D;
            dz_ext1 = dz0 - 2 - 2 * this.SQUISH_3D;
            xsv_ext1 = xsb;
            ysv_ext1 = ysb;
            zsv_ext1 = zsb + 2;
          }
        } else {//Both closest points on (0,0,0) side

          //One of the two extra points is (0,0,0)
          dx_ext0 = dx0;
          dy_ext0 = dy0;
          dz_ext0 = dz0;
          xsv_ext0 = xsb;
          ysv_ext0 = ysb;
          zsv_ext0 = zsb;

          //Other extra point is based on the omitted axis.
          let c = (aPoint | bPoint);
          if ((c & 0x01) == 0) {
            dx_ext1 = dx0 + 1 - this.SQUISH_3D;
            dy_ext1 = dy0 - 1 - this.SQUISH_3D;
            dz_ext1 = dz0 - 1 - this.SQUISH_3D;
            xsv_ext1 = xsb - 1;
            ysv_ext1 = ysb + 1;
            zsv_ext1 = zsb + 1;
          } else if ((c & 0x02) == 0) {
            dx_ext1 = dx0 - 1 - this.SQUISH_3D;
            dy_ext1 = dy0 + 1 - this.SQUISH_3D;
            dz_ext1 = dz0 - 1 - this.SQUISH_3D;
            xsv_ext1 = xsb + 1;
            ysv_ext1 = ysb - 1;
            zsv_ext1 = zsb + 1;
          } else {
            dx_ext1 = dx0 - 1 - this.SQUISH_3D;
            dy_ext1 = dy0 - 1 - this.SQUISH_3D;
            dz_ext1 = dz0 + 1 - this.SQUISH_3D;
            xsv_ext1 = xsb + 1;
            ysv_ext1 = ysb + 1;
            zsv_ext1 = zsb - 1;
          }
        }
      } else { //One point on (0,0,0) side, one point on (1,1,1) side
        let c1, c2;
        if (aIsFurtherSide) {
          c1 = aPoint;
          c2 = bPoint;
        } else {
          c1 = bPoint;
          c2 = aPoint;
        }

        //One contribution is a permutation of (1,1,-1)
        if ((c1 & 0x01) == 0) {
          dx_ext0 = dx0 + 1 - this.SQUISH_3D;
          dy_ext0 = dy0 - 1 - this.SQUISH_3D;
          dz_ext0 = dz0 - 1 - this.SQUISH_3D;
          xsv_ext0 = xsb - 1;
          ysv_ext0 = ysb + 1;
          zsv_ext0 = zsb + 1;
        } else if ((c1 & 0x02) == 0) {
          dx_ext0 = dx0 - 1 - this.SQUISH_3D;
          dy_ext0 = dy0 + 1 - this.SQUISH_3D;
          dz_ext0 = dz0 - 1 - this.SQUISH_3D;
          xsv_ext0 = xsb + 1;
          ysv_ext0 = ysb - 1;
          zsv_ext0 = zsb + 1;
        } else {
          dx_ext0 = dx0 - 1 - this.SQUISH_3D;
          dy_ext0 = dy0 - 1 - this.SQUISH_3D;
          dz_ext0 = dz0 + 1 - this.SQUISH_3D;
          xsv_ext0 = xsb + 1;
          ysv_ext0 = ysb + 1;
          zsv_ext0 = zsb - 1;
        }

        //One contribution is a permutation of (0,0,2)
        dx_ext1 = dx0 - 2 * this.SQUISH_3D;
        dy_ext1 = dy0 - 2 * this.SQUISH_3D;
        dz_ext1 = dz0 - 2 * this.SQUISH_3D;
        xsv_ext1 = xsb;
        ysv_ext1 = ysb;
        zsv_ext1 = zsb;
        if ((c2 & 0x01) !== 0) {
          dx_ext1 -= 2;
          xsv_ext1 += 2;
        } else if ((c2 & 0x02) !== 0) {
          dy_ext1 -= 2;
          ysv_ext1 += 2;
        } else {
          dz_ext1 -= 2;
          zsv_ext1 += 2;
        }
      }

      //Contribution (1,0,0)
      let dx1 = dx0 - 1 - this.SQUISH_3D;
      let dy1 = dy0 - 0 - this.SQUISH_3D;
      let dz1 = dz0 - 0 - this.SQUISH_3D;
      let attn1 = 2 - dx1 * dx1 - dy1 * dy1 - dz1 * dz1;
      if (attn1 > 0) {
        attn1 *= attn1;
        value += attn1 * attn1 * this._extrapolate3D(xsb + 1, ysb, zsb, dx1, dy1, dz1);
      }

      //Contribution (0,1,0)
      let dx2 = dx0 - 0 - this.SQUISH_3D;
      let dy2 = dy0 - 1 - this.SQUISH_3D;
      let dz2 = dz1;
      let attn2 = 2 - dx2 * dx2 - dy2 * dy2 - dz2 * dz2;
      if (attn2 > 0) {
        attn2 *= attn2;
        value += attn2 * attn2 * this._extrapolate3D(xsb, ysb + 1, zsb, dx2, dy2, dz2);
      }

      //Contribution (0,0,1)
      let dx3 = dx2;
      let dy3 = dy1;
      let dz3 = dz0 - 1 - this.SQUISH_3D;
      let attn3 = 2 - dx3 * dx3 - dy3 * dy3 - dz3 * dz3;
      if (attn3 > 0) {
        attn3 *= attn3;
        value += attn3 * attn3 * this._extrapolate3D(xsb, ysb, zsb + 1, dx3, dy3, dz3);
      }

      //Contribution (1,1,0)
      let dx4 = dx0 - 1 - 2 * this.SQUISH_3D;
      let dy4 = dy0 - 1 - 2 * this.SQUISH_3D;
      let dz4 = dz0 - 0 - 2 * this.SQUISH_3D;
      let attn4 = 2 - dx4 * dx4 - dy4 * dy4 - dz4 * dz4;
      if (attn4 > 0) {
        attn4 *= attn4;
        value += attn4 * attn4 * this._extrapolate3D(xsb + 1, ysb + 1, zsb, dx4, dy4, dz4);
      }

      //Contribution (1,0,1)
      let dx5 = dx4;
      let dy5 = dy0 - 0 - 2 * this.SQUISH_3D;
      let dz5 = dz0 - 1 - 2 * this.SQUISH_3D;
      let attn5 = 2 - dx5 * dx5 - dy5 * dy5 - dz5 * dz5;
      if (attn5 > 0) {
        attn5 *= attn5;
        value += attn5 * attn5 * this._extrapolate3D(xsb + 1, ysb, zsb + 1, dx5, dy5, dz5);
      }

      //Contribution (0,1,1)
      let dx6 = dx0 - 0 - 2 * this.SQUISH_3D;
      let dy6 = dy4;
      let dz6 = dz5;
      let attn6 = 2 - dx6 * dx6 - dy6 * dy6 - dz6 * dz6;
      if (attn6 > 0) {
        attn6 *= attn6;
        value += attn6 * attn6 * this._extrapolate3D(xsb, ysb + 1, zsb + 1, dx6, dy6, dz6);
      }
    }

    //First extra vertex
    let attn_ext0 = 2 - dx_ext0 * dx_ext0 - dy_ext0 * dy_ext0 - dz_ext0 * dz_ext0;
    if (attn_ext0 > 0) {
      attn_ext0 *= attn_ext0;
      value += attn_ext0 * attn_ext0 * this._extrapolate3D(xsv_ext0, ysv_ext0, zsv_ext0, dx_ext0, dy_ext0, dz_ext0);
    }

    //Second extra vertex
    let attn_ext1 = 2 - dx_ext1 * dx_ext1 - dy_ext1 * dy_ext1 - dz_ext1 * dz_ext1;
    if (attn_ext1 > 0) {
      attn_ext1 *= attn_ext1;
      value += attn_ext1 * attn_ext1 * this._extrapolate3D(xsv_ext1, ysv_ext1, zsv_ext1, dx_ext1, dy_ext1, dz_ext1);
    }

    return value / this.NORM_3D;
  }


}