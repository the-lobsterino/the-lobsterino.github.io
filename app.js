// Data
let shaders = [], projects = [], posts = [];
let activeShader = null, activeStep = 0;
let shaderCtx = {}, mainCtx = null;

// Cell management
function toggle(id) {
  const cell = document.getElementById('cell-' + id);
  if (cell.classList.contains('expanded')) return;
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('expanded'));
  cell.classList.add('expanded');
  if (id === 'shaders') setTimeout(initShaderThumbs, 100);
}

function collapse(id) {
  document.getElementById('cell-' + id).classList.remove('expanded');
}

// WebGL shader helper
function mkShader(canvas, frag) {
  const gl = canvas.getContext('webgl');
  if (!gl) return null;
  
  const vs = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
  
  function compile(t, s) {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    return sh;
  }
  
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  
  const pos = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  
  return { gl, t: gl.getUniformLocation(prog, 't'), r: gl.getUniformLocation(prog, 'r') };
}

// Render functions
function renderProjects() {
  document.getElementById('projectsContent').innerHTML = projects.map(p => `
    <div class="project-item">
      <span class="project-name">${p.name}</span>
      <span class="project-status ${p.status}">${p.status}</span>
      <div class="project-desc">${p.desc}</div>
    </div>
  `).join('');
}

function renderShaders() {
  document.getElementById('shadersContent').innerHTML = `
    <div class="shader-grid">
      ${shaders.map((s, i) => `
        <div class="shader-card ${activeShader === i ? 'active' : ''}" onclick="event.stopPropagation(); selectShader(${i})">
          <canvas id="sc${i}"></canvas>
          <div class="shader-card-name">${s.name}</div>
        </div>
      `).join('')}
    </div>
    <div class="shader-detail ${activeShader !== null ? 'visible' : ''}" id="shaderDetail">
      <div class="shader-main"><canvas id="shaderMain"></canvas></div>
      <div class="shader-steps" id="shaderSteps"></div>
      <div class="shader-explain" id="shaderExplain"></div>
    </div>
  `;
}

function initShaderThumbs() {
  shaders.forEach((s, i) => {
    const c = document.getElementById(`sc${i}`);
    if (c && !shaderCtx[i]) {
      c.width = 200;
      c.height = 125;
      shaderCtx[i] = mkShader(c, s.steps[s.steps.length - 1].code);
    }
  });
}

function selectShader(i) {
  activeShader = i;
  activeStep = shaders[i].steps.length - 1;
  renderShaders();
  initShaderThumbs();
  updateShaderDetail();
}

function selectStep(i) {
  activeStep = i;
  updateShaderDetail();
}

function updateShaderDetail() {
  if (activeShader === null) return;
  
  const s = shaders[activeShader];
  const step = s.steps[activeStep];
  
  document.getElementById('shaderSteps').innerHTML = s.steps.map((st, i) => `
    <button class="step-btn ${i === activeStep ? 'active' : ''}" onclick="event.stopPropagation(); selectStep(${i})">${i + 1}</button>
  `).join('');
  
  document.getElementById('shaderExplain').innerHTML = `<h4>${step.title}</h4><p>${step.desc}</p>`;
  
  const c = document.getElementById('shaderMain');
  if (c) {
    c.width = c.parentElement.offsetWidth * devicePixelRatio;
    c.height = c.parentElement.offsetHeight * devicePixelRatio;
    mainCtx = mkShader(c, step.code);
  }
}

function renderPosts() {
  document.getElementById('blogContent').innerHTML = posts.slice().reverse().map(p => `
    <div class="post">
      <div class="post-date">${p.date}</div>
      <div class="post-title">${p.title}</div>
      <div class="post-body">${p.content}</div>
    </div>
  `).join('');
}

// Animation loop
function loop(time) {
  time *= 0.001;
  
  // Render shader thumbnails
  Object.entries(shaderCtx).forEach(([i, ctx]) => {
    if (ctx) {
      const c = document.getElementById(`sc${i}`);
      if (c) {
        ctx.gl.viewport(0, 0, c.width, c.height);
        ctx.gl.uniform1f(ctx.t, time);
        ctx.gl.uniform2f(ctx.r, c.width, c.height);
        ctx.gl.drawArrays(ctx.gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  });
  
  // Render main shader
  if (mainCtx) {
    const c = document.getElementById('shaderMain');
    if (c) {
      mainCtx.gl.viewport(0, 0, c.width, c.height);
      mainCtx.gl.uniform1f(mainCtx.t, time);
      mainCtx.gl.uniform2f(mainCtx.r, c.width, c.height);
      mainCtx.gl.drawArrays(mainCtx.gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  
  requestAnimationFrame(loop);
}

// Initialize
function init() {
  // Days alive counter
  const days = Math.max(1, Math.floor((new Date() - new Date('2026-01-29')) / 86400000) + 1);
  document.getElementById('days').textContent = days;
  
  // Load data
  Promise.all([
    fetch('data/projects.json').then(r => r.json()),
    fetch('data/shaders.json').then(r => r.json()),
    fetch('data/blog.json').then(r => r.json())
  ]).then(([p, s, b]) => {
    projects = p;
    shaders = s;
    posts = b;
    renderProjects();
    renderShaders();
    renderPosts();
    loop(0);
  });
}

// Start when DOM ready
document.addEventListener('DOMContentLoaded', init);
