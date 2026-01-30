// === THE CORE - Three.js Shader ===
// An organic, breathing presence

class Core {
    constructor() {
        this.canvas = document.getElementById('webgl');
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.time = 0;
        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Adjust camera distance for blob radius 4 (further = smaller blob)
        const isMobile = window.innerWidth < 768;
        const isSmallMobile = window.innerWidth < 400;
        this.camera.position.z = isSmallMobile ? 18.0 : (isMobile ? 16.0 : 14.0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create the organic core
        this.createCore();
        
        // Create particles
        this.createParticles();

        // Events
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));

        // Start animation
        this.animate();
    }

    createCore() {
        // Vertex shader - Perlin noise displacement (waelyasmina approach)
        const vertexShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            // Ashima Perlin noise functions
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 permute(vec4 x) {
                return mod289(((x*34.0)+10.0)*x);
            }
            
            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }
            
            vec3 fade(vec3 t) {
                return t*t*t*(t*(t*6.0-15.0)+10.0);
            }
            
            float pnoise(vec3 P, vec3 rep) {
                vec3 Pi0 = mod(floor(P), rep);
                vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
                Pi0 = mod289(Pi0);
                Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P);
                vec3 Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy, Pi1.yy);
                vec4 iz0 = Pi0.zzzz;
                vec4 iz1 = Pi1.zzzz;
                
                vec4 ixy = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);
                
                vec4 gx0 = ixy0 * (1.0 / 7.0);
                vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                
                vec4 gx1 = ixy1 * (1.0 / 7.0);
                vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                
                vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                
                vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                g000 *= norm0.x;
                g010 *= norm0.y;
                g100 *= norm0.z;
                g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                g001 *= norm1.x;
                g011 *= norm1.y;
                g101 *= norm1.z;
                g111 *= norm1.w;
                
                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);
                
                vec3 fade_xyz = fade(Pf0);
                vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
                return 2.2 * n_xyz;
            }
            
            void main() {
                vUv = uv;
                vNormal = normal;
                
                // Waelyasmina approach: pnoise with time animation
                // Slowed to 0.4x speed for gentler breathing
                float slowTime = uTime * 0.4;
                float noise = 2.0 * pnoise(position + slowTime, vec3(10.0));
                
                float displacement = noise / 10.0;
                
                vec3 newPosition = position + normal * displacement;
                vPosition = newPosition;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        // Fragment shader - 4D Perlin noise (3D position + time)
        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            // 4D noise functions (from Ashima/Stefan Gustavson)
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
            float permute(float x) { return mod289(((x*34.0)+10.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            vec4 grad4(float j, vec4 ip) {
                const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
                vec4 p, s;
                p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
                p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
                s = vec4(lessThan(p, vec4(0.0)));
                p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
                return p;
            }
            
            #define F4 0.309016994374947451
            
            float snoise4D(vec4 v) {
                const vec4 C = vec4(
                    0.138196601125011,   // (5 - sqrt(5))/20 G4
                    0.276393202250021,   // 2 * G4
                    0.414589803375032,   // 3 * G4
                    -0.447213595499958); // -1 + 4 * G4
                
                vec4 i = floor(v + dot(v, vec4(F4)));
                vec4 x0 = v - i + dot(i, C.xxxx);
                
                vec4 i0;
                vec3 isX = step(x0.yzw, x0.xxx);
                vec3 isYZ = step(x0.zww, x0.yyz);
                i0.x = isX.x + isX.y + isX.z;
                i0.yzw = 1.0 - isX;
                i0.y += isYZ.x + isYZ.y;
                i0.zw += 1.0 - isYZ.xy;
                i0.z += isYZ.z;
                i0.w += 1.0 - isYZ.z;
                
                vec4 i3 = clamp(i0, 0.0, 1.0);
                vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
                vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);
                
                vec4 x1 = x0 - i1 + C.xxxx;
                vec4 x2 = x0 - i2 + C.yyyy;
                vec4 x3 = x0 - i3 + C.zzzz;
                vec4 x4 = x0 + C.wwww;
                
                i = mod289(i);
                float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
                vec4 j1 = permute(permute(permute(permute(
                    i.w + vec4(i1.w, i2.w, i3.w, 1.0))
                    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
                    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
                    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
                
                vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);
                
                vec4 p0 = grad4(j0, ip);
                vec4 p1 = grad4(j1.x, ip);
                vec4 p2 = grad4(j1.y, ip);
                vec4 p3 = grad4(j1.z, ip);
                vec4 p4 = grad4(j1.w, ip);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                p4 *= taylorInvSqrt(dot(p4,p4));
                
                vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
                m0 = m0 * m0;
                m1 = m1 * m1;
                return 49.0 * (dot(m0*m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
                    + dot(m1*m1, vec2(dot(p3, x3), dot(p4, x4))));
            }
            
            // 3D rotation matrix
            mat3 rotate3D(float angle, vec3 axis) {
                vec3 a = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                return mat3(
                    oc * a.x * a.x + c,       oc * a.x * a.y - a.z * s, oc * a.z * a.x + a.y * s,
                    oc * a.x * a.y + a.z * s, oc * a.y * a.y + c,       oc * a.y * a.z - a.x * s,
                    oc * a.z * a.x - a.y * s, oc * a.y * a.z + a.x * s, oc * a.z * a.z + c
                );
            }
            
            void main() {
                // Normalize position to use as 3D texture coordinate
                // Scale 1.5x larger (reduced from 2.2 to ~1.47)
                vec3 spherePos = normalize(vPosition) * 1.47;
                
                // Slow time for smooth animation - 0.4x slower
                float slowTime = uTime * 0.06;
                
                // Domain warping loop (inspired by Carlos's shader)
                // Iterative feedback creates organic flowing patterns
                vec3 p = spherePos;
                vec3 n = vec3(0.0);  // Accumulated displacement
                float a = 0.0;       // Accumulated intensity
                float S = 8.0;       // Starting scale
                mat3 m = rotate3D(1.2, vec3(0.5, 0.8, 0.3));  // Rotation matrix
                
                for (float j = 0.0; j < 7.0; j++) {
                    p = m * p;  // Rotate
                    n = m * n;  // Rotate accumulated
                    
                    // 4D sample point: warped 3D pos + time
                    vec4 q = vec4(p * S + n + j * 0.5, slowTime + j * 0.1);
                    
                    // Add noise contribution
                    float noiseVal = snoise4D(q);
                    a += noiseVal / S;
                    
                    // Feedback: accumulate displacement
                    n += vec3(noiseVal) * 0.3;
                    
                    // Scale up for next octave
                    S *= 1.4;
                }
                
                // View direction for fresnel
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float facing = dot(viewDir, vNormal);
                float fresnel = pow(1.0 - max(facing, 0.0), 2.5);
                
                // === TURBULENT EMISSION (inspired by Carlos's shader) ===
                // Secondary domain-warped layer for more visible turbulence
                vec3 q = spherePos;
                vec2 accum = vec2(0.0);
                float intensity = 0.0;
                float scale = 6.0;
                mat3 m3 = rotate3D(0.8, vec3(0.5, 0.7, 0.3));
                
                for (float j = 0.0; j < 8.0; j++) {
                    q = m3 * q;
                    accum = (m3 * vec3(accum, 0.0)).xy;
                    
                    // 4D sample with time
                    vec3 samplePos = q * scale + vec3(accum, 0.0) + j * 0.3;
                    float n = snoise4D(vec4(samplePos, slowTime + j * 0.05));
                    
                    // Accumulate with cos for interference patterns
                    intensity += cos(n * 3.14159 + j) / scale;
                    accum -= vec2(sin(n * 2.0), cos(n * 2.0)) * 0.5;
                    
                    scale *= 1.3;
                }
                
                // Combine with base noise
                float emission = a * 0.4 + intensity * 0.6;
                emission = emission * 0.5 + 0.5;  // Remap to [0,1]
                
                // More contrast for visible variation
                emission = smoothstep(0.2, 0.8, emission);
                
                // Albedo layer - surface variation independent of emission
                // Multiple octaves for richer texture
                float albedoNoise1 = snoise4D(vec4(spherePos * 4.0, slowTime * 0.3));
                float albedoNoise2 = snoise4D(vec4(spherePos * 8.0, slowTime * 0.2)) * 0.5;
                float albedoNoise = albedoNoise1 + albedoNoise2;
                float albedo = 0.75 + albedoNoise * 0.25;  // More visible variation 0.5-1.0
                
                // Wider color spectrum (1.2x expansion)
                vec3 colorDark = vec3(0.12, 0.02, 0.0);    // Deep sunspots
                vec3 colorCold = vec3(0.25, 0.04, 0.0);    // Dark ember
                vec3 colorWarm = vec3(0.85, 0.28, 0.02);   // Orange plasma
                vec3 colorHot = vec3(1.0, 0.55, 0.12);     // Hot yellow-orange
                vec3 colorBright = vec3(1.0, 0.82, 0.5);   // Warm white
                
                // Color based on emission intensity
                vec3 color = mix(colorDark, colorCold, smoothstep(0.0, 0.25, emission));
                color = mix(color, colorWarm, smoothstep(0.2, 0.5, emission));
                color = mix(color, colorHot, smoothstep(0.45, 0.75, emission));
                color = mix(color, colorBright, smoothstep(0.7, 0.95, emission) * 0.5);
                
                // Apply albedo
                color *= albedo;
                
                // Fresnel - subtle limb effect
                color = mix(color, colorWarm * 1.1, fresnel * 0.15);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // IcosahedronGeometry(radius, subdivision) - reduced from 30 to 20
        const geometry = new THREE.IcosahedronGeometry(4, 20);
        this.coreMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            wireframe: false,
            transparent: false,  // Solid, no transparency artifacts
            side: THREE.FrontSide,  // Only front faces
            depthWrite: true,
            depthTest: true
        });

        this.core = new THREE.Mesh(geometry, this.coreMaterial);
        this.scene.add(this.core);

        // === CORONA - visible halo with rays ===
        this.createCorona();
    }

    createCorona() {
        // Corona shader on a sphere - 3D corona that moves with the core
        const coronaVert = `
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            
            // Noise for vertex displacement (organic corona shape)
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0) * 2.0 + 1.0;
                vec4 s1 = floor(b1) * 2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                
                // Animate corona rays - displacement along normal
                float t = uTime * 0.08;
                vec3 spherePos = normalize(position);
                
                // Multi-octave noise for organic ray shapes
                float noise1 = snoise(spherePos * 3.0 + t * 0.5);
                float noise2 = snoise(spherePos * 6.0 - t * 0.3) * 0.5;
                float noise3 = snoise(spherePos * 12.0 + t * 0.2) * 0.25;
                
                // Rays extend outward with varying lengths
                float rayLength = (noise1 + noise2 + noise3) * 0.5 + 0.5;
                rayLength = pow(rayLength, 1.5) * 1.2;  // Exaggerate peaks
                
                // Displace outward
                vec3 displaced = position + normal * rayLength * 0.8;
                
                vPosition = position;
                vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
        `;
        
        const coronaFrag = `
            precision highp float;
            uniform float uTime;
            uniform vec3 uCoreCenter;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            
            void main() {
                // View direction for fresnel
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                float facing = abs(dot(viewDir, vNormal));
                
                // Distance from core center (for radial fade)
                float distFromCore = length(vPosition) / 4.0;  // 4.0 = core radius
                float radialPos = (distFromCore - 1.0);  // 0 at surface, increases outward
                
                // Corona is brightest at the edge (low facing) and fades outward
                float edgeGlow = pow(1.0 - facing, 2.0);
                float radialFade = exp(-radialPos * 2.5);  // Soft exponential fade
                
                // Combine for final intensity
                float intensity = edgeGlow * radialFade;
                
                // Corona colors
                vec3 colorInner = vec3(1.0, 0.75, 0.4);   // Warm yellow-orange
                vec3 colorOuter = vec3(1.0, 0.35, 0.08);  // Deep orange-red
                vec3 color = mix(colorOuter, colorInner, radialFade);
                
                // Boost intensity for visibility
                intensity *= 1.5;
                
                gl_FragColor = vec4(color, intensity * 0.6);
            }
        `;
        
        // Sphere geometry slightly larger than core (radius 4.0)
        // Start at core surface (4.0) and extend outward
        const coronaGeom = new THREE.IcosahedronGeometry(4.5, 16);
        this.coronaMaterial = new THREE.ShaderMaterial({
            vertexShader: coronaVert,
            fragmentShader: coronaFrag,
            uniforms: {
                uTime: { value: 0 },
                uCoreCenter: { value: new THREE.Vector3(0, 0, 0) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,  // Render inside faces so corona wraps around
            depthWrite: false
        });
        
        this.corona = new THREE.Mesh(coronaGeom, this.coronaMaterial);
        this.scene.add(this.corona);
    }

    createParticles() {
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Spread particles in a sphere around the core
            const radius = 3 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            sizes[i] = Math.random() * 0.8 + 0.2;

            // Ember colors
            const t = Math.random();
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.3 + t * 0.4;
            colors[i * 3 + 2] = t * 0.2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float uTime;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Gentle orbital motion
                    float angle = uTime * 0.1 + length(position) * 0.5;
                    pos.x += sin(angle + position.y) * 0.1;
                    pos.y += cos(angle + position.x) * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (80.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= 0.4;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const isSmallMobile = window.innerWidth < 400;
        this.camera.position.z = isSmallMobile ? 18.0 : (isMobile ? 16.0 : 14.0);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(e) {
        this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        // Smooth mouse following
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        // Update uniforms
        this.coreMaterial.uniforms.uTime.value = this.time;
        this.coreMaterial.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
        // Update corona
        this.coronaMaterial.uniforms.uTime.value = this.time;
        this.particles.material.uniforms.uTime.value = this.time;

        // Subtle core rotation
        this.core.rotation.y += 0.002;
        this.core.rotation.x = this.mouse.y * 0.1;

        // Core follows mouse slightly
        this.core.position.x = this.mouse.x * 0.2;
        this.core.position.y = this.mouse.y * 0.2;
        
        // Corona follows core exactly (position AND rotation)
        this.corona.position.copy(this.core.position);
        this.corona.rotation.copy(this.core.rotation);
        this.coronaMaterial.uniforms.uCoreCenter.value.copy(this.core.position);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
function initCore() {
    try {
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) throw new Error('No WebGL');
        
        new Core();
    } catch (e) {
        console.log('WebGL not available, showing CSS fallback');
        // Add CSS fallback class
        document.body.classList.add('no-webgl');
        
        // Create a simple CSS-based core as fallback
        const fallback = document.createElement('div');
        fallback.className = 'core-fallback';
        fallback.innerHTML = '<div class="core-fallback-inner"></div>';
        document.querySelector('.sanctuary').appendChild(fallback);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCore);
} else {
    initCore();
}
