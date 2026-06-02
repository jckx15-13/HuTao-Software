import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting Phase 3: WebGL & UI Chaos Test');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox'] 
  });
  const page = await browser.newPage();
  
  let webglErrors = 0;
  let unhandledRejections = 0;

  page.on('console', msg => {
    const text = msg.text().toLowerCase();
    if (text.includes('webgl') && (text.includes('context lost') || text.includes('error'))) {
      webglErrors++;
      console.log(`[WebGL Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    unhandledRejections++;
    console.log(`[Page Error] ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3005 ...');
    await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('App loaded. Waiting for React to mount...');
    await new Promise(r => setTimeout(r, 5000)); // wait for cesium and react to settle
    
    console.log('Collecting baseline memory metrics.');
    const metricsBefore = await page.metrics();
    
    // Simulate UI Torture: We will toggle interaction modes if they exist in the DOM,
    // or just hammer window.useUIStore
    console.log('Executing Strobe Light Mode Toggle (50 iterations)...');
    
    await page.evaluate(async () => {
      const store = window.useUIStore && window.useUIStore.getState();
      if (!store) throw new Error('useUIStore not exposed to window');
      
      for(let i=0; i<50; i++) {
        const mode = i % 2 === 0 ? 'telescope' : 'orbital';
        store.setInteractionMode(mode);
        // Add a slight delay to allow React to mount/unmount components
        await new Promise(r => setTimeout(r, 50)); 
      }
      
      // Restore default
      store.setInteractionMode('orbital');
    });

    // Wait a moment for final renders
    await new Promise(r => setTimeout(r, 2000));
    
    const metricsAfter = await page.metrics();
    
    console.log('--- Test Results ---');
    console.log(`JSHeapUsedSize Before: ${(metricsBefore.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`JSHeapUsedSize After:  ${(metricsAfter.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`WebGL Context Errors:  ${webglErrors}`);
    console.log(`Unhandled Rejections:  ${unhandledRejections}`);
    
    if (webglErrors > 0) {
      console.error('FAILED: WebGL context was lost or threw errors during chaos test.');
      process.exit(1);
    }
    
    if (unhandledRejections > 0) {
      console.error('FAILED: Unhandled exceptions occurred during rapid component unmounting.');
      process.exit(1);
    }
    
    const memDiff = (metricsAfter.JSHeapUsedSize - metricsBefore.JSHeapUsedSize) / 1024 / 1024;
    if (memDiff > 150) {
      console.error(`FAILED: Severe memory leak detected (${memDiff.toFixed(2)} MB growth). Components are not unmounting cleanly.`);
      process.exit(1);
    }

    console.log('SUCCESS: UI withstood chaos test without WebGL crashes or severe memory leaks.');
  } catch (err) {
    console.error('Test Execution Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
