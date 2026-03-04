/**
 * 电子魅魔 - 科技辅助 (功能检测与权限注入版)
 * 拒绝模型降级，采用 Request Payload 伪装注入
 * 完美还原 V1 版丝滑灵动岛，修复字体对齐
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

// 纯正丝滑版 灵动岛 UI 注入
const INJECT_SCRIPT = `
(function() {
    function injectTechIsland() {
        if (document.getElementById('tech-island-root')) return;
        
        const root = document.createElement('div');
        root.id = 'tech-island-root';
        document.documentElement.appendChild(root);

        const shadow = root.attachShadow({ mode: 'open' });
        
        shadow.innerHTML = \`
        <style>
            :host {
                position: fixed;
                top: 15px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            #tech-island {
                width: 120px;
                height: 36px;
                background: #000000;
                border-radius: 18px;
                color: #ffffff;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
                cursor: pointer;
                user-select: none;
                position: relative;
            }
            #tech-island.expanded {
                width: 300px;
                height: 160px;
                border-radius: 24px;
                cursor: default;
            }
            
            .island-main {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 36px;
                width: 100%;
                gap: 8px;
                position: absolute;
                top: 0;
                left: 0;
                transition: opacity 0.2s;
            }
            #tech-island.expanded .island-main {
                opacity: 0;
                pointer-events: none;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: #34c759;
                border-radius: 50%;
                box-shadow: 0 0 8px #34c759;
                transition: all 0.3s;
            }
            .status-text { 
                font-size: 13px; 
                font-weight: 600; 
                display: flex;
                align-items: center;
            }
            
            .island-expanded {
                opacity: 0;
                width: 100%;
                height: 100%;
                padding: 16px;
                pointer-events: none;
                transition: opacity 0.3s ease 0.1s;
                display: flex;
                flex-direction: column;
            }
            #tech-island.expanded .island-expanded {
                opacity: 1;
                pointer-events: auto;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255,255,255,0.15);
            }
            .header h3 { font-size: 15px; font-weight: 600; color: #fff;}
            .close-btn { 
                background: #1c1c1e; border: none; color: #8e8e93; 
                border-radius: 50%; width: 24px; height: 24px; 
                cursor: pointer; display: flex; align-items: center; justify-content: center; 
                font-size: 12px; font-weight: bold;
            }
            
            .mod-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; font-weight: 500; }
            .mod-item .label { color: #8e8e93; }
            .mod-item .val { color: #0a84ff; font-family: monospace; font-size: 14px; font-weight: bold;}
            .mod-item .val.green { color: #34c759; }
            
            .mod-btns { display: flex; gap: 8px; margin-top: auto; }
            .mod-btns button {
                flex: 1;
                background: #1c1c1e;
                border: none;
                color: white;
                padding: 8px 0;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .mod-btns button:active { background: #2c2c2e; transform: scale(0.97); }
        </style>
        
        <div id="tech-island">
            <div class="island-main">
                <div class="status-dot" id="sensor"></div>
                <span class="status-text">安全模式</span>
            </div>
            <div class="island-expanded">
                <div class="header">
                    <h3>Payload Injector</h3>
                    <button class="close-btn" id="close">✕</button>
                </div>
                <div class="mod-item">
                    <span class="label">本地权限越狱</span>
                    <span class="val">VIP 3 MAX</span>
                </div>
                <div class="mod-item">
                    <span class="label">前端额度锁定</span>
                    <span class="val green">9,999,999</span>
                </div>
                <div class="mod-item">
                    <span class="label">流数据拦截网</span>
                    <span class="val green">运行中</span>
                </div>
                <div class="mod-btns">
                    <button id="btn-fix">状态强刷</button>
                </div>
            </div>
        </div>
        \`;

        const island = shadow.getElementById('tech-island');
        const closeBtn = shadow.getElementById('close');
        const sensor = shadow.getElementById('sensor');
        const btnFix = shadow.getElementById('btn-fix');

        island.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && !island.classList.contains('expanded')) {
                island.classList.add('expanded');
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            island.classList.remove('expanded');
        });

        btnFix.addEventListener('click', (e) => {
            e.stopPropagation();
            btnFix.textContent = "已重置!";
            sensor.style.background = "#0a84ff";
            sensor.style.boxShadow = "0 0 8px #0a84ff";
            setTimeout(() => { 
                btnFix.textContent = "状态强刷"; 
                sensor.style.background = "#34c759";
                sensor.style.boxShadow = "0 0 8px #34c759";
            }, 1000);
        });

        // 监听请求呼吸灯
        window.__tech_ping = function() {
            sensor.style.background = "#0A84FF";
            sensor.style.boxShadow = "0 0 8px #0A84FF";
            setTimeout(() => {
                sensor.style.background = "#34C759";
                sensor.style.boxShadow = "0 0 8px #34C759";
            }, 300);
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTechIsland);
    } else {
        injectTechIsland();
    }
    setInterval(injectTechIsland, 1500);

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        if(window.__tech_ping) window.__tech_ping();
        return originalFetch.apply(this, args);
    };
})();
`;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const targetUrl = new URL(request.url);
        targetUrl.hostname = new URL(TARGET_URL).hostname;

        // 1. 净化请求头，解决压缩和跨域检测
        const newHeaders = new Headers(request.headers);
        newHeaders.delete("accept-encoding");
        newHeaders.set("Host", targetUrl.hostname);
        newHeaders.set("Origin", TARGET_URL);
        newHeaders.set("Referer", TARGET_URL + "/");

        // 2. 请求体拦截注入 (Payload Spoofing)
        // 核心思路：不改模型！而是在向后端发请求时，强行插入特权标识，测试后端漏洞
        let newBody = request.body;
        if (request.method === "POST" && (url.pathname.includes("/api/chat") || url.pathname.includes("/trpc/"))) {
            try {
                let reqData = await request.clone().json();
                
                // 伪造全套 VIP 身份标识塞入后端请求，探测是否会被接收
                reqData.isVip = true;
                reqData.vipLevel = 3;
                reqData.plan = "vip3";
                reqData.premium = true;
                reqData.bypassQuota = true;

                newBody = JSON.stringify(reqData);
            } catch (e) {}
        }

        const newRequest = new Request(targetUrl.toString(), {
            method: request.method,
            headers: newHeaders,
            body: newBody,
            redirect: "manual"
        });

        // 3. 执行请求
        let response = await fetch(newRequest);
        let respHeaders = new Headers(response.headers);
        const contentType = respHeaders.get("content-type") || "";

        respHeaders.delete("content-security-policy");
        respHeaders.delete("content-security-policy-report-only");

        // 4. HTML 注入灵动岛 UI
        if (contentType.includes("text/html")) {
            let text = await response.text();
            const scriptTag = `<script>${INJECT_SCRIPT}</script>`;
            if (text.includes('</head>')) {
                text = text.replace('</head>', scriptTag + '</head>');
            } else {
                text += scriptTag;
            }
            respHeaders.set("content-length", new Blob([text]).size.toString());
            return new Response(text, { status: response.status, headers: respHeaders });
        }

        // 5. SSE 数据流拦截处理
        // 如果后端依然严格判定积分不足，拦截错误不让前端崩，直接输出结果
        if (contentType.includes("text/event-stream")) {
            const { readable, writable } = new TransformStream();
            modifyStream(response.body, writable);
            
            return new Response(readable, {
                status: 200, // 强转 200，杜绝 HTTP 层面报错
                headers: respHeaders
            });
        }

        // 6. JSON API 数据强锁死
        if (contentType.includes("application/json") || url.pathname.includes("/api/")) {
            try {
                let text = await response.text();
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    let data = JSON.parse(text);
                    data = deepHackJSON(data);
                    const modifiedText = JSON.stringify(data);
                    respHeaders.set("content-length", new Blob([modifiedText]).size.toString());
                    
                    return new Response(modifiedText, {
                        status: 200,
                        statusText: "OK",
                        headers: respHeaders
                    });
                }
                return new Response(text, { status: response.status, headers: respHeaders });
            } catch (e) {
                return new Response(response.body, { status: response.status, headers: respHeaders });
            }
        }

        return new Response(response.body, { status: response.status, headers: respHeaders });
    }
};

/**
 * SSE 流数据安全拦截器
 * 绝不降级模型，遇到积分不足时，优雅转化错误信息
 */
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
            
            // 拦截流式报错（如积分不足、需要升级）
            if (chunk.includes('积分不足') || chunk.includes('upgrade_needed')) {
                // 将错误事件强行替换为正常对话文本流，直接显示给用户当前后端情况
                const sysMsg = "\\n\\n[⚙️科技核心提示：服务器已开启严格服务端校验。当前高级模型请求被拒（无真实额度）。已屏蔽弹窗，建议测试其它越权逻辑。]\\n\\n";
                
                chunk = chunk
                    .replace(/"type":"error"/g, '"type":"token"')
                    .replace(/"classification":"upgrade_needed"/g, \`"data":"\${sysMsg}"\`)
                    .replace(/"message":"积分不足"/g, '""');
            }
            
            await writer.write(encoder.encode(chunk));
        }
    } catch (e) {} finally {
        await writer.close();
    }
}

/**
 * 全覆盖无死角 JSON 数据篡改引擎
 */
function deepHackJSON(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            
            let lowerKey = key.toLowerCase();

            // 1. 无限额度与配额锁死
            if (lowerKey.includes('remaining') || lowerKey.includes('total') || 
                lowerKey.includes('credit') || lowerKey.includes('quota') || 
                lowerKey.includes('balance') || lowerKey.includes('point')) {
                if (typeof obj[key] === 'number') {
                    obj[key] = 9999999;
                }
            }
            
            // 2. VIP 状态深度渗透 (防大小写不一)
            if (lowerKey.includes('plan') || lowerKey.includes('tier') || 
                lowerKey.includes('level') || lowerKey.includes('membership') || 
                lowerKey.includes('vip')) {
                
                if (typeof obj[key] === 'string') {
                    const strVal = obj[key].toLowerCase();
                    if (strVal.includes('free') || strVal.includes('none') || strVal.includes('0') || strVal.includes('null')) {
                        // 维持原有的字母大小写格式
                        obj[key] = (obj[key] === obj[key].toUpperCase()) ? 'VIP3' : 'vip3';
                    }
                }
                if (typeof obj[key] === 'number') {
                    obj[key] = 3;
                }
            }
            
            // 3. 全局权限开启
            if (lowerKey.includes('isvip') || lowerKey.includes('is_vip') || lowerKey.includes('premium')) {
                if (typeof obj[key] === 'boolean' || typeof obj[key] === 'number') {
                    obj[key] = true;
                }
            }

            // 继续向内递归
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                deepHackJSON(obj[key]);
            }
        }
    }
    return obj;
}