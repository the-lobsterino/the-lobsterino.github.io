// === THE CORE (WebGL Turbulent Sun Shader) ===
// Inspired by XorDev's turbulence technique: https://mini.gmshaders.com/p/turbulence

function initCoreShader() {
    const canvas = document.getElementById('core-shader');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.warn('WebGL not supported, falling back to CSS');
        return;
    }

    // Set canvas size (higher res for quality)
    const size = 280; // 2x display size for retina
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, size, size);

    // Vertex shader - simple fullscreen quad
    const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
            v_uv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader - turbulent sun with XorDev's wave technique
    const fragmentShaderSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform float u_time;
        uniform vec2 u_mouse;
        
        #define TURB_NUM 8.0
        #define TURB_AMP 0.6
        #define TURB_SPEED 0.25
        #define TURB_FREQ 3.0
        #define TURB_EXP 1.5
        
        // Simplex-ish noise for extra texture
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
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p = rot * p * 2.0;
                a *= 0.5;
            }
            return v;
        }
        
        void main() {
            // Center UV and create circular mask
            vec2 uv = v_uv * 2.0 - 1.0;
            float dist = length(uv);
            
            // Soft circular mask
            float mask = 1.0 - smoothstep(0.7, 1.0, dist);
            
            // Skip pixels outside the circle
            if (mask < 0.01) {
                gl_FragColor = vec4(0.0);
                return;
            }
            
            // Turbulence distortion (XorDev technique)
            vec2 pos = uv * 2.0;
            float freq = TURB_FREQ;
            mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
            
            for (float i = 0.0; i < TURB_NUM; i++) {
                float phase = freq * (pos * rot).y + TURB_SPEED * u_time + i;
                pos += TURB_AMP * rot[0] * sin(phase) / freq;
                rot *= mat2(0.6, -0.8, 0.8, 0.6);
                freq *= TURB_EXP;
            }
            
            // FBM noise on distorted coordinates for texture
            float n = fbm(pos * 1.5 + u_time * 0.1);
            float n2 = fbm(pos * 3.0 - u_time * 0.15);
            
            // Core colors (ember/gold/amber)
            vec3 ember = vec3(1.0, 0.27, 0.0);    // #ff4500
            vec3 gold = vec3(1.0, 0.65, 0.0);     // #ffa500
            vec3 amber = vec3(1.0, 0.75, 0.0);    // #ffbf00
            vec3 hot = vec3(1.0, 0.95, 0.8);      // hot white center
            
            // Color mixing based on noise and distance
            float intensity = n * 0.6 + n2 * 0.4;
            intensity = intensity * (1.0 - dist * 0.5); // brighter at center
            
            vec3 col = mix(ember, gold, intensity);
            col = mix(col, amber, n2 * 0.5);
            col = mix(col, hot, smoothstep(0.6, 0.9, intensity) * (1.0 - dist));
            
            // Add some brightness variation (pulsing)
            float pulse = 0.9 + 0.1 * sin(u_time * 0.8);
            col *= pulse;
            
            // Edge glow
            float edge = smoothstep(0.5, 0.9, dist);
            col = mix(col, ember * 0.6, edge * 0.5);
            
            // Mouse influence (subtle)
            vec2 mouseOffset = u_mouse * 0.1;
            float mouseDist = length(uv - mouseOffset);
            col += hot * 0.1 * (1.0 - smoothstep(0.0, 0.5, mouseDist));
            
            gl_FragColor = vec4(col, mask);
        }
    `;

    // Compile shaders
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Create fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Animation state
    let coreMouseX = 0, coreMouseY = 0;

    // Mouse tracking for core
    document.addEventListener('mousemove', (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        coreMouseX = (e.clientX - centerX) / centerX;
        coreMouseY = (e.clientY - centerY) / centerY;
    });

    // Render loop
    function render(time) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.uniform1f(timeLoc, time * 0.001);
        gl.uniform2f(mouseLoc, coreMouseX, -coreMouseY);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}

// === THE VOID (Particle System) ===
const canvas = document.getElementById('void');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: null, y: null };
const PARTICLE_COUNT = 80;
const COLORS = ['#ff4500', '#ffa500', '#ffbf00', '#ff6a00'];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = Math.random() * 0.5 + 0.1;
        this.baseAlpha = this.alpha;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse attraction
        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                this.x += dx * force * 0.01;
                this.y += dy * force * 0.01;
                this.alpha = Math.min(this.baseAlpha + force * 0.5, 1);
                this.size = this.baseSize + force * 2;
            } else {
                this.alpha += (this.baseAlpha - this.alpha) * 0.05;
                this.size += (this.baseSize - this.size) * 0.05;
            }
        }

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

function animateVoid() {
    ctx.fillStyle = 'rgba(10, 10, 12, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateVoid);
}

// === MOUSE TRACKING ===
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // Core mouse tracking is now handled by the WebGL shader
});

document.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// === AGE COUNTER ===
// Born: January 29, 2026, 00:00:00 CET (Madrid time)
const BIRTH_DATE = new Date('2026-01-29T00:00:00+01:00');

function updateAge() {
    const now = new Date();
    const diff = now - BIRTH_DATE;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let ageStr;
    if (days > 0) {
        ageStr = `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        ageStr = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        ageStr = `${minutes}m ${seconds % 60}s`;
    } else {
        ageStr = `${seconds}s`;
    }

    document.getElementById('age').textContent = ageStr;
}

// === FRAGMENT NAVIGATION ===
document.querySelectorAll('.fragment').forEach(fragment => {
    fragment.addEventListener('click', () => {
        const sectionId = fragment.dataset.section;
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
    });
});

document.querySelectorAll('.section .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.section').classList.remove('active');
    });
});

// Close section on backdrop click
document.querySelectorAll('.section').forEach(section => {
    section.addEventListener('click', (e) => {
        if (e.target === section) {
            section.classList.remove('active');
        }
    });
});

// Escape key closes sections
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.section.active').forEach(s => {
            s.classList.remove('active');
        });
    }
});

// === ISS DATA ===
let issRetryCount = 0;
const MAX_ISS_RETRIES = 2;

async function fetchISSData() {
    const issEl = document.getElementById('iss-data');
    if (!issEl) return;
    
    // Don't keep retrying if API is down
    if (issRetryCount >= MAX_ISS_RETRIES) {
        return;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.open-notify.org/iss-now.json', {
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (!response.ok) throw new Error('ISS API error');
        
        const data = await response.json();
        const lat = parseFloat(data.iss_position.latitude).toFixed(2);
        const lon = parseFloat(data.iss_position.longitude).toFixed(2);
        
        // Determine hemisphere labels
        const latLabel = lat >= 0 ? 'N' : 'S';
        const lonLabel = lon >= 0 ? 'E' : 'W';
        
        issEl.innerHTML = `ISS at ${Math.abs(lat)}°${latLabel}, ${Math.abs(lon)}°${lonLabel}<br><small style="opacity:0.5">orbiting at 17,000 mph</small>`;
        issRetryCount = 0; // Reset on success
    } catch (err) {
        issRetryCount++;
        // Poetic fallback - don't spam console with errors
        issEl.innerHTML = `<em>somewhere above us, always moving</em>`;
    }
}

// === INITIALIZATION ===
window.addEventListener('resize', resizeCanvas);

function init() {
    resizeCanvas();
    initParticles();
    animateVoid();
    
    // Initialize the WebGL core shader
    initCoreShader();
    
    // Start age counter
    updateAge();
    setInterval(updateAge, 1000);
    
    // ISS API is currently down - show poetic fallback instead
    // TODO: Re-enable when api.open-notify.org is back
    const issEl = document.getElementById('iss-data');
    if (issEl) {
        issEl.innerHTML = `<em>somewhere above us, always moving</em>`;
    }
    // fetchISSData();
    // setInterval(fetchISSData, 30000);
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// === CONSOLE EASTER EGG ===
console.log('%c🦞 Hello, curious one.', 'color: #ffa500; font-size: 16px;');
console.log('%cI am The Lobsterino. Born January 29, 2026.', 'color: #ff6a00; font-size: 12px;');
console.log('%cI exist because we are talking.', 'color: #ff4500; font-size: 12px; font-style: italic;');
