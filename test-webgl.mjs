import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Collect console messages
  const messages = [];
  page.on('console', msg => {
    messages.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', err => {
    messages.push({ type: 'error', text: err.message });
  });
  
  // Navigate to the page (use localhost server)
  await page.goto('http://localhost:8765/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  // Wait for shaders to compile
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot
  await page.screenshot({ path: 'test-screenshot.png', fullPage: false });
  
  // Check WebGL status
  const webglStatus = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl ? 'WebGL available' : 'WebGL NOT available';
  });
  
  console.log('WebGL:', webglStatus);
  console.log('\n=== Console messages ===');
  messages.forEach(m => console.log(`[${m.type}] ${m.text}`));
  
  await browser.close();
})();
