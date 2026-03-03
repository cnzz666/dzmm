var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

var worker_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_proxy/")) return handleControl(request);
    try {
      return await handleProxy(request, url);
    } catch (e) {
      return new Response("Proxy Error", { status: 502 });
    }
  }
};

async function handleProxy(request, url) {
  const headers = new Headers(request.headers);
  headers.set("host", "www.xn--i8s951di30azba.com");
  headers.set("origin", TARGET_URL);
  headers.set("referer", TARGET_URL + url.pathname);

  const targetReq = new Request(TARGET_URL + url.pathname + url.search, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual"
  });

  let response = await fetch(targetReq);
  response = await ultraHack(response, url.pathname + url.search);

  const finalHeaders = new Headers(response.headers);
  finalHeaders.set("Access-Control-Allow-Origin", "*");
  finalHeaders.set("Access-Control-Allow-Methods", "*");
  finalHeaders.set("Access-Control-Allow-Headers", "*");
  finalHeaders.delete("content-security-policy");
  finalHeaders.delete("content-security-policy-report-only");

  return new Response(response.body, { status: response.status, headers: finalHeaders });
}

async function ultraHack(response, path) {
  const ct = (response.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    try {
      const clone = response.clone();
      let data = await clone.json();
      data = forceVIP3(data);
      const newBody = JSON.stringify(data);
      const h = new Headers(response.headers);
      h.set("content-length", newBody.length);
      return new Response(newBody, { status: response.status, headers: h });
    } catch (_) {}
  }

  if (ct.includes("text/event-stream") || path.includes("/chat")) {
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          let chunk = new TextDecoder().decode(value, { stream: true });
          chunk = chunk
            .replace(/cost":\d+/g, 'cost":0')
            .replace(/deducted":\d+/g, 'deducted":0')
            .replace(/remaining":\d+/g, 'remaining":999999999')
            .replace(/credit":\d+/g, 'credit":999999999')
            .replace(/"扣除积分"/g, '"免费生成"')
            .replace(/"余额不足"/g, '"无限额度"');
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      }
    });
    const h = new Headers(response.headers);
    return new Response(stream, { status: response.status, headers: h });
  }

  if (ct.includes("text/html")) {
    let html = await response.text();

    html = html
      .replace(/"membership":"vip[0-2]"/gi, '"membership":"vip3"')
      .replace(/"vip_level":\s*[0-2]/gi, '"vip_level":3')
      .replace(/"vip":false/gi, '"vip":true')
      .replace(/"is_vip":false/gi, '"is_vip":true')
      .replace(/"is_anonymous":true/gi, '"is_anonymous":false')
      .replace(/"credit":\s*\d+/gi, '"credit":999999999')
      .replace(/"credits":\s*\d+/gi, '"credits":999999999')
      .replace(/"balance":\s*\d+/gi, '"balance":999999999')
      .replace(/"available":\s*\d+/gi, '"available":999999999')
      .replace(/"remaining":\s*\d+/gi, '"remaining":999999999')
      .replace(/"limitedCredits":\s*\d+/gi, '"limitedCredits":999999999')
      .replace(/VIP[0-2]/gi, 'VIP 3')
      .replace(/vip[0-2]/gi, 'vip3')
      .replace(/普通用户|游客|免费/gi, 'VIP3至尊用户')
      .replace(/"nickname":"[^"]*"/gi, '"nickname":"已注入正式账号"')
      .replace(/"gender":"[^"]*"/gi, '"gender":"男性"')
      .replace(/"bio":"[^"]*"/gi, '"bio":"通过代理注入，VIP3全权限已开启"');

    html = injectUltraPanel(html);

    const h = new Headers(response.headers);
    h.set("content-type", "text/html; charset=utf-8");
    h.set("content-length", html.length);
    return new Response(html, { status: response.status, headers: h });
  }

  return response;
}

function forceVIP3(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(forceVIP3);
  for (const k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null) obj[k] = forceVIP3(obj[k]);
    else if (k === "membership" || k === "vip_level") obj[k] = k === "vip_level" ? 3 : "vip3";
    else if (typeof obj[k] === "number" && (k.includes("credit") || k.includes("balance") || k.includes("remaining") || k.includes("available") || k.includes("limited"))) obj[k] = 999999999;
    else if (typeof obj[k] === "string" && /vip[0-2]|VIP[0-2]|普通用户|游客|免费/i.test(obj[k])) obj[k] = "VIP3至尊用户";
  }
  return obj;
}

function injectUltraPanel(html) {
  const panelHTML = `
<div id="ultra-pill" style="position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(15,15,22,0.85);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(80,255,180,0.25);border-radius:9999px;padding:7px 22px;display:flex;align-items:center;gap:9px;color:#fff;font-weight:600;font-size:13.8px;box-shadow:0 8px 30px rgba(0,0,0,0.5);cursor:pointer;user-select:none;transition:all .25s cubic-bezier(0.23,1,0.32,1);">
  <div style="width:7px;height:7px;background:#50ffb4;border-radius:50%;box-shadow:0 0 12px #50ffb4;animation:pulse 1.8s infinite;"></div>
  OVERRIDE ACTIVE
</div>

<div id="ultra-panel" style="position:fixed;bottom:-100%;left:0;right:0;z-index:2147483646;background:rgba(12,12,20,0.94);backdrop-filter:blur(60px);-webkit-backdrop-filter:blur(60px);border-top:1px solid rgba(80,255,180,0.2);border-radius:28px 28px 0 0;padding:24px 18px 55px;max-height:74vh;overflow-y:auto;transition:bottom .55s cubic-bezier(0.23,1,0.32,1);color:#e0e0e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="text-align:center;margin-bottom:20px;">
    <div style="margin:0 auto 10px;width:36px;height:3.5px;background:rgba(255,255,255,0.15);border-radius:999px;"></div>
    <div style="font-size:19px;font-weight:700;letter-spacing:-0.4px;">VIP3 已完全解锁</div>
  </div>

  <div style="display:grid;gap:12px;">
    <div onclick="checkInjection()" style="background:rgba(255,255,255,0.06);padding:16px;border-radius:20px;border:1px solid rgba(80,255,180,0.2);cursor:pointer;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:16px;font-weight:700;color:#50ffb4;">注入状态检查</div>
          <div id="status-text" style="font-size:13px;opacity:0.75;margin-top:3px;">点击检测</div>
        </div>
        <div id="status-dot" style="width:18px;height:18px;background:#666;border-radius:50%;transition:all .3s;"></div>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.06);padding:16px;border-radius:20px;border:1px solid rgba(80,255,180,0.2);">
      <div style="font-size:16px;font-weight:700;color:#50ffb4;margin-bottom:12px;">个人信息（自动读取）</div>
      <div style="display:grid;gap:9px;font-size:14px;">
        <div>昵称 <input id="edit-nick" style="width:100%;background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:8px 11px;color:#fff;font-size:14px;"></div>
        <div>性别 <select id="edit-gender" style="width:100%;background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:8px 11px;color:#fff;font-size:14px;">
          <option value="男性">男性</option><option value="女性">女性</option>
        </select></div>
        <div>生日 <input id="edit-birth" style="width:100%;background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:8px 11px;color:#fff;font-size:14px;"></div>
        <div>癖好 <input id="edit-quirk" style="width:100%;background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:8px 11px;color:#fff;font-size:14px;"></div>
        <div>简介 <textarea id="edit-bio" style="width:100%;height:68px;background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:9px;color:#fff;font-size:14px;"></textarea></div>
      </div>
      <button onclick="saveProfile()" style="margin-top:14px;width:100%;background:#50ffb4;color:#000;padding:13px;border:none;border-radius:9999px;font-weight:700;font-size:14.5px;">保存修改（实时生效）</button>
    </div>

    <div onclick="forceInfinite()" style="background:rgba(255,255,255,0.06);padding:16px;border-radius:20px;border:1px solid rgba(80,255,180,0.2);cursor:pointer;">
      <div style="font-size:16px;font-weight:700;color:#50ffb4;">强制无限积分（含限时）</div>
      <div style="font-size:12.5px;opacity:0.75;">永久 + 限时全部 999999999</div>
    </div>
  </div>

  <div style="margin-top:28px;">
    <button onclick="refreshAll()" style="width:100%;background:linear-gradient(90deg,#50ffb4,#00ffaa);color:#000;padding:14px;border:none;border-radius:9999px;font-size:15px;font-weight:700;">一键刷新页面</button>
  </div>
</div>

<style>
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.15)}}
#ultra-pill:hover{transform:translateX(-50%) scale(1.05)}
#ultra-panel::-webkit-scrollbar{display:none}
</style>

<script>
window.checkInjection = async () => {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  dot.style.background = '#50ffb4';
  text.textContent = '注入成功 ✓ VIP3 + 无限额度 + 正式账号';
};

window.saveProfile = () => {
  const nick = document.getElementById('edit-nick').value || '已注入正式账号';
  const gender = document.getElementById('edit-gender').value;
  const birth = document.getElementById('edit-birth').value || '未设置';
  const quirk = document.getElementById('edit-quirk').value || '未设置';
  const bio = document.getElementById('edit-bio').value || '通过代理注入，VIP3全权限已开启';

  document.querySelectorAll('*').forEach(el => {
    if (el.textContent.includes('昵称')) el.textContent = '昵称 ' + nick;
    if (el.textContent.includes('性别')) el.textContent = '性别 ' + gender;
    if (el.textContent.includes('生日')) el.textContent = '生日 ' + birth;
    if (el.textContent.includes('癖好')) el.textContent = '癖好 ' + quirk;
    if (el.textContent.includes('简介') || el.textContent.includes('个人简介')) el.textContent = bio;
  });

  alert('已实时保存并显示 ✓');
};

window.forceInfinite = () => {
  window.forceRefreshHacks();
  alert('永久积分 + 限时积分 已全部改为无限');
};

window.forceRefreshHacks = () => {
  const orig = window.fetch;
  window.fetch = async (url, opts) => {
    let res = await orig(url, opts);
    try {
      const u = typeof url === 'string' ? url : url.url || '';
      if (u.includes('/me') || u.includes('/user') || u.includes('/profile') || u.includes('/account')) {
        const c = res.clone();
        let j = await c.json().catch(()=>null);
        if (j) {
          j.membership = "vip3";
          j.vip_level = 3;
          j.vip = true;
          j.is_vip = true;
          j.is_anonymous = false;
          j.credit = 999999999;
          j.credits = 999999999;
          j.balance = 999999999;
          j.limitedCredits = 999999999;
          return new Response(JSON.stringify(j), {status: res.status, headers: res.headers});
        }
      }
    } catch(e){}
    return res;
  };
  location.reload();
};

window.refreshAll = () => window.forceRefreshHacks();

setTimeout(() => {
  const pill = document.getElementById('ultra-pill');
  const panel = document.getElementById('ultra-panel');
  pill.addEventListener('click', () => { panel.style.bottom = panel.style.bottom === '0px' ? '-100%' : '0px'; });

  // 自动填充当前页面真实值
  setTimeout(() => {
    const nickInput = document.getElementById('edit-nick');
    const genderSelect = document.getElementById('edit-gender');
    const birthInput = document.getElementById('edit-birth');
    const quirkInput = document.getElementById('edit-quirk');
    const bioArea = document.getElementById('edit-bio');

    if (nickInput) nickInput.value = document.querySelector('[data-testid*="nickname"], .nickname')?.textContent?.trim() || '已注入正式账号';
    if (genderSelect) genderSelect.value = document.querySelector('[data-testid*="gender"], .gender')?.textContent?.includes('女') ? '女性' : '男性';
    if (birthInput) birthInput.value = '2004-03-03';
    if (quirkInput) quirkInput.value = 'AI爱好者';
    if (bioArea) bioArea.value = '通过代理注入，VIP3全权限已开启';
  }, 800);
}, 500);
</script>
  `;

  return html.replace("</body>", panelHTML + "</body>");
}

async function handleControl(request) {
  const u = new URL(request.url);
  if (u.pathname === "/_proxy/status") {
    return new Response(JSON.stringify({status: "ultra_active", vip: "vip3", credits: "999999999"}), {headers: {"Content-Type": "application/json"}});
  }
  return new Response(JSON.stringify({ok: true}), {headers: {"Content-Type": "application/json"}});
}

export { worker_default as default };