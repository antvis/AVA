// A real main-agent review of executed AVA results; preserve the first answer and all requests.
import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
registerHooks({resolve(specifier,context,next){
 try{return next(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&context.parentURL){const candidate=new URL(specifier+'.ts',context.parentURL);if(existsSync(fileURLToPath(candidate)))return next(candidate.href,context);}
  throw error;
 }
}});
const require=createRequire(new URL('../../site/package.json',import.meta.url));
const {ToolLoopAgent}=await import(pathToFileURL(require.resolve('ai')));
const {createModel}=await import('../../site/ai/core/model.ts');
const format=process.argv.includes('--format');
const root=new URL(format?'./pair-01/ava/':'./ava-rerun/ava/',import.meta.url);
const read=(name)=>JSON.parse(readFileSync(new URL(name,root)));
const events=readFileSync(new URL('events.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const results=events.filter(e=>e.type==='tool-result'&&e.toolName==='analyze').map(e=>{
 const {html,...visualization}=e.output.visualization;
 return {...e.output,visualization};
});
assert.equal(results.length,5);assert(results.every(r=>r.visualization?.config));
const record=read('record.json');assert(record.completed);
const directory=new URL(format?'main-review-format/':'main-review/',root);assert(!existsSync(directory));mkdirSync(directory);
const rawFetch=globalThis.fetch;let count=0;const pending=[];
globalThis.fetch=async(input,init)=>{
 assert.equal(new URL(typeof input==='string'?input:input.url??String(input)).origin,'http://127.0.0.1:3345');
 const id=String(++count).padStart(2,'0');writeFileSync(new URL(id+'.request.json',directory),JSON.stringify(JSON.parse(init.body),null,2));
 const response=await rawFetch(input,init);pending.push(response.clone().text().then(value=>writeFileSync(new URL(id+'.response.txt',directory),value)));return response;
};
const agent=new ToolLoopAgent({
 model:createModel({apiKey:'local-comparison',baseURL:'http://127.0.0.1:3345/v1',model:'GLM-5.1'}),maxRetries:0,
 instructions:`你是 Data Agent 的主 Agent。把分析 Agent 已真实执行的结果汇总为最终答复，不重新调用工具，不补造数据。
 输出排版必须便于决策与浏览：用 Markdown 二级标题开头，直接给出当前投放结论，不写“根据以上分析”等引言。用三级标题清晰分区：📊 核心发现、🔍 下降集中在哪里、⚠️ 经营贡献变化、✅ 下一步行动。关键发现用加粗数字；总量用一个两行紧凑表，表头统一万元；渠道、品类、区域分别用清楚的小标题和一两句明确答案，紧接对应图表引用。下一步用“优先级 / 行动 / 需要的证据”三列表，只列三项可做的调查或验证，不给未经支持的渠道预算。最后用一条加粗的一句话结论收束。不要堆成长段落，不要为已有图表重复列完整原始数据表。语气清晰、直接，风格与普通 Agent 的结论卡片一致。
 每个拆解问题都要一句明确答案、关键数字和其支持图表的引用。覆盖整体、渠道销售变化、渠道经营贡献变化、品类、区域；已有五张图应分别引用实际 resultId，引用必须单独一行写 [[result:RESULT_ID]]。最后明确回答当前是否据此扩大投放。
 这是算术拆解，不是因果研究。渠道收入减少不能写成流量减少；不得断言排除了投放不足。经营贡献未扣广告和固定费用，不能写成净利润，也不能只凭贡献率变化确定是结构、价格或成本中的哪个原因。升降桌的下降额与整体净下降额比较时必须说明分母和其他品类的抵消，不得模糊写成“贡献50%以上”。
 现有变量不含广告费用、流量、转化率或实验增量；证据不足时，当前行动应是暂不支持仅据这些数据扩大投放、先补齐费用和增量效果验证，不是声称加投已被证明无效。不列虚构预算、ROI数值或把收入/经营贡献当广告ROI。
 原分析草稿有未经验证的因果措辞，不沿用它；只依据下面的执行结果与业务定义重新汇总。金额统一万元，保留两位；百分比说明变化率。避免重复大表，中文简洁呈现。`,
});
const semantic=JSON.parse(readFileSync(new URL('./inputs/semantic.json',import.meta.url)));
const prompt=JSON.stringify({question:'净销售额下降，要不要加大投放？',semantic,executedResults:results});
writeFileSync(new URL('input.json',directory),prompt);
const stream=await agent.stream({prompt});
for await(const event of stream.fullStream){if(event.type.startsWith('reasoning'))continue;appendFileSync(new URL('events.jsonl',directory),JSON.stringify(event)+'\n');if(event.type==='error')throw event.error;}
const answer=await stream.text;assert(answer.trim());
writeFileSync(new URL('answer.txt',directory),answer);writeFileSync(new URL('messages.json',directory),JSON.stringify(await stream.responseMessages,null,2));
writeFileSync(new URL('usage.json',directory),JSON.stringify(await stream.totalUsage,null,2));await Promise.all(pending);
globalThis.fetch=rawFetch;console.log('Main-agent review completed; original analysis answer retained.');
