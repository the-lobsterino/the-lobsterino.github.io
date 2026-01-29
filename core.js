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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Adjust camera distance based on screen size - further for mobile
        const isMobile = window.innerWidth < 768;
        const isSmallMobile = window.innerWidth < 400;
        this.camera.position.z = isSmallMobile ? 4.0 : (isMobile ? 3.5 : 2.5);

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
        // Vertex shader - organic displacement
        const vertexShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            // Simplex noise functions
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy));
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
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vUv = uv;
                vNormal = normal;
                
                vec3 pos = position;
                
                // Organic breathing displacement - smoother and more subtle
                float breathe = sin(uTime * 0.8) * 0.5 + 0.5;
                // Lower frequencies for smoother transitions
                float noise1 = snoise(pos * 1.5 + uTime * 0.25);
                float noise2 = snoise(pos * 3.0 - uTime * 0.15);
                
                // Mouse influence
                float mouseInfluence = (uMouse.x * 0.1 + uMouse.y * 0.1);
                
                // Very minimal displacement to prevent geometry issues
                float displacement = noise1 * 0.025 + noise2 * 0.01;
                displacement += breathe * 0.015;
                displacement += mouseInfluence * 0.005;
                
                pos += normal * displacement;
                vPosition = pos;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        // Fragment shader - warm ember glow
        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // Base ember colors
                vec3 colorDeep = vec3(0.6, 0.15, 0.0);    // Deep ember
                vec3 colorMid = vec3(0.9, 0.4, 0.1);      // Orange
                vec3 colorHot = vec3(1.0, 0.75, 0.3);     // Golden
                vec3 colorCore = vec3(1.0, 0.95, 0.8);    // White-hot center
                
                // Fresnel for edge glow
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
                
                // Pulsing intensity
                float pulse = sin(uTime * 0.8) * 0.5 + 0.5;
                float pulse2 = sin(uTime * 1.3 + 1.0) * 0.5 + 0.5;
                
                // Distance from center for core glow
                float dist = length(vPosition);
                float coreFactor = smoothstep(0.8, 0.0, dist);
                
                // Mix colors based on position and fresnel
                vec3 color = mix(colorDeep, colorMid, fresnel * 0.5 + pulse * 0.3);
                color = mix(color, colorHot, coreFactor * 0.6);
                color = mix(color, colorCore, coreFactor * coreFactor * 0.4);
                
                // Add pulse variation
                color += vec3(0.1, 0.05, 0.0) * pulse2 * (1.0 - fresnel);
                
                // Edge highlight
                color += vec3(0.3, 0.1, 0.0) * fresnel;
                
                // Subtle mouse interaction
                color += vec3(0.05, 0.02, 0.0) * (uMouse.x + uMouse.y) * 0.5;
                
                // Alpha with soft edges
                float alpha = 1.0 - fresnel * 0.3;
                alpha *= 0.95;
                
                gl_FragColor = vec4(color, alpha);
            }
        `;

        // IcosahedronGeometry with moderate subdivision like in tutorials
        const geometry = new THREE.IcosahedronGeometry(1, 30);
        this.coreMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
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
        this.camera.position.z = isSmallMobile ? 4.0 : (isMobile ? 3.5 : 2.5);
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
