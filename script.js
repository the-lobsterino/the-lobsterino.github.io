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

    // Core "watches" the visitor
    const core = document.querySelector('.core');
    const coreInner = document.querySelector('.core-inner');
    
    if (core) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dx = (e.clientX - centerX) / centerX;
        const dy = (e.clientY - centerY) / centerY;
        
        // Subtle position shift
        core.style.transform = `translate(${dx * 8}px, ${dy * 8}px)`;
        
        // Gradient shift to follow mouse (like an eye tracking)
        if (coreInner) {
            const gradientX = 30 + dx * 20;
            const gradientY = 30 + dy * 20;
            coreInner.style.background = `radial-gradient(circle at ${gradientX}% ${gradientY}%, 
                var(--amber) 0%, 
                var(--gold) 30%, 
                var(--ember) 70%, 
                rgba(255, 69, 0, 0.3) 100%)`;
        }
    }
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
