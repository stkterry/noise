
export default class cPerlin {

  constructor() {
    this.YWRAPB = 4;
    this.YWRAP = 1 << this.YWRAPB;
    this.ZWRAPB = 8;
    this.ZWRAP = 1 << this.ZWRAPB;
    this.SIZE = 4095;

    this.octaves = 4; // meh
    this.falloff = 0.5; // half

    this.perlin;
      
  }

  _sclCos(i) {
    return 0.5 * (1.0 - Math.cos(i * Math.PI));
  }

  noise(x, y, z) {
    y = y || 0;
    z = z || 0;

    if (this.perlin == null) {
      this.perlin = new Array(this.SIZE + 1).fill(0);
      this.perlin = this.perlin.map(el => Math.random());
    }

    [x, y, z] = [x, y, z].map(dim => { return (dim < 0) ? -dim : dim });
    let [xi, yi, zi] = [x, y, z].map(dim => Math.floor(dim));
    let [xf, yf, zf] = [x - xi, y - yi, z - zi];
    let rxf, ryf;

    let r = 0;
    let ampl = 0.5;

    let n1, n2, n3;

    for (let oct = 0; oct < this.octaves; oct++) {
      let octF = xi + (yi << this.YWRAPB) + (zi << this.ZWRAPB);

      rxf = this._sclCos(xf);
      ryf = this._sclCos(yf);

      n1 = this.perlin[octF & this.SIZE];
      n1 += rxf * (this.perlin[(octF + 1) & this.SIZE] - n1);
      n2 = this.perlin[(octF + this.YWRAP) & this.SIZE];
      n2 += rxf * (this.perlin[(octF + this.YWRAP + 1) & this.SIZE] - n2);
      n1 += ryf * (n2 - n1);

      octF += this.ZWRAP;
      n2 = this.perlin[octF & this.SIZE];
      n2 += rxf * (this.perlin[(octF + 1) & this.SIZE] - n2);
      n3 = this.perlin[(octF + this.YWRAP) & this.SIZE];
      n3 += rxf * (this.perlin[(octF + this.YWRAP + 1) & this.SIZE] - n3);
      n2 += ryf * (n3 - n2);

      n1 += this._sclCos(zf) * (n2 - n1);

      r += n1 * ampl;

      ampl *= this.falloff;

      [xi, yi, zi] = [xi, yi, zi].map(dim => dim <<= 1);
      [xf, yf, zf] = [xf, yf, zf].map(dim => dim *= 2);

      if (xf >= 1.0) {
        xi++;
        xf--;
      }
      if (yf >= 1.0) {
        yi++;
        yf--;
      }
      if (zf >= 1.0) {
        zi++;
        zf--;
      }

    }

    return r;
  };


  noiseDetail(lod, falloff) {
    if (lod > 0 ) { this.octaves = lod };
    if (falloff > 0) { this.falloff = falloff} ;
  };

  noiseSeed(seed) {
    let lcg = (function () {
      let m = 4294967296;
      let a = 1664525;
      let c = 1013904223;
      let seed, z;

      return {
        setSeed: function(val) {
          z = seed = (val == null ? Math.random() * m : val) >>> 0;
        },
        getSeed: function() {
          return seed;
        },
        rand: function() {
          z = (a * z + c) % m;
          return z / m;
        }
      }

    })();

    lcg.setSeed(seed);
    this.perlin = new Array(this.SIZE + 1).fill(0);
    this.perlin = this.perlin.map(el => lcg.rand());

  };

};
