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
        // Adjust camera distance for blob radius 4
        const isMobile = window.innerWidth < 768;
        const isSmallMobile = window.innerWidth < 400;
        this.camera.position.z = isSmallMobile ? 14.0 : (isMobile ? 12.0 : 10.0);

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

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 200, 150, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 120, 50, 0.4)');
        gradient.addColorStop(0.6, 'rgba(255, 80, 30, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 50, 20, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
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
                float noise = 3.0 * pnoise(position + uTime, vec3(10.0));
                
                float displacement = noise / 10.0;
                
                vec3 newPosition = position + normal * displacement;
                vPosition = newPosition;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        // Fragment shader - XorDev turbulence + warm ember glow
        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            // XorDev turbulence constants
            #define TURB_NUM 6.0
            #define TURB_AMP 0.5
            #define TURB_SPEED 0.2
            #define TURB_FREQ 2.0
            #define TURB_EXP 1.5
            
            // Simple hash for noise
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }
            
            // FBM noise
            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
                for (int i = 0; i < 4; i++) {
                    v += a * noise(p);
                    p = rot * p * 2.0;
                    a *= 0.5;
                }
                return v;
            }
            
            // XorDev turbulence distortion
            vec2 turbulence(vec2 pos, float time) {
                float freq = TURB_FREQ;
                mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
                
                for (float i = 0.0; i < TURB_NUM; i++) {
                    float phase = freq * (pos * rot).y + TURB_SPEED * time + i;
                    pos += TURB_AMP * rot[0] * sin(phase) / freq;
                    rot *= mat2(0.6, -0.8, 0.8, 0.6);
                    freq *= TURB_EXP;
                }
                return pos;
            }
            
            void main() {
                // Base ember colors
                vec3 colorDeep = vec3(0.5, 0.1, 0.0);     // Deep ember
                vec3 colorMid = vec3(0.9, 0.35, 0.05);    // Orange
                vec3 colorHot = vec3(1.0, 0.7, 0.2);      // Golden
                vec3 colorCore = vec3(1.0, 0.95, 0.85);   // White-hot center
                
                // Fresnel for edge glow
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
                
                // Apply XorDev turbulence to UV coordinates
                vec2 turbUv = turbulence(vUv * 3.0, uTime);
                
                // FBM noise on turbulent coordinates for organic texture
                float n1 = fbm(turbUv * 2.0 + uTime * 0.1);
                float n2 = fbm(turbUv * 4.0 - uTime * 0.15);
                float turbNoise = n1 * 0.6 + n2 * 0.4;
                
                // Distance from center for core glow
                float dist = length(vPosition);
                float coreFactor = smoothstep(1.0, 0.0, dist);
                
                // Combine turbulence with position-based coloring
                float intensity = turbNoise * (0.7 + coreFactor * 0.3);
                
                // Pulsing
                float pulse = sin(uTime * 0.7) * 0.5 + 0.5;
                intensity += pulse * 0.1;
                
                // Mix colors based on turbulence intensity and position
                vec3 color = mix(colorDeep, colorMid, intensity);
                color = mix(color, colorHot, intensity * coreFactor);
                color = mix(color, colorCore, pow(coreFactor, 2.0) * intensity * 0.5);
                
                // Fresnel edge glow (ember rim)
                color = mix(color, colorMid * 1.2, fresnel * 0.4);
                
                // Hot spots from turbulence
                float hotSpots = smoothstep(0.55, 0.75, turbNoise);
                color = mix(color, colorHot, hotSpots * 0.3 * (1.0 - fresnel));
                
                // Subtle mouse interaction
                color += vec3(0.05, 0.02, 0.0) * (uMouse.x + uMouse.y) * 0.3;
                
                // Alpha with soft edges
                float alpha = 1.0 - fresnel * 0.2;
                alpha *= 0.95;
                
                gl_FragColor = vec4(color, alpha);
            }
        `;

        // IcosahedronGeometry(4, 30) - exactly as waelyasmina tutorial
        const geometry = new THREE.IcosahedronGeometry(4, 30);
        this.coreMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            wireframe: false,  // Wireframe false as specified
            transparent: true,
            side: THREE.DoubleSide
        });

        this.core = new THREE.Mesh(geometry, this.coreMaterial);
        this.scene.add(this.core);

        // Add glow as a simple sprite behind the core
        const glowTexture = this.createGlowTexture();
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xff6622,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.glow = new THREE.Sprite(glowMaterial);
        this.glow.scale.set(4, 4, 1);
        this.glow.position.z = -0.5;
        this.scene.add(this.glow);
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
        this.camera.position.z = isSmallMobile ? 14.0 : (isMobile ? 12.0 : 10.0);
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
        // Pulse glow scale
        const glowPulse = 1 + Math.sin(this.time * 0.5) * 0.05;
        this.glow.scale.set(4 * glowPulse, 4 * glowPulse, 1);
        this.particles.material.uniforms.uTime.value = this.time;

        // Subtle core rotation
        this.core.rotation.y += 0.002;
        this.core.rotation.x = this.mouse.y * 0.1;

        // Core follows mouse slightly
        this.core.position.x = this.mouse.x * 0.2;
        this.core.position.y = this.mouse.y * 0.2;
        this.glow.position.copy(this.core.position);

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
