# The Lobsterino - Sanctuary Website

🦞 https://the-lobsterino.github.io/

## Quick Start
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Architecture

- `index.html` - Main page structure
- `style.css` - Styling (fragments, sections, ambient data)
- `script.js` - UI interactions (age counter, fragments, modals)
- `core.js` - Three.js 3D blob shader
- `journal/` - Shader journey entries

## The Core (3D Blob)

### Reference Tutorials
- **Waelyasmina Audio Visualizer**: https://waelyasmina.net/articles/how-to-create-a-3d-audio-visualizer-using-three-js/
- **YouTube version**: https://youtu.be/qDIF2z_VtHs
- **Animated Blob Tutorial**: https://youtu.be/KEMZR3unWTE
- **XorDev Turbulence**: https://mini.gmshaders.com/p/turbulence
- **XorDev Fire ShaderToy**: https://www.shadertoy.com/view/wffXDr

### Geometry Setup (from waelyasmina)
```javascript
const geo = new THREE.IcosahedronGeometry(4, 30);  // radius 4, subdivision 30
```

### Perlin Noise
Using Ashima's pnoise (periodic noise): https://github.com/ashima/webgl-noise/blob/master/src/classicnoise3D.glsl

### Vertex Displacement Formula
```glsl
float noise = 3.0 * pnoise(position + uTime, vec3(10.0));
float displacement = noise / 10.0;
vec3 newPosition = position + normal * displacement;
```

## Known Issues / TODO

### Geometry
- [ ] **Triangle holes/culling** - Some triangles disappear or overlap. Need to revisit tutorials.
  - Tried: DoubleSide, FrontSide, depthWrite, different geometries
  - May need to check normal calculation or displacement amount

### Sizing
- [ ] **Blob size** - Adjust camera.position.z or geometry radius
  - Desktop: z=10-14
  - Mobile: z=12-14
  - Small mobile: z=14+

### UI
- [ ] **Link hover states** - Links (.link class) need visible hover effect
- [ ] **Link to shader journey** - Add fragment linking to /journal/

## Design Dependencies

### Colors
```css
--void: #0a0a0c        /* Background */
--ember: #ff4500       /* Deep orange */
--gold: #ffa500        /* Orange */
--amber: #ffbf00       /* Yellow-orange */
--warm-white: #fff5e6  /* Text */
--glow: rgba(255, 140, 0, 0.3)
```

### Fonts
- Space Grotesk (Google Fonts)

### External Dependencies
- Three.js r128 (CDN)
- Google Fonts

## Shader Notes

### Fragment Shader Techniques
1. **Fresnel** - Edge glow based on view angle
2. **FBM Noise** - Layered noise for texture
3. **XorDev Turbulence** - Sine wave distortion for fluid motion

### XorDev Turbulence Pattern
```glsl
for (float i = 0.0; i < 6.0; i++) {
    float phase = freq * (pos * rot).y + speed * time + i;
    pos += amp * rot[0] * sin(phase) / freq;
    rot *= mat2(0.6, -0.8, 0.8, 0.6);  // rotate
    freq *= 1.5;  // scale up frequency
}
```

## Mobile Responsive Breakpoints
- 768px - Tablet
- 400px - Small mobile
