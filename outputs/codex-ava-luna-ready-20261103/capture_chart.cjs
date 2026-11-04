const {chromium}=require('/private/tmp/ava-notebook-clean-ci/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
(async()=>{
 const output=__dirname+'/ava-chart-preview.png';
 if(fs.existsSync(output))throw Error('Output already exists');
 const browser=await chromium.launch({headless:true,executablePath:'/Users/banxuan/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
 try{
  const page=await browser.newPage({viewport:{width:640,height:300},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL('/Users/banxuan/Documents/AVA-test-skill-workspace/codex-ava-luna-ready-20261103/ava/output/net-sales-change.html').href,{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('canvas,svg'),{timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  if(errors.length)throw Error(errors.join('\n'));
  await page.screenshot({path:output});
  console.log(JSON.stringify({output,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
