// ===== STATE =====
let shaders = [];
let currentIndex = 0;
let completedShaders = new Set();
let gl = null;
let program = null;
let animationId = null;
let startTime = Date.now();
let isPaused = false;

// ===== UNIFORMS =====
let uniforms = {
  u_time: null,
  u_resolution: null
};

// ===== INIT =====
async function init() {
  loadProgress();
  await loadShaders();
  renderShaderList();
  setupCanvas();
  setupEventListeners();
  
  // Auto-select first shader or last completed
  const lastCompleted = Math.max(0, ...Array.from(completedShaders));
  const startIndex = completedShaders.size > 0 ? Math.min(lastCompleted + 1, shaders.length - 1) : 0;
  selectShader(startIndex);
}

// ===== LOAD SHADERS =====
async function loadShaders() {
  try {
    const response = await fetch('shaders.json');
    shaders = await response.json();
  } catch (error) {
    console.error('Error loading shaders:', error);
    shaders = [];
  }
}

// ===== CANVAS SETUP =====
function setupCanvas() {
  const canvas = document.getElementById('glCanvas');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    alert('WebGL no está disponible en tu navegador 😢');
    return;
  }
  
  // Resize canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const canvas = document.getElementById('glCanvas');
  const wrapper = canvas.parentElement;
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

// ===== SHADER COMPILATION =====
function compileShader(source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
  
  if (!vertexShader || !fragmentShader) return null;
  
  const prog = gl.createProgram();
  gl.attachShader(prog, vertexShader);
  gl.attachShader(prog, fragmentShader);
  gl.linkProgram(prog);
  
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(prog));
    return null;
  }
  
  return prog;
}

// ===== RENDER SHADER =====
function loadShader(shaderData) {
  if (!gl) return;
  
  // Stop previous animation
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Default vertex shader
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  
  // Fragment shader with compatibility wrapper
  // Add uniforms only if not already in shader code (avoid redefinition)
  const hasTime = shaderData.code.includes('uniform float u_time');
  const hasResolution = shaderData.code.includes('uniform vec2 u_resolution');
  
  const fragmentShaderSource = `
    precision mediump float;
    ${hasTime ? '' : 'uniform float u_time;'}
    ${hasResolution ? '' : 'uniform vec2 u_resolution;'}
    
    ${shaderData.code}
  `;
  
  program = createProgram(vertexShaderSource, fragmentShaderSource);
  
  if (!program) {
    console.error('Failed to create shader program');
    return;
  }
  
  gl.useProgram(program);
  
  // Setup geometry (fullscreen quad)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]), gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Get uniform locations
  uniforms.u_time = gl.getUniformLocation(program, 'u_time');
  uniforms.u_resolution = gl.getUniformLocation(program, 'u_resolution');
  
  // Start animation
  startTime = Date.now();
  isPaused = false;
  updatePlayPauseButton();
  animate();
}

function animate() {
  if (!gl || !program || isPaused) {
    if (!isPaused) {
      animationId = requestAnimationFrame(animate);
    }
    return;
  }
  
  const canvas = document.getElementById('glCanvas');
  const time = (Date.now() - startTime) / 1000.0;
  
  // Update uniforms
  if (uniforms.u_time !== null) {
    gl.uniform1f(uniforms.u_time, time);
  }
  if (uniforms.u_resolution !== null) {
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
  }
  
  // Draw
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  animationId = requestAnimationFrame(animate);
}

// ===== UI UPDATES =====
function renderShaderList() {
  const list = document.getElementById('shaderList');
  list.innerHTML = '';
  
  shaders.forEach((shader, index) => {
    const item = document.createElement('div');
    item.className = 'shader-item';
    
    // Check if locked (not next in sequence)
    const maxCompleted = completedShaders.size > 0 ? Math.max(...Array.from(completedShaders)) : -1;
    const isLocked = index > maxCompleted + 1;
    
    if (index === currentIndex) item.classList.add('active');
    if (completedShaders.has(index)) item.classList.add('completed');
    if (isLocked) item.classList.add('locked');
    
    const status = completedShaders.has(index) ? '✓' : 
                   isLocked ? '🔒' : 
                   index === currentIndex ? '👉' : '';
    
    item.innerHTML = `
      <span class="shader-number">${String(index + 1).padStart(2, '0')}</span>
      <div class="shader-item-content">
        <div class="shader-item-title">${shader.name}</div>
        <div class="shader-item-difficulty">${shader.difficulty}</div>
      </div>
      <span class="shader-item-status">${status}</span>
    `;
    
    if (!isLocked) {
      item.addEventListener('click', () => selectShader(index));
    }
    
    list.appendChild(item);
  });
  
  updateProgress();
}

function selectShader(index) {
  if (index < 0 || index >= shaders.length) return;
  
  currentIndex = index;
  const shader = shaders[index];
  
  // Update UI
  document.getElementById('shaderName').textContent = shader.name;
  
  const badge = document.getElementById('difficultyBadge');
  badge.textContent = shader.difficulty;
  badge.className = 'difficulty-badge ' + shader.difficulty;
  
  document.getElementById('explanation').textContent = shader.explanation;
  
  // Render concepts
  const conceptsDiv = document.getElementById('concepts');
  conceptsDiv.innerHTML = '';
  if (shader.concepts && shader.concepts.length > 0) {
    shader.concepts.forEach(concept => {
      const tag = document.createElement('span');
      tag.className = 'concept-tag';
      tag.textContent = concept;
      conceptsDiv.appendChild(tag);
    });
  }
  
  // Update code display
  document.getElementById('shaderCode').textContent = shader.code;
  
  // Hide overlay
  document.getElementById('canvasOverlay').classList.add('hidden');
  
  // Load shader
  loadShader(shader);
  
  // Update navigation
  document.getElementById('prevBtn').disabled = index === 0;
  document.getElementById('nextBtn').disabled = index === shaders.length - 1;
  
  // Update sidebar
  renderShaderList();
  
  // Save progress
  saveProgress();
}

function updateProgress() {
  const percentage = (completedShaders.size / shaders.length) * 100;
  document.getElementById('progressFill').style.width = percentage + '%';
}

function updatePlayPauseButton() {
  const btn = document.getElementById('playPauseBtn');
  btn.textContent = isPaused ? '▶️' : '⏸️';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Navigation
  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentIndex > 0) {
      selectShader(currentIndex - 1);
    }
  });
  
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentIndex < shaders.length - 1) {
      // Mark current as completed
      completedShaders.add(currentIndex);
      selectShader(currentIndex + 1);
    }
  });
  
  // Play/Pause
  document.getElementById('playPauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    updatePlayPauseButton();
    if (!isPaused) {
      animate();
    }
  });
  
  // Fullscreen
  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    const canvas = document.getElementById('glCanvas');
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    }
  });
  
  // Copy code
  document.getElementById('copyCodeBtn').addEventListener('click', async () => {
    const code = shaders[currentIndex].code;
    try {
      await navigator.clipboard.writeText(code);
      const btn = document.getElementById('copyCodeBtn');
      const oldText = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => {
        btn.textContent = oldText;
      }, 2000);
    } catch (err) {
      console.error('Error copying code:', err);
    }
  });
  
  // Reset progress
  document.getElementById('resetProgress').addEventListener('click', () => {
    if (confirm('¿Seguro que quieres reiniciar tu progreso?')) {
      completedShaders.clear();
      saveProgress();
      selectShader(0);
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      selectShader(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < shaders.length - 1) {
      completedShaders.add(currentIndex);
      selectShader(currentIndex + 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      isPaused = !isPaused;
      updatePlayPauseButton();
      if (!isPaused) animate();
    }
  });
}

// ===== PROGRESS PERSISTENCE =====
function saveProgress() {
  localStorage.setItem('shader-journey-completed', JSON.stringify(Array.from(completedShaders)));
  localStorage.setItem('shader-journey-current', currentIndex);
}

function loadProgress() {
  const saved = localStorage.getItem('shader-journey-completed');
  if (saved) {
    completedShaders = new Set(JSON.parse(saved));
  }
  
  const current = localStorage.getItem('shader-journey-current');
  if (current !== null) {
    currentIndex = parseInt(current);
  }
}

// ===== START =====
init();
