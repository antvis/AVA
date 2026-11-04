#!/usr/bin/env node
/** Apply, verify, remove, or watch an OPCspace skin through loopback Codex CDP. */

import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const MARKER = "opcspace-live-skin";

function parseArgs(argv) {
  const args = { command: argv[2], port: 9341, interval: 1800 };
  for (let i = 3; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const name = key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    args[name] = value;
    i += 1;
  }
  args.port = Number(args.port);
  args.interval = Number(args.interval);
  if (!new Set(["check", "apply", "verify", "remove", "watch"]).has(args.command)) {
    throw new Error("Usage: live_skin_injector.mjs <check|apply|verify|remove|watch> --port 9341 [--preset file --identity file]");
  }
  return args;
}

function mimeFor(path) {
  return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" })[extname(path).toLowerCase()];
}

async function targets(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw new Error(`CDP target list failed: ${response.status}`);
  const all = await response.json();
  const pages = all.filter((target) => target.type === "page" && target.title === "Codex" && target.url?.startsWith("app://") && target.webSocketDebuggerUrl);
  if (!pages.length) throw new Error("No expected app:// Codex renderer target found");
  return pages;
}

class CDP {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); }
  async open() {
    if (typeof WebSocket !== "function") throw new Error("Node.js 20+ with global WebSocket is required");
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP WebSocket timeout")), 3000);
      this.socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP WebSocket failed")); }, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    });
  }
  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket?.close(); }
}

function cssFor(preset) {
  const p = preset.palette;
  const appearance = preset.appearance === "dark" ? "dark" : "light";
  const variant = preset.runtime?.variant || "default";
  const avatarOpacity = Number.isFinite(preset.runtime?.avatarOpacity) ? preset.runtime.avatarOpacity : 0.18;
  const variantCss = variant === "signal-atelier" ? `
html.${MARKER} body{background-image:linear-gradient(color-mix(in srgb,${p.line} 26%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,${p.line} 26%,transparent) 1px,transparent 1px)!important;background-size:32px 32px!important}
html.${MARKER} .opcspace-live-sidebar{box-shadow:inset -3px 0 0 color-mix(in srgb,${p.focus} 26%,transparent)!important}
html.${MARKER} .opcspace-live-main{background-image:radial-gradient(circle at 82% 12%,color-mix(in srgb,${p.focus} 14%,transparent),transparent 24%),linear-gradient(color-mix(in srgb,${p.line} 20%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,${p.line} 20%,transparent) 1px,transparent 1px)!important;background-size:auto,32px 32px,32px 32px!important}
html.${MARKER} .opcspace-live-composer{border-radius:8px!important;border-top:2px solid ${p.accent}!important;box-shadow:0 14px 34px #0008!important}
html.${MARKER} .opcspace-live-suggestion{border-radius:7px!important;border-top:2px solid ${p.accent}!important;box-shadow:0 10px 24px #0006!important}
#opcspace-live-skin-chrome::before{content:"X 064 / Y 128   ·   CHANNEL 11   ·   LOCAL SIGNAL";position:absolute;left:calc(260px + 20px);top:50px;color:${p.focus};font:600 9px/1.2 ui-monospace,monospace;letter-spacing:.14em}
` : "";
  return `
html.${MARKER},html.${MARKER}.electron-light,html.${MARKER}.electron-dark {
  --opc-canvas:${p.canvas};--opc-surface:${p.surface};--opc-raised:${p.surfaceRaised};
  --opc-ink:${p.ink};--opc-muted:${p.mutedInk};--opc-accent:${p.accent};
  --opc-accent-soft:${p.accentSoft};--opc-line:${p.line};--opc-focus:${p.focus};
  --color-token-bg-primary:${p.canvas}!important;--color-token-bg-secondary:${p.surface}!important;
  --color-token-bg-tertiary:${p.accentSoft}!important;--color-token-foreground:${p.ink}!important;
  --color-token-main-surface-primary:${p.surfaceRaised}!important;--color-token-side-bar-background:${p.surface}!important;
  --color-token-text-primary:${p.ink}!important;--color-token-text-secondary:${p.mutedInk}!important;
  --color-token-text-tertiary:${p.mutedInk}!important;--color-token-link:${p.focus}!important;
  --color-token-border:${p.line}!important;--color-token-border-default:${p.line}!important;
  --color-token-focus-border:${p.focus}!important;--color-token-text-link-foreground:${p.focus}!important;
  --color-token-button-background:${p.accent}!important;--color-token-button-foreground:${p.surfaceRaised}!important;
  --color-background-accent:${p.accent}!important;--color-text-accent:${p.focus}!important;
  --color-icon-accent:${p.accent}!important;color-scheme:${appearance}!important;
}
html.${MARKER} body,html.${MARKER} #root{background:${p.canvas}!important;color:${p.ink}!important}
html.${MARKER} body::before,html.${MARKER} body::after{content:none!important;display:none!important}
html.${MARKER} .opcspace-live-sidebar{background:linear-gradient(180deg,${p.surface},color-mix(in srgb,${p.accentSoft} 24%,${p.surface}))!important;border-color:${p.line}!important}
html.${MARKER} .opcspace-live-sidebar,html.${MARKER} .opcspace-live-sidebar *{color:${p.ink}!important}
html.${MARKER} .opcspace-live-main{background:radial-gradient(circle at 88% 10%,color-mix(in srgb,${p.accentSoft} 32%,transparent),transparent 32%),${p.surfaceRaised}!important}
html.${MARKER} .opcspace-live-composer{border:1px solid ${p.line}!important;border-radius:20px!important;background:color-mix(in srgb,${p.surfaceRaised} 94%,transparent)!important;box-shadow:0 12px 30px color-mix(in srgb,${p.ink} 10%,transparent)!important}
html.${MARKER} .opcspace-live-suggestion{border-radius:18px!important;border-color:${p.line}!important;background:color-mix(in srgb,${p.surface} 90%,transparent)!important}
#opcspace-live-skin-chrome{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}
#opcspace-live-skin-chrome .opcspace-live-badge{position:absolute;right:20px;top:10px;padding:6px 11px;border:1px solid ${p.line};border-radius:999px;background:color-mix(in srgb,${p.surfaceRaised} 90%,transparent);color:${p.focus};font:600 10px/1.2 system-ui;letter-spacing:.06em;backdrop-filter:blur(10px)}
#opcspace-live-skin-chrome img{position:absolute;right:14px;bottom:4px;width:min(19vw,220px);height:min(31vh,280px);object-fit:contain;object-position:center bottom;opacity:${avatarOpacity};filter:drop-shadow(0 12px 18px color-mix(in srgb,${p.ink} 18%,transparent))}
html.${MARKER} button,html.${MARKER} [role=button],html.${MARKER} textarea,html.${MARKER} input{border-radius:max(8px,calc(10px * 1.18))!important}
@media(max-width:780px){#opcspace-live-skin-chrome img{opacity:.08;width:145px}}
@media(prefers-reduced-motion:reduce){html.${MARKER} *,html.${MARKER} *::before,html.${MARKER} *::after{animation-duration:.01ms!important}}
${variantCss}
`;
}

function applyExpression(payload) {
  return `(() => {
    const payload = ${JSON.stringify(payload)};
    const root = document.documentElement;
    root.classList.add(${JSON.stringify(MARKER)});
    root.dataset.opcspaceTheme = payload.themeId;
    root.dataset.opcspaceCanvas = payload.canvas;
    root.dataset.opcspaceVariant = payload.variant;
    let style = document.getElementById('opcspace-live-skin-style');
    if (!style) { style = document.createElement('style'); style.id = 'opcspace-live-skin-style'; document.head.append(style); }
    style.textContent = payload.css;
    let chrome = document.getElementById('opcspace-live-skin-chrome');
    if (!chrome) { chrome = document.createElement('div'); chrome.id = 'opcspace-live-skin-chrome'; chrome.setAttribute('aria-hidden','true'); document.body.append(chrome); }
    chrome.innerHTML = '<span class="opcspace-live-badge"></span><img alt="">';
    chrome.querySelector('span').textContent = payload.label;
    chrome.querySelector('img').src = payload.identity;
    const mark = () => {
      document.querySelectorAll('.opcspace-live-sidebar,.opcspace-live-main,.opcspace-live-composer,.opcspace-live-suggestion').forEach(el => el.classList.remove('opcspace-live-sidebar','opcspace-live-main','opcspace-live-composer','opcspace-live-suggestion'));
      const sidebar = document.querySelector('aside'); if (sidebar) sidebar.classList.add('opcspace-live-sidebar');
      const main = document.querySelector('main,[role="main"]'); if (main) main.classList.add('opcspace-live-main');
      const composer = document.querySelector('.composer-surface-chrome,[contenteditable="true"]')?.closest('form,[class*="composer"],div'); if (composer) composer.classList.add('opcspace-live-composer');
      document.querySelectorAll('[class~="group/home-suggestions"] button').forEach(el => el.classList.add('opcspace-live-suggestion'));
    };
    mark();
    window.__opcspaceLiveSkinObserver?.disconnect();
    window.__opcspaceLiveSkinObserver = new MutationObserver(mark);
    window.__opcspaceLiveSkinObserver.observe(document.body,{childList:true,subtree:true});
    return { applied:true, themeId:payload.themeId, canvas:getComputedStyle(root).getPropertyValue('--color-token-bg-primary').trim(), sidebar:!!document.querySelector('aside'), main:!!document.querySelector('main,[role="main"]'), composer:!!document.querySelector('.composer-surface-chrome,[contenteditable="true"]'), nativeButtons:document.querySelectorAll('button').length };
  })()`;
}

const VERIFY_EXPRESSION = `(() => ({
  applied: document.documentElement.classList.contains('${MARKER}'),
  themeId: document.documentElement.dataset.opcspaceTheme || null,
  variant: document.documentElement.dataset.opcspaceVariant || null,
  expectedCanvas: document.documentElement.dataset.opcspaceCanvas || null,
  computedCanvas: getComputedStyle(document.documentElement).getPropertyValue('--color-token-bg-primary').trim(),
  style: !!document.getElementById('opcspace-live-skin-style'),
  chrome: !!document.getElementById('opcspace-live-skin-chrome'),
  badgeText: document.querySelector('#opcspace-live-skin-chrome span')?.textContent || null,
  bodyBackground: getComputedStyle(document.body).backgroundColor,
  rootBackground: (()=>{const e=document.getElementById('root');return e?getComputedStyle(e).backgroundColor:null})(),
  sidebarBackground: (()=>{const e=document.querySelector('aside');return e?getComputedStyle(e).backgroundColor:null})(),
  sidebarTextColor: (()=>{const e=document.querySelector('aside button,aside [role="button"],aside a');return e?getComputedStyle(e).color:null})(),
  mainBackground: (()=>{const e=document.querySelector('main,[role="main"]');return e?getComputedStyle(e).backgroundColor:null})(),
  composerBackground: (()=>{const e=document.querySelector('.opcspace-live-composer');return e?getComputedStyle(e).backgroundColor:null})(),
  bodyBackgroundImage: getComputedStyle(document.body).backgroundImage,
  imageLoaded: (()=>{const i=document.querySelector('#opcspace-live-skin-chrome img');return !!i && i.complete && i.naturalWidth>0})(),
  sidebar: !!document.querySelector('aside'), main: !!document.querySelector('main,[role="main"]'),
  composer: !!document.querySelector('.composer-surface-chrome,[contenteditable="true"]'), nativeButtons: document.querySelectorAll('button').length,
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
}))()`;

const REMOVE_EXPRESSION = `(() => {
  window.__opcspaceLiveSkinObserver?.disconnect(); delete window.__opcspaceLiveSkinObserver;
  document.getElementById('opcspace-live-skin-style')?.remove(); document.getElementById('opcspace-live-skin-chrome')?.remove();
  document.documentElement.classList.remove('${MARKER}'); delete document.documentElement.dataset.opcspaceTheme; delete document.documentElement.dataset.opcspaceCanvas; delete document.documentElement.dataset.opcspaceVariant;
  document.querySelectorAll('.opcspace-live-sidebar,.opcspace-live-main,.opcspace-live-composer,.opcspace-live-suggestion').forEach(el => el.classList.remove('opcspace-live-sidebar','opcspace-live-main','opcspace-live-composer','opcspace-live-suggestion'));
  return {removed:true};
})()`;

async function evaluateTarget(target, expression) {
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.open();
  try {
    const result = await cdp.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Renderer evaluation failed");
    return result.result?.value;
  } finally { cdp.close(); }
}

async function payloadFrom(args) {
  if (!args.preset || !args.identity) throw new Error("apply/watch require --preset and --identity");
  const preset = JSON.parse(await readFile(args.preset, "utf8"));
  const mime = mimeFor(args.identity);
  if (!preset.id || !preset.palette || !mime) throw new Error("Invalid preset or identity type");
  const data = (await readFile(args.identity)).toString("base64");
  return { themeId: preset.id, appearance: preset.appearance || "light", variant: preset.runtime?.variant || "default", canvas: preset.palette.canvas, label: preset.runtime?.badgeLabel || `${preset.label || preset.id} · OPCspace Codex`, css: cssFor(preset), identity: `data:${mime};base64,${data}` };
}

async function runOnce(args, payload) {
  const pages = await targets(args.port);
  const expression = args.command === "remove" ? REMOVE_EXPRESSION : args.command === "verify" ? VERIFY_EXPRESSION : applyExpression(payload);
  const results = [];
  for (const page of pages) results.push({ id: page.id, url: page.url, result: await evaluateTarget(page, expression) });
  if (args.command === "verify") {
    for (const { result } of results) {
      if (!result.applied || !result.style || !result.chrome || !result.imageLoaded || !result.badgeText || !result.expectedCanvas || result.computedCanvas.toLowerCase() !== result.expectedCanvas.toLowerCase() || !result.sidebar || !result.main || !result.composer || result.nativeButtons < 1 || result.overflowX) {
        throw new Error(`Live skin verification failed: ${JSON.stringify(result)}`);
      }
    }
  }
  return results;
}

async function runWithRetry(args, payload) {
  if (args.command !== "verify") return runOnce(args, payload);
  let lastError;
  for (let attempt = 1; attempt <= 16; attempt += 1) {
    try { return await runOnce(args, payload); } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError;
}

const args = parseArgs(process.argv);
const payload = new Set(["check", "apply", "watch"]).has(args.command) ? await payloadFrom(args) : null;
if (args.command === "check") {
  console.log(JSON.stringify({ command: "check", themeId: payload.themeId, appearance: payload.appearance, variant: payload.variant, cssBytes: Buffer.byteLength(payload.css), identityBytes: Buffer.byteLength(payload.identity) }, null, 2));
} else if (args.command !== "watch") {
  console.log(JSON.stringify({ command: args.command, port: args.port, targets: await runWithRetry(args, payload) }, null, 2));
} else {
  console.log(JSON.stringify({ command: "watch", port: args.port, started: true }));
  for (;;) {
    try { await runOnce({ ...args, command: "apply" }, payload); } catch (error) { console.error(error.message); }
    await new Promise((resolve) => setTimeout(resolve, args.interval));
  }
}
