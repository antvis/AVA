import {readFile,chmod,mkdir,writeFile} from 'fs/promises';
import {homedir} from 'os';
import {join} from 'path';

function pair(appId:unknown, appSecret: unknown, source:string){
    const id = typeof appId ==='string' ? appId :'';
    const secret = typeof appSecret === 'string' ? appSecret :'';
    if(id && secret){
        return {appId:id,appSecret:secret};
    }
    if(id || secret){
        throw new Error(`Feishu Bitable source ${source} requires both appId and appSecret`);
    }
    return undefined;
}

export async function feishuCredentials(options:{appId?:string;appSecret?:string;url?:string}){
    const configured = pair(options.appId,options.appSecret,'configuration')??
    pair(process.env.AVA_FEISHU_APP_ID,process.env.AVA_FEISHU_APP_SECRET,'environment variables');
    if(configured) return configured;
    try{
        const parsed = JSON.parse(await readFile(join(homedir(),'.ava','feishu.json'),'utf8')) as {appId?:unknown;appSecret?:unknown};
        const saved = pair(parsed?.appId,parsed?.appSecret,'~/.ava/feishu.json');
        if(saved) return saved;
    }catch(error){
        const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
        if(!missing){
            throw error instanceof SyntaxError ? new Error('~/.ava/feishu.json is not valid JSON') : error;
        }
    }
    if(process.stdin.isTTY) return bindFeishu(options.url);
    throw new Error('Feishu Bitable source requires appId and appSecret. Provide them via configuration, environment variables, or ~/.ava/feishu.json');
}

function ask(label:string,echo:boolean){
    process.stderr.write(label);
    const input = process.stdin;
    input.setRawMode(true);
    input.resume();
    return new Promise<string>((resolve)=>{
    let value = ''
    const onData = (chunk:Buffer)=>{
        const key = chunk.toString();
        if(key === '\u0003'){
            input.setRawMode(false);
            process.exit(130);
        }
        if(key === '\r' || key === '\n'){
            input.setRawMode(false);
            input.pause();
            input.off('data',onData);
            process.stderr.write('\n');
            resolve(value);
            return
        }
        if(key === '\u007f' || key ==='\b'){
            if(!value) return ;
            value = value.slice(0,-1);
            if(echo) process.stderr.write('\b \b');
            return;
        }
        else{
            value += key;
            if(echo) process.stderr.write(key);
        }   
    };
    input.on('data',onData);
    });
}

async function bindFeishu(url?:string){
    const host = url && /^https?:\/\//i.test(url)?new URL(url).hostname.toLowerCase():'';
    const origin = larkHost.test(host)?'https://open.larksuite.com':'https://open.feishu.cn';
    const path = join(homedir(),'.ava','feishu.json');
    for(;;){
        const appId = (await ask('App ID: ',true)).trim();
        if(!appId) throw new Error('已取消飞书应用绑定');
        const appSecret = (await ask('App Secret: ',false)).trim();
        const response = await fetch(`${origin}/open-apis/auth/v3/tenant_access_token/internal`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body:JSON.stringify({
                app_id:appId,
                app_secret:appSecret,
            }),
        });
        const body = (await response.json().catch(()=> undefined)) as {code?:unknown;tenant_access_token?:unknown};
        if(body?.code === 0 || typeof body.tenant_access_token === 'string' && body.tenant_access_token){
            await mkdir(join(homedir(),'.ava'),{recursive:true,mode:0o700})
            await writeFile(path,`${JSON.stringify({appId,appSecret})}\n`,{mode:0o600});
            await chmod(path,0o600);
            return {appId,appSecret};
        }
            process.stderr.write(`飞书应用绑定失败: ${body?.code} ${body?.tenant_access_token}\n`);
    }
}

const feishuHost = /(^|\.)feishu\.cn$/;
const larkHost = /(^|\.)larksuite\.com$/;

export function feishuUrl(dataset:string):URL | undefined{
    if(!/^https?:\/\//i.test(dataset)){
        return undefined;
    }
    const url = new URL(dataset);
    const host = url.hostname.toLowerCase();
    if(!feishuHost.test(host) && !larkHost.test(host)){
        return undefined;
    }
    return url;
}


export function isFeishuHostUrl(dataset:string):boolean{
    return feishuUrl(dataset) !== undefined;
}
export function isFeishuBitableUrl(dataset:string):boolean{
    const url = feishuUrl(dataset);
    if(!url){
        return false;
    }
    const segments = url.pathname.split('/').filter(Boolean).map((s)=>s.toLowerCase());
    return segments.includes('base') || segments.includes('wiki');
}