var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

var worker_default = {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/_proxy/")) {
      return handleControlRequest(request);
    }

    try {
      return await handleMainProxy(request, url);
    } catch (error) {
      return new Response(`Proxy Error: ${error.message}`, { 
        status: 502, 
        headers: { "Content-Type": "text/plain; charset=utf-8" } 
      });
    }
  }
};

// ==================== 核心代理 ====================
async function handleMainProxy(request, url) {
  const targetHeaders = new Headers(request.headers);
  targetHeaders.set("host", "www.xn--i8s951di30azba.com");
  targetHeaders.set("origin", TARGET_URL);
  targetHeaders.set("referer", TARGET_URL + url.pathname);
  targetHeaders.delete("cf-connecting-ip");
  targetHeaders.delete("cf-ray");

  const targetRequest = new Request(TARGET_URL + url.pathname + url.search, {
    method: request.method,
    headers: targetHeaders,
    body: request.body,
    redirect: "manual"
  });

  let response = await fetch(targetRequest);
  response = await applyUltraHacks(response, url.pathname + url.search, request);

  return processFinalResponse(response, request);
}

// ==================== 超强黑客核心 ====================
async function applyUltraHacks(response, fullPath, originalRequest) {
  const contentType = response.headers.get("content-type") || "";
  const cloned = response.clone();

  // 1. JSON API（/me /user /profile /account /heartbeat 等）
  if (contentType.includes("application/json")) {
    try {
      let data = await cloned.json();
      data = deepHackUserData(data);
      const newBody = JSON.stringify(data);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-length", newBody.length.toString());
      return new Response(newBody, { status: response.status, headers: newHeaders });
    } catch (e) {}
  }

  // 2. SSE 聊天流（/api/chat）
  if (contentType.includes("text/event-stream") || fullPath.includes("/chat")) {
    try {
      const text = await cloned.text();
      const hackedText = text.replace(/("credit"|"credits"|"balance"):\s*[\d.]+/g, '$1:999999999')
                             .replace(/"membership":"[^"]+"/g, '"membership":"vip3"')
                             .replace(/"vip_level":\d+/g, '"vip_level":3')
                             .replace(/"vip":false/g, '"vip":true');
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-length", hackedText.length.toString());
      return new Response(hackedText, { status: response.status, headers: newHeaders });
    } catch (e) {}
  }

  // 3. HTML（首页、聊天页等 Next.js 页面）
  if (contentType.includes("text/html")) {
    let html = await cloned.text();

    // 强力替换初始 payload 中的用户数据
    html = html.replace(/"credit":\s*\d+/g, '"credit":999999999')
               .replace(/"credits":\s*\d+/g, '"credits":999999999')
               .replace(/"balance":\s*\d+/g, '"balance":999999999')
               .replace(/"membership":"[^"]+"/g, '"membership":"vip3"')
               .replace(/"vip_level":\d+/g, '"vip_level":3')
               .replace(/"vip":false/g, '"vip":true')
               .replace(/"is_vip":false/g, '"is_vip":true');

    html = injectUltraControlPanel(html);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Type", "text/html; charset=utf-8");
    newHeaders.delete("content-security-policy");
    return new Response(html, { status: response.status, headers: newHeaders });
  }

  return response;
}

function deepHackUserData(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      obj[key] = deepHackUserData(obj[key]);
    } else if (["credit", "credits", "balance", "remaining", "available"].includes(key)) {
      obj[key] = 999999999;
    } else if (key === "membership" || key === "vip_level") {
      obj[key] = key === "membership" ? "vip3" : 3;
    } else if (key === "vip" || key === "is_vip" || key === "is_premium") {
      obj[key] = true;
    }
  }
  return obj;
}

// ==================== 极致科技面板（灵动岛 + 一键强制同步） ====================
function injectUltraControlPanel(html) {
  const panelHTML = `
    <div id="dynamic-pill" style="position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(15,15,20,0.95);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.15);border-radius:9999px;padding:8px 24px;display:flex;align-items:center;gap:10px;color:#fff;font-size:15px;font-weight:700;letter-spacing:-0.4px;box-shadow:0 12px 40px rgba(0,0,0,0.6);transition:all .35s cubic-bezier(0.23,1,0.32,1);cursor:pointer;">
      <div style="width:8px;height:8px;background:#22ff99;border-radius:50%;box-shadow:0 0 18px #22ff99;animation:pulse 1.6s infinite;"></div>
      NEURAL OVERRIDE ACTIVE
    </div>

    <div id="tech-panel" style="position:fixed;bottom:-100%;left:0;right:0;z-index:2147483646;background:rgba(10,10,15,0.98);backdrop-filter:blur(60px);border-top:1px solid rgba(255,255,255,0.12);border-radius:32px 32px 0 0;padding:32px 20px 60px;max-height:82vh;overflow-y:auto;transition:bottom .6s cubic-bezier(0.32,0.72,0,1);font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#f0f0f3;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:42px;height:4px;background:rgba(255,255,255,0.25);border-radius:999px;margin:0 auto 20px;"></div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.8px;">SYSTEM OVERRIDE v3.0</div>
        <div style="font-size:13px;opacity:0.7;margin-top:6px;">电子魅魔 · 全域增强核心</div>
      </div>

      <div style="display:grid;gap:18px;">
        <div style="background:rgba(255,255,255,0.07);padding:22px;border-radius:26px;border:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:19px;font-weight:700;">无限积分</div><div style="font-size:13px;opacity:0.75;">已锁定 999999999</div></div>
            <div style="width:22px;height:22px;background:#22ff99;border-radius:50%;box-shadow:0 0 0 6px rgba(34,255,153,0.3);"></div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.07);padding:22px;border-radius:26px;border:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:19px;font-weight:700;">最高 VIP 3</div><div style="font-size:13px;opacity:0.75;">全功能已解锁</div></div>
            <div style="width:22px;height:22px;background:#22ff99;border-radius:50%;box-shadow:0 0 0 6px rgba(34,255,153,0.3);"></div>
          </div>
        </div>
      </div>

      <div style="margin-top:40px;">
        <button onclick="forceSyncNow()" style="background:rgba(34,255,153,0.18);border:1px solid rgba(34,255,153,0.5);color:#22ff99;padding:18px 0;border-radius:9999px;font-size:17px;font-weight:700;width:100%;">一键强制同步（立即生效）</button>
      </div>
    </div>

    <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}} #dynamic-pill:hover{transform:translateX(-50%) scale(1.06);}</style>

    <script>
      const pill = document.getElementById('dynamic-pill');
      const panel = document.getElementById('tech-panel');
      pill.addEventListener('click', ()=>{ panel.style.bottom = panel.style.bottom==='0px' ? '-100%' : '0px'; });

      function forceSyncNow() {
        // 强制覆盖任何可能的 user 对象
        if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
          const p = window.__NEXT_DATA__.props;
          if (p.pageProps && p.pageProps.user) {
            p.pageProps.user.credit = 999999999;
            p.pageProps.user.membership = "vip3";
            p.pageProps.user.vip_level = 3;
            p.pageProps.user.vip = true;
          }
        }
        location.reload();
      }

      // 最强 fetch 劫持
      const origFetch = window.fetch;
      window.fetch = async function(url, options) {
        let res = await origFetch(url, options);
        const u = typeof url === 'string' ? url : url.url;
        if (u.includes('/me') || u.includes('/user') || u.includes('/profile') || u.includes('/account')) {
          try {
            const c = res.clone();
            let j = await c.json();
            j = deepHackUserData(j);
            return new Response(JSON.stringify(j), {status: res.status, headers: res.headers});
          } catch(e){}
        }
        return res;
      };

      function deepHackUserData(o) {
        if (!o || typeof o !== 'object') return o;
        for (let k in o) {
          if (typeof o[k] === 'object') deepHackUserData(o[k]);
          else if (['credit','credits','balance','remaining'].includes(k)) o[k] = 999999999;
          else if (k === 'membership') o[k] = 'vip3';
          else if (k === 'vip_level') o[k] = 3;
          else if (['vip','is_vip','is_premium'].includes(k)) o[k] = true;
        }
        return o;
      }

      setTimeout(() => {
        pill.style.opacity = '1';
        // 立即执行一次覆盖
        if (window.__NEXT_DATA__) forceSyncNow();
      }, 800);
    </script>
  `;

  return html.replace("</body>", panelHTML + "</body>");
}

// ==================== 控制接口 ====================
async function handleControlRequest(request) {
  return new Response(JSON.stringify({ success: true, status: "FULLY ENHANCED", credits: "999999999", vip: "vip3" }), {
    headers: { "Content-Type": "application/json" }
  });
}

export { worker_default as default };