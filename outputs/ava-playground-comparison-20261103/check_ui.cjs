const {chromium}=require('/private/tmp/ava-notebook-clean-ci/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Users/banxuan/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
 const results=[];
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(__dirname+'/comparison.html').href);
  await page.evaluate(()=>document.fonts.ready);
  for(const width of [1440,1100,760]){
   await page.setViewportSize({width,height:1000});
   const m=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,columns:[...document.querySelectorAll('.column')].map(e=>Math.round(e.getBoundingClientRect().width)),tools:document.querySelectorAll('details').length,open:document.querySelectorAll('details[open]').length,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)}));
   if(m.scrollWidth>width||m.columns.length!==2||m.tools!==m.open||m.brokenImages.length)throw Error(JSON.stringify(m));
   if(width>900&&m.columns[0]!==m.columns[1])throw Error('Unequal columns');
   results.push(m);
  }
  const first=page.locator('summary').first();await first.focus();await page.keyboard.press('Enter');
  if(await page.locator('details').first().getAttribute('open')!==null)throw Error('Enter did not collapse');
  await page.keyboard.press('Enter');if(await page.locator('details').first().getAttribute('open')===null)throw Error('Enter did not expand');
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(__dirname+'/ui-validation.json',JSON.stringify({passed:true,results,keyboardToggle:true,errors},null,2)+'\n');
  console.log(JSON.stringify({passed:true,results,keyboardToggle:true,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
