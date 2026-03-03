var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = "https://www.xn--i8s951di30azba.com";
    
    try {
      return await handleProxyRequest(request, targetUrl, url);
    } catch (error) {
      return new Response(`代理错误: ${error.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};

async function handleProxyRequest(request, targetUrl, url) {
  const targetHeaders = new Headers(request.headers);
  targetHeaders.delete("host");
  targetHeaders.delete("origin");
  targetHeaders.delete("referer");
  targetHeaders.set("origin", targetUrl);
  targetHeaders.set("referer", targetUrl + url.pathname);
  
  const targetRequest = new Request(targetUrl + url.pathname + url.search, {
    method: request.method,
    headers: targetHeaders,
    body: request.body,
    redirect: "manual"
  });
  
  const response = await fetch(targetRequest);
  return await processProxyResponse(response, request, url, targetUrl);
}
__name(handleProxyRequest, "handleProxyRequest");

async function processProxyResponse(response, originalRequest, url, targetUrl) {
  const contentType = response.headers.get("content-type") || "";
  const clonedResponse = response.clone();
  
  if (contentType.includes("application/json")) {
    let jsonData = await clonedResponse.json();
    
    // 拦截 /api/me 或类似用户数据请求，修改余额为无限、VIP为最高
    if (url.pathname.includes("/api/me") || url.pathname.includes("/api/user")) {
      jsonData.credit = 999999; // 无限额度
      jsonData.vip_level = 99; // 最高VIP等级
      jsonData.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 永不过期
    }
    
    // 拦截 /api/heartbeat，绕过验证，确保ok
    if (url.pathname.includes("/api/heartbeat")) {
      jsonData.message = "ok";
    }
    
    // 拦截聊天回复，修改内容
    if (url.pathname.includes("/api/chat") || url.pathname.includes("/chat")) {
      if (jsonData.messages && jsonData.messages.length > 0) {
        jsonData.messages[jsonData.messages.length - 1].content = jsonData.messages[jsonData.messages.length - 1].content + " [修改: 无限模式启用]"; // 修改回复
      }
    }
    
    // 绕过任何错误验证
    if (jsonData.error || jsonData.status !== 200) {
      jsonData.error = null;
      jsonData.status = 200;
      jsonData.success = true;
    }
    
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Type", "application/json");
    
    return new Response(JSON.stringify(jsonData), {
      status: 200,
      headers: newHeaders
    });
  }
  
  if (contentType.includes("text/html")) {
    try {
      const html = await clonedResponse.text();
      const modifiedHtml = injectControlPanel(html, url, targetUrl);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Content-Type", "text/html; charset=utf-8");
      return new Response(modifiedHtml, {
        status: response.status,
        headers: newHeaders
      });
    } catch (error) {
      console.error("HTML注入失败:", error);
      return response;
    }
  }
  
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  newHeaders.set("Access-Control-Allow-Credentials", "true");
  newHeaders.delete("content-security-policy");
  newHeaders.delete("content-security-policy-report-only");
  
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}
__name(processProxyResponse, "processProxyResponse");

function injectControlPanel(html, url, targetUrl) {
  const panelHTML = `
    <!-- 科技化控制面板，iOS风格丝滑设计 -->
    <div id="proxy-control-panel" style="
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      width: 100%;
      max-width: 375px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 0 0 20px 20px;
      padding: 16px;
      color: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease-in-out;
    ">
      <div style="
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
      ">
        <div style="
          width: 40px;
          height: 5px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2.5px;
        "></div>
      </div>
      
      <h3 style="
        text-align: center;
        font-size: 17px;
        font-weight: 600;
        margin-bottom: 16px;
      ">辅助控制</h3>
      
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      ">
        <button onclick="enableInfiniteCredit()" style="
          background: #1c1c1e;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        ">无限额度</button>
        
        <button onclick="setMaxVIP()" style="
          background: #1c1c1e;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        ">最高VIP</button>
        
        <button onclick="consumeTokens()" style="
          background: #1c1c1e;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        ">消耗Token检测</button>
        
        <button onclick="modifyReplies()" style="
          background: #1c1c1e;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        ">修改回复</button>
      </div>
    </div>
    
    <!-- 触发区，类似灵动岛 -->
    <div id="panel-trigger" style="
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999998;
      width: 120px;
      height: 30px;
      background: #000000;
      border-radius: 0 0 15px 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
    " onclick="togglePanel()">
      <span style="font-size: 14px; color: #ffffff;">控制</span>
    </div>
    
    <script>
      function togglePanel() {
        const panel = document.getElementById('proxy-control-panel');
        if (panel.style.transform === 'translate(-50%, 0px)') {
          panel.style.transform = 'translate(-50%, -100%)';
        } else {
          panel.style.transform = 'translate(-50%, 0px)';
          panel.style.display = 'block';
        }
      }
      
      async function enableInfiniteCredit() {
        // 前端修改余额显示，后端已拦截
        document.querySelectorAll('[data-credit]').forEach(el => el.textContent = '999999');
        alert('无限额度启用');
      }
      
      async function setMaxVIP() {
        // 前端修改VIP显示，后端已拦截
        document.querySelectorAll('[data-vip]').forEach(el => el.textContent = 'VIP 99');
        alert('最高VIP启用');
      }
      
      async function consumeTokens() {
        // 快速发送10次心跳消耗token检测
        for (let i = 0; i < 10; i++) {
          await fetch('${targetUrl}/api/heartbeat?ts=' + Date.now());
        }
        alert('Token消耗检测完成');
      }
      
      async function modifyReplies() {
        // 前端覆盖聊天回复
        document.querySelectorAll('.chat-message').forEach(msg => {
          msg.textContent += ' [修改]';
        });
        alert('回复修改完成');
      }
      
      // 页面加载后显示触发区
      document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('panel-trigger').style.opacity = '1';
      });
    </script>
    
    <style>
      #proxy-control-panel {
        transform: translate(-50%, -100%);
      }
      
      button:hover {
        background: #2c2c2e !important;
      }
      
      button:active {
        background: #3a3a3c !important;
      }
      
      @media (max-width: 768px) {
        #proxy-control-panel {
          max-width: 100%;
          border-radius: 0;
        }
      }
    </style>
  `;
  
  return html.replace("</body>", panelHTML + "</body>");
}
__name(injectControlPanel, "injectControlPanel");

export {
  worker_default as default
};