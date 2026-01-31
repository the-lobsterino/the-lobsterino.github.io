// === CORONA - Separate WebGL canvas, CSS-centered ===

class Corona {
    constructor() {
        this.canvas = document.getElementById('corona');
        this.time = 0;
        this.init();
    }

    init() {
        // Get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.log('Corona: WebGL not available');
            return;
        }

        // Set canvas size (square, will be CSS-centered)
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create shader program
        this.program = this.createProgram();
        if (!this.program) return;

        // Create fullscreen quad
        this.createQuad();

        // Start animation
        this.animate();
    }

    resize() {
        const size = Math.min(window.innerWidth, window.innerHeight) * 1.5;
        this.canvas.width = size;
        this.canvas.height = size;
        if (this.gl) {
            this.gl.viewport(0, 0, size, size);
        }
    }

    createProgram() {
        const gl = this.gl;

        const vertSrc = `
            attribute vec2 a_position;
            varying vec2 vUv;
            void main() {
                vUv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragSrc = `
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uResolution;
            
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
            
            void main() {
                vec2 center = vec2(0.5, 0.5);
                vec2 pos = vUv - center;
                
                float dist = length(pos);
                float angle = atan(pos.y, pos.x);
                
                // Core radius (normalized to square canvas)
                float coreR = 0.28;
                
                // Animated rays - more dramatic movement
                float t = uTime * 0.35;
                
                float rays = 0.0;
                rays += fbm(vec2(angle * 6.0 + t, dist * 3.0)) * 0.6;
                rays += fbm(vec2(angle * 10.0 - t * 1.2, dist * 5.0)) * 0.4;
                rays += fbm(vec2(angle * 3.0 + t * 0.5, dist * 2.0)) * 0.5;
                
                // Radial falloff
                float innerFade = smoothstep(coreR * 0.7, coreR * 1.0, dist);
                float outerFade = 1.0 - smoothstep(coreR, coreR + 0.35, dist);
                float falloff = innerFade * outerFade;
                
                float rayIntensity = rays * 0.6 + 0.4;
                float intensity = falloff * rayIntensity;
                
                // Colors
                vec3 colorInner = vec3(1.0, 0.7, 0.35);
                vec3 colorOuter = vec3(1.0, 0.35, 0.08);
                vec3 color = mix(colorOuter, colorInner, outerFade);
                
                vec3 finalColor = clamp(color * intensity * 1.8, 0.0, 1.0);
                float alpha = intensity * 0.75;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;

        // Compile vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertSrc);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error('Corona vertex shader error:', gl.getShaderInfoLog(vs));
            return null;
        }

        // Compile fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragSrc);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error('Corona fragment shader error:', gl.getShaderInfoLog(fs));
            return null;
        }

        // Link program
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Corona program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    createQuad() {
        const gl = this.gl;
        
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.useProgram(this.program);
        const aPosition = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016;
        
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);  // Additive blending
        
        gl.useProgram(this.program);
        gl.uniform1f(gl.getUniformLocation(this.program, 'uTime'), this.time);
        gl.uniform2f(gl.getUniformLocation(this.program, 'uResolution'), this.canvas.width, this.canvas.height);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Corona());
} else {
    new Corona();
}
