# Noise

A collection of noise generators.  For now it's just classic perlin and open simplex.
The classic perlin generator is a slight reimagining from p5js.  I wanted more usable,
class like behavior and also didn't want to use that lib. 
The open simplex generator was pretty much 99% inspired by KdotJPG here: 
https://gist.github.com/KdotJPG/b1270127455a94ac5d19

It's simply a port from Java to JS, pratically verbatim, and I take no credit 
for their brilliant work.

## Usage

I'll make this brief.

#### Classic Perlin

  1) Create an instance:
      `cper = new cPerlin()`
  2) Get a value in one, two, or three dimensions:
      `cper.noise(x)`, 
      `cper.noise(x, y)`, 
      `or cper.noise(x, y, z)`

  3) You can set a seed: `cper.noiseSeed(seed_val)`

  4) You can set the lod and falloff: `cper.noiseDetail(lod, falloff)`

#### Open Simplex
  This one's a tad more involved.
  1) Create an instance:
    `oplex = new oSimplex()`
  2) Get a value in two, or three dimensions ( and in the future four): `oplex.noise(x, y)`, `oplex.noise(x, y, z)`
  3) You can set a seed: `oplex.seed(seed_val)`
  4) You can be a bit more specific...
        
          By default neither the seed nor the setups for 2D and 3D constants are 
          initialized.  This just saves a little space if you don't intend on 
          calling the noise function for other dimensions.  When you call `noise()`
          a random seed is assigned and the correct constants are initialized, but 
          they're checked each call to the noise() function. 

          So to save the tiniest of peformance, you can initialize and call your
          function of choice directly.  For instance, for 2D...
          oplex = new oSimplex();
          oplex.seed(seed_val) (Or oplex.seed() for a random seed)
          oplex.setup2D();
          oplex.noise2D(x, y) to your heart's content.

## ToDo
- Add the four-dimensional variant to open simplex.
- Make much, much better documentation.


## More Info
I have a lot yet I want to do with this bit of code and this repo,
including adding several more noise functions and tweaking the ones present for 
better JS specific performance. This repo was tossed together quickly so
I could move on to more pressing material and was made more for personal convenience
than anyone else's benefit.  Though, if you like it you're welcome to it.
