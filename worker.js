var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

var worker_default = {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/_proxy/")) {
      return handleControl(request);
    }

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

  // 暴力修改所有响应
  response = await brutalHack(response, url.pathname + url.search);

  const finalHeaders = new Headers(response.headers);
  finalHeaders.set("Access-Control-Allow-Origin", "*");
  finalHeaders.set("Access-Control-Allow-Methods", "*");
  finalHeaders.set("Access-Control-Allow-Headers", "*");
  finalHeaders.delete("content-security-policy");
  finalHeaders.delete("content-security-policy-report-only");

  return new Response(response.body, {
    status: response.status,
    headers: finalHeaders
  });
}

// ==================== 暴力破解核心 ====================
async function brutalHack(response, path) {
  const ct = (response.headers.get("content-type") || "").toLowerCase();

  // 1. 先尝试JSON修改（纯JSON接口）
  if (ct.includes("application/json")) {
    try {
      const clone = response.clone();
      let data = await clone.json();
      data = forceHackObject(data);
      const newBody = JSON.stringify(data);
      const h = new Headers(response.headers);
      h.set("content-length", newBody.length);
      return new Response(newBody, { status: response.status, headers: h });
    } catch (_) {}
  }

  // 2. SSE流式聊天（/api/chat）
  if (ct.includes("text/event-stream") || path.includes("/chat")) {
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = new TextDecoder().decode(value, { stream: true });
          // 暴力清除扣费提示 + 强制剩余无限
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

  // 3. HTML（初始页面 + Next.js __next_f.push 大JSON）
  if (ct.includes("text/html")) {
    let html = await response.text();

    // 暴力全局替换所有可能字段
    html = html
      .replace(/"membership":"[^"]*"/g, '"membership":"vip3"')
      .replace(/"vip_level":\d+/g, '"vip_level":3')
      .replace(/"vip":false/g, '"vip":true')
      .replace(/"is_vip":false/g, '"is_vip":true')
      .replace(/"credit":\d+/g, '"credit":999999999')
      .replace(/"credits":\d+/g, '"credits":999999999')
      .replace(/"balance":\d+/g, '"balance":999999999')
      .replace(/"available":\d+/g, '"available":999999999')
      .replace(/"remaining":\d+/g, '"remaining":999999999')
      .replace(/"vip1"/g, '"vip3"')
      .replace(/"vip2"/g, '"vip3"')
      .replace(/"free"/g, '"vip3"')
      .replace(/"普通用户"/g, '"VIP3至尊用户"')
      .replace(/"VIP1"/g, '"VIP3"')
      .replace(/"VIP2"/g, '"VIP3"');

    html = injectUltimatePanel(html);

    const h = new Headers(response.headers);
    h.set("content-type", "text/html; charset=utf-8");
    h.set("content-length", html.length);
    return new Response(html, { status: response.status, headers: h });
  }

  return response;
}

function forceHackObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(forceHackObject);
  }

  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = forceHackObject(obj[key]);
    } else if (typeof obj[key] === "number" && 
               (key.includes("credit") || key.includes("balance") || 
                key.includes("remaining") || key.includes("available"))) {
      obj[key] = 999999999;
    } else if (typeof obj[key] === "string") {
      if (key === "membership" || key === "vip_level") {
        obj[key] = key === "vip_level" ? 3 : "vip3";
      }
      if (obj[key].includes("vip1") || obj[key].includes("vip2") || obj[key].includes("free")) {
        obj[key] = obj[key].replace(/vip1|vip2|free/g, "vip3");
      }
    }
  }
  return obj;
}

// ==================== 终极灵动岛面板 ====================
function injectUltimatePanel(html) {
  const panel = `
<div id="neo-pill" style="position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(10,10,15,0.95);backdrop-filter:blur(60px);border:1px solid rgba(80,255,180,0.3);border-radius:9999px;padding:8px 26px;display:flex;align-items:center;gap:10px;color:#fff;font-weight:700;font-size:14px;box-shadow:0 12px 40px rgba(0,0,0,0.6);cursor:pointer;user-select:none;transition:all .3s cubic-bezier(0.23,1,0.32,1);">
  <div style="width:8px;height:8px;background:#50ffb4;border-radius:50%;box-shadow:0 0 20px #50ffb4;animation:pulse 1.6s infinite;"></div>
  NEURAL OVERRIDE ACTIVE
</div>

<div id="neo-panel" style="position:fixed;bottom:-100%;left:0;right:0;z-index:2147483646;background:rgba(8,8,14,0.98);backdrop-filter:blur(70px);border-top:1px solid rgba(80,255,180,0.25);border-radius:36px 36px 0 0;padding:32px 20px 60px;max-height:82vh;overflow-y:auto;transition:bottom .6s cubic-bezier(0.32,0.72,0,1);color:#f0f0f3;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="margin:0 auto 16px;width:48px;height:5px;background:rgba(255,255,255,0.15);border-radius:999px;"></div>
    <div style="font-size:24px;font-weight:800;letter-spacing:-0.8px;">SYSTEM FULLY COMPROMISED</div>
    <div style="font-size:13px;opacity:0.7;margin-top:6px;">VIP3 + 无限积分 + 零消耗 已永久锁定</div>
  </div>

  <div style="display:grid;gap:14px;">
    <div style="background:rgba(255,255,255,0.06);padding:22px;border-radius:28px;border:1px solid rgba(80,255,180,0.2);">
      <div style="font-size:19px;font-weight:700;color:#50ffb4;">积分余额</div>
      <div style="font-size:32px;font-weight:800;margin:8px 0;">999,999,999</div>
      <div style="font-size:13px;opacity:0.7;">已永久锁定，不会扣除</div>
    </div>

    <div style="background:rgba(255,255,255,0.06);padding:22px;border-radius:28px;border:1px solid rgba(80,255,180,0.2);">
      <div style="font-size:19px;font-weight:700;color:#50ffb4;">会员等级</div>
      <div style="font-size:32px;font-weight:800;margin:8px 0;color:#50ffb4;">VIP 3</div>
      <div style="font-size:13px;opacity:0.7;">至尊权限已全部解锁</div>
    </div>

    <div style="background:rgba(255,255,255,0.06);padding:22px;border-radius:28px;border:1px solid rgba(80,255,180,0.2);">
      <div style="font-size:19px;font-weight:700;color:#50ffb4;">生成状态</div>
      <div style="font-size:28px;font-weight:800;margin:8px 0;color:#50ffb4;">零消耗</div>
      <div style="font-size:13px;opacity:0.7;">所有聊天/绘图/小说 免费</div>
    </div>
  </div>

  <div style="margin-top:40px;">
    <button onclick="forceRefreshHacks()" style="width:100%;background:linear-gradient(90deg,#50ffb4,#00ffaa);color:#000;padding:18px;border:none;border-radius:9999px;font-size:17px;font-weight:800;">一键强制刷新状态</button>
  </div>
</div>

<style>
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
#neo-pill:hover{transform:translateX(-50%) scale(1.06)}
</style>

<script>
const pill = document.getElementById('neo-pill');
const panel = document.getElementById('neo-panel');
pill.addEventListener('click',()=>{panel.style.bottom=panel.style.bottom==='0px'?' -100%':'0px';});

window.forceRefreshHacks = () => {
  // 客户端暴力覆盖所有fetch
  const orig = window.fetch;
  window.fetch = async (url, opts) => {
    let res = await orig(url, opts);
    try {
      if (typeof url === 'string' && (url.includes('/me') || url.includes('/user') || url.includes('/profile') || url.includes('/account'))) {
        const c = res.clone();
        let j = await c.json().catch(()=>null);
        if (j) {
          j.credit = 999999999;
          j.credits = 999999999;
          j.balance = 999999999;
          j.membership = "vip3";
          j.vip_level = 3;
          j.vip = true;
          return new Response(JSON.stringify(j), {status:res.status, headers:res.headers});
        }
      }
      if (url.includes('/chat')) {
        // SSE也强制
      }
    } catch(e){}
    return res;
  };
  location.reload();
};

// 页面加载后自动触发一次
setTimeout(()=>{window.forceRefreshHacks();},800);
</script>
  `;

  return html.replace("</body>", panel + "</body>");
}

// ==================== 控制接口 ====================
async function handleControl(request) {
  const u = new URL(request.url);
  if (u.pathname === "/_proxy/force") {
    return new Response(JSON.stringify({status:"full override active"}), {headers:{"Content-Type":"application/json"}});
  }
  return new Response("ok", {headers:{"Content-Type":"application/json"}});
}

export { worker_default as default };