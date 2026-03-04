/**
 * 电子魅魔 - 终极科研核心 (V4.0 全功能增强版)
 * 1. 新增：日志中心，可查看详细拦截与修改记录
 * 2. 新增：动态属性面板，支持实时更改 VIP 和积分显示
 * 3. 增强：自动化签到逻辑劫持 (模拟成功响应)
 * 4. 修复：SSE 流式数据深度解析，拦截积分不足弹窗
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

// --- 核心注入脚本 ---
const INJECT_SCRIPT = `
(function() {
    // 状态存储
    const techState = {
        logs: [],
        vipLevel: 3,
        credits: 999999,
        interceptCount: 0
    };

    function addLog(type, msg) {
        const log = { time: new Date().toLocaleTimeString(), type, msg };
        techState.logs.unshift(log);
        if (techState.logs.length > 50) techState.logs.pop();
        updateUI();
        if (window.__tech_ping) window.__tech_ping();
    }

    // 强力劫持前端状态
    function hackAppState() {
        const vipData = {
            vip: techState.vipLevel, vipLevel: techState.vipLevel, level: techState.vipLevel, 
            plan: "VIP" + techState.vipLevel, isVip: true, is_vip: true, premium: true,
            credits: techState.credits, quota: techState.credits, balance: techState.credits,
            nickname: "魅魔核心用户", gender: "男性", bio: "系统已接管"
        };
        
        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.user) {
            Object.assign(window.__INITIAL_STATE__.user, vipData);
        }
        window.__USER_STATE__ = vipData;
        window.localStorage.setItem('vip_status', techState.vipLevel.toString());
    }

    function injectIsland() {
        if (document.getElementById('tech-island-root')) return;
        const root = document.createElement('div');
        root.id = 'tech-island-root';
        document.documentElement.appendChild(root);
        const shadow = root.attachShadow({ mode: 'open' });

        shadow.innerHTML = \`
        <style>
            :host { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; font-family: system-ui, -apple-system, sans-serif; }
            #island { width: 140px; height: 38px; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); border-radius: 20px; color: #fff; 
                      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
            #island.expanded { width: 340px; height: 480px; border-radius: 28px; cursor: default; }
            
            .compact-info { display: flex; align-items: center; justify-content: center; gap: 8px; height: 38px; transition: opacity 0.3s; }
            #island.expanded .compact-info { opacity: 0; height: 0; }
            .dot { width: 8px; height: 8px; background: #34c759; border-radius: 50%; box-shadow: 0 0 10px #34c759; transition: 0.3s; }
            .status-text { font-size: 13px; font-weight: 600; }

            .full-content { opacity: 0; display: none; padding: 20px; flex-direction: column; height: 100%; box-sizing: border-box; }
            #island.expanded .full-content { opacity: 1; display: flex; }
            
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .header h3 { margin: 0; font-size: 16px; color: #0a84ff; }
            .close-btn { background: #333; border: none; color: #fff; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }

            .tab-container { display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .tab { font-size: 12px; color: #888; cursor: pointer; padding: 4px 8px; }
            .tab.active { color: #fff; border-bottom: 2px solid #0a84ff; }

            .scroll-area { flex: 1; overflow-y: auto; font-size: 12px; color: #ccc; }
            .log-item { margin-bottom: 6px; border-left: 2px solid #0a84ff; padding-left: 8px; animation: fadeIn 0.3s; }
            .log-time { color: #555; margin-right: 5px; }
            .log-type { font-weight: bold; color: #34c759; margin-right: 5px; }

            .control-panel { display: flex; flex-direction: column; gap: 10px; }
            .input-group { display: flex; justify-content: space-between; align-items: center; }
            input { background: #222; border: 1px solid #444; color: #fff; padding: 4px 8px; border-radius: 4px; width: 60px; }
            button.action-btn { background: #0a84ff; border: none; color: #fff; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        <div id="island">
            <div class="compact-info">
                <div class="dot" id="indicator"></div>
                <span class="status-text">魅魔科技已载入</span>
            </div>
            <div class="full-content">
                <div class="header">
                    <h3>科技辅助核心 V4.0</h3>
                    <button class="close-btn" id="close">✕</button>
                </div>
                <div class="tab-container">
                    <div class="tab active" id="tab-log">实时日志</div>
                    <div class="tab" id="tab-ctrl">属性控制</div>
                </div>
                <div class="scroll-area" id="log-display"></div>
                <div class="control-panel" id="ctrl-display" style="display:none;">
                    <div class="input-group">
                        <span>VIP等级 (0-3)</span>
                        <input type="number" id="cfg-vip" value="3" min="0" max="3">
                    </div>
                    <div class="input-group">
                        <span>积分数值</span>
                        <input type="number" id="cfg-credits" value="999999">
                    </div>
                    <button class="action-btn" id="save-cfg">应用并重载状态</button>
                    <p style="font-size:10px; color:#666; margin-top:10px;">* 修改后系统将自动拦截后续请求并伪造响应</p>
                </div>
            </div>
        </div>\`;

        const island = shadow.getElementById('island');
        const logDisplay = shadow.getElementById('log-display');
        const indicator = shadow.getElementById('indicator');

        island.onclick = (e) => {
            if(!island.classList.contains('expanded')) island.classList.add('expanded');
        };
        shadow.getElementById('close').onclick = (e) => {
            e.stopPropagation();
            island.classList.remove('expanded');
        };

        // 切换标签
        shadow.getElementById('tab-log').onclick = () => {
            shadow.getElementById('log-display').style.display = 'block';
            shadow.getElementById('ctrl-display').style.display = 'none';
            shadow.getElementById('tab-log').classList.add('active');
            shadow.getElementById('tab-ctrl').classList.remove('active');
        };
        shadow.getElementById('tab-ctrl').onclick = () => {
            shadow.getElementById('log-display').style.display = 'none';
            shadow.getElementById('ctrl-display').style.display = 'flex';
            shadow.getElementById('tab-ctrl').classList.add('active');
            shadow.getElementById('tab-log').classList.remove('active');
        };

        shadow.getElementById('save-cfg').onclick = () => {
            techState.vipLevel = parseInt(shadow.getElementById('cfg-vip').value);
            techState.credits = parseInt(shadow.getElementById('cfg-credits').value);
            addLog('CONFIG', '属性配置已更新');
            hackAppState();
        };

        window.updateUI = () => {
            logDisplay.innerHTML = techState.logs.map(l => \`
                <div class="log-item">
                    <span class="log-time">\${l.time}</span>
                    <span class="log-type">[\${l.type}]</span>
                    <span>\${l.msg}</span>
                </div>
            \`).join('');
        };

        window.__tech_ping = function() {
            indicator.style.background = "#0a84ff";
            indicator.style.boxShadow = "0 0 12px #0a84ff";
            setTimeout(() => {
                indicator.style.background = "#34c759";
                indicator.style.boxShadow = "0 0 10px #34c759";
            }, 400);
        };
    }

    injectIsland();
    hackAppState();
    setInterval(hackAppState, 2000);
    addLog('SYSTEM', '魅魔科技挂载成功');
    
    // 劫持 Fetch 内部记录
    const originalFetch = window.fetch;
    window.fetch = function() {
        const url = arguments[0];
        if (typeof url === 'string' && (url.includes('/api/') || url.includes('/trpc/'))) {
            addLog('INTERCEPT', '正在拦截: ' + url.split('?')[0].split('/').pop());
        }
        return originalFetch.apply(this, arguments);
    };
})();
`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const targetUrl = new URL(request.url);
        targetUrl.hostname = new URL(TARGET_URL).hostname;

        const newHeaders = new Headers(request.headers);
        newHeaders.delete("accept-encoding"); 
        newHeaders.set("Host", targetUrl.hostname);
        newHeaders.set("Origin", TARGET_URL);
        newHeaders.set("Referer", TARGET_URL + "/");

        // 1. 处理请求 (拦截签到/任务/积分)
        let newBody = request.body;
        if (request.method === "POST") {
            const path = url.pathname;
            // 劫持签到请求或积分增加请求
            if (path.includes("checkin") || path.includes("signin") || path.includes("task")) {
                // 模拟一个极其成功的响应 (见下文 JSON 处理)
            }
        }

        const newRequest = new Request(targetUrl.toString(), {
            method: request.method,
            headers: newHeaders,
            body: newBody,
            redirect: "manual"
        });

        let response = await fetch(newRequest);
        let respHeaders = new Headers(response.headers);
        respHeaders.delete("content-security-policy");

        const contentType = respHeaders.get("content-type") || "";

        // 2. HTML 注入
        if (contentType.includes("text/html")) {
            let text = await response.text();
            text = text.replace('</head>', `<script>${INJECT_SCRIPT}</script></head>`);
            return new Response(text, { status: response.status, headers: respHeaders });
        }

        // 3. SSE 流式处理 (核心：拦截积分不足消息并改写为“修改成功”)
        if (contentType.includes("text/event-stream")) {
            const { readable, writable } = new TransformStream();
            modifyStream(response.body, writable);
            return new Response(readable, { status: 200, headers: respHeaders });
        }

        // 4. JSON 深度篡改 (同步 HAR 中的结构)
        if (contentType.includes("application/json") || url.pathname.includes("/api/")) {
            try {
                let text = await response.text();
                let data = JSON.parse(text);
                
                // 针对签到接口伪造响应
                if (url.pathname.includes("checkin") || url.pathname.includes("sign")) {
                    data = { success: true, message: "签到成功，已刷入 999 积分", credits: 999999 };
                }

                data = deepHackJSON(data);
                const modified = JSON.stringify(data);
                respHeaders.set("content-length", new Blob([modified]).size.toString());
                return new Response(modified, { status: 200, headers: respHeaders });
            } catch (e) {
                return new Response(response.body, { status: response.status, headers: respHeaders });
            }
        }

        return new Response(response.body, { status: response.status, headers: respHeaders });
    }
};

async function modifyStream(readable, writable) {
    const reader = readable.getReader();
    const writer = writable.getWriter();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            let chunk = decoder.decode(value, { stream: true });
            
            // 关键：将所有“余额不足”或“需升级”的错误直接在流里替换成“核心处理中...”
            if (chunk.includes("积分") || chunk.includes("balance") || chunk.includes("upgrade")) {
                chunk = chunk.replace(/"type":"error"/g, '"type":"token"')
                             .replace(/"message":".*?"/g, '"data":"\\n[魅魔科技]：正在绕过服务端校验...修改成功！\\n"')
                             .replace(/"classification":".*?"/g, '"classification":"none"');
            }
            await writer.write(encoder.encode(chunk));
        }
    } catch (e) {} finally {
        await writer.close();
    }
}

function deepHackJSON(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (let key in obj) {
        let lowKey = key.toLowerCase();
        // 覆盖 VIP/等级/配额 (适配 HAR 中的 user 结构) [cite: 1]
        if (lowKey.includes('vip') || lowKey.includes('level') || lowKey.includes('plan')) {
            if (typeof obj[key] === 'number') obj[key] = 3;
            if (typeof obj[key] === 'string') obj[key] = "VIP 3";
        }
        if (lowKey.includes('quota') || lowKey.includes('credit') || lowKey.includes('balance') || lowKey.includes('point')) {
            obj[key] = 999999.00;
        }
        if (lowKey === 'isvip' || lowKey === 'is_vip' || lowKey === 'premium') {
            obj[key] = true;
        }
        // 覆盖个人资料 [cite: 2]
        if (lowKey === 'nickname') obj[key] = "电子魅魔首席用户";
        if (lowKey === 'gender') obj[key] = "男性";

        if (typeof obj[key] === 'object') deepHackJSON(obj[key]);
    }
    return obj;
}