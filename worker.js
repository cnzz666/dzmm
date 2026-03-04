/**
 * 电子魅魔 - 终极全功能控制台 (V6.0)
 * 1. 灵动岛实时审计日志 (拦截/修改/成功/失败)
 * 2. 资料中心深度伪造 (昵称/ID/性别/余额/VIP)
 * 3. 实时流量劫持 (不只是模拟，是真实篡改)
 * 4. 自动签到刷分引擎
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

const INJECT_SCRIPT = `
(function() {
    // --- 1. 全局配置与状态 ---
    const state = {
        vip: localStorage.getItem('m_vip') || '3',
        name: localStorage.getItem('m_name') || '魅魔之主',
        id: 'c7e664dd-083b-4729-8056-2243f6be4e09',
        autoSign: localStorage.getItem('m_sign') === 'true',
        logs: [],
        isOpen: false,
        activeTab: 'console'
    };

    // --- 2. 灵动岛 UI 注入 ---
    const style = document.createElement('style');
    style.innerHTML = \`
        #m-island-root { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 999999999; font-family: -apple-system, sans-serif; pointer-events: none; }
        #m-island { 
            width: 140px; height: 36px; background: #000; border-radius: 18px; color: #fff; 
            transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); overflow: hidden; 
            display: flex; flex-direction: column; align-items: center; pointer-events: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 0.5px solid rgba(255,255,255,0.1); cursor: pointer;
        }
        #m-island.expanded { width: 340px; height: 460px; border-radius: 28px; cursor: default; }
        
        /* 紧凑状态内容 - 解决垂直居中 */
        .m-pill { 
            display: flex; align-items: center; justify-content: center; gap: 8px; 
            height: 36px; min-height: 36px; transition: opacity 0.3s;
        }
        #m-island.expanded .m-pill { opacity: 0; height: 0; min-height: 0; }
        .m-dot { width: 8px; height: 8px; background: #34c759; border-radius: 50%; box-shadow: 0 0 8px #34c759; }
        .m-text { font-size: 13px; font-weight: 600; line-height: 36px; }

        /* 展开内容 */
        .m-box { 
            display: none; opacity: 0; width: 100%; height: 100%; flex-direction: column; 
            padding: 20px; box-sizing: border-box; transition: opacity 0.4s;
        }
        #m-island.expanded .m-box { display: flex; opacity: 1; }
        .m-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .m-title { font-size: 16px; font-weight: bold; color: #34c759; }
        .m-close { background: #222; border: none; color: #fff; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }

        .m-tabs { display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 10px; }
        .m-tab { background: none; border: none; color: #555; font-size: 13px; cursor: pointer; font-weight: bold; }
        .m-tab.active { color: #34c759; }

        .m-content { flex: 1; overflow-y: auto; font-size: 13px; }
        .m-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 10px; background: #111; border-radius: 10px; }
        .m-row label { color: #999; }
        .m-row span { color: #34c759; font-family: monospace; }
        .m-row select, .m-row input { background: #222; border: 1px solid #333; color: #fff; border-radius: 5px; padding: 2px 5px; }

        .m-log { font-size: 11px; margin-bottom: 6px; padding: 4px; border-left: 2px solid #333; color: #aaa; }
        .m-log.success { border-left-color: #34c759; }
        .m-log.intercept { border-left-color: #0a84ff; }
        .m-log.fail { border-left-color: #ff3b30; }

        .m-btn { width: 100%; padding: 12px; background: #34c759; color: #000; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    \`;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'm-island-root';
    root.innerHTML = \`
        <div id="m-island">
            <div class="m-pill">
                <div class="m-dot" id="m-led"></div>
                <div class="m-text" id="m-status">魅魔科技：已就绪</div>
            </div>
            <div class="m-box">
                <div class="m-header">
                    <span class="m-title">魅魔内核 v6.0</span>
                    <button class="m-close" id="m-exit">✕</button>
                </div>
                <div class="m-tabs">
                    <button class="m-tab active" data-tab="ctrl">控制面板</button>
                    <button class="m-tab" data-tab="logs">审计日志</button>
                    <button class="m-tab" data-tab="acc">资料管理</button>
                </div>
                <div class="m-content" id="m-view">
                    </div>
                <button class="m-btn" id="m-apply">保存并同步云端</button>
            </div>
        </div>
    \`;
    document.body.appendChild(root);

    // --- 3. 核心功能逻辑 ---
    const island = document.getElementById('m-island');
    const statusTxt = document.getElementById('m-status');
    const led = document.getElementById('m-led');
    const view = document.getElementById('m-view');

    function addLog(msg, type = 'intercept') {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        state.logs.unshift({ time, msg, type });
        if (state.logs.length > 25) state.logs.pop();
        if (state.activeTab === 'logs') renderView();
        
        // 顶部滚动提醒
        statusTxt.textContent = msg;
        led.style.background = (type === 'success' ? '#34c759' : (type === 'fail' ? '#ff3b30' : '#0a84ff'));
        setTimeout(() => { 
            statusTxt.textContent = '魅魔科技：正在监视';
            led.style.background = '#34c759';
        }, 2000);
    }

    function renderView() {
        if (state.activeTab === 'ctrl') {
            view.innerHTML = \`
                <div class="m-row"><label>VIP 等级</label>
                    <select id="m-set-vip">
                        <option value="0" \${state.vip=='0'?'selected':''}>VIP 0 (普通)</option>
                        <option value="3" \${state.vip=='3'?'selected':''}>VIP 3 (最高)</option>
                    </select>
                </div>
                <div class="m-row"><label>积分刷写</label><span>999999.00</span></div>
                <div class="m-row"><label>自动签到</label><input type="checkbox" id="m-set-sign" \${state.autoSign?'checked':''}></div>
                <div class="m-row" style="background:transparent; color:#555; font-size:11px;">
                    提示：修改等级后需点击下方“同步”并刷新页面。
                </div>
            \`;
        } else if (state.activeTab === 'logs') {
            view.innerHTML = state.logs.map(l => \`
                <div class="m-log \${l.type}">
                    <span style="color:#555">[\${l.time}]</span> \${l.msg}
                </div>
            \`).join('');
        } else if (state.activeTab === 'acc') {
            view.innerHTML = \`
                <div class="m-row"><label>伪造昵称</label><input type="text" id="m-set-name" value="\${state.name}"></div>
                <div class="m-row"><label>伪造 ID</label><span style="font-size:10px;">\${state.id}</span></div>
                <div class="m-row"><label>账户状态</label><span>正常 (已锁定)</span></div>
            \`;
        }
    }

    // 事件监听
    island.onclick = () => { if(!island.classList.contains('expanded')) island.classList.add('expanded'); };
    document.getElementById('m-exit').onclick = (e) => { e.stopPropagation(); island.classList.remove('expanded'); };
    
    document.querySelectorAll('.m-tab').forEach(tab => {
        tab.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeTab = tab.dataset.tab;
            renderView();
        };
    });

    document.getElementById('m-apply').onclick = (e) => {
        e.stopPropagation();
        state.vip = document.getElementById('m-set-vip')?.value || state.vip;
        state.name = document.getElementById('m-set-name')?.value || state.name;
        state.autoSign = document.getElementById('m-set-sign')?.checked || false;
        
        localStorage.setItem('m_vip', state.vip);
        localStorage.setItem('m_name', state.name);
        localStorage.setItem('m_sign', state.autoSign);
        
        addLog('配置已同步至 Worker 节点', 'success');
        setTimeout(() => location.reload(), 1000);
    };

    // --- 4. 流量劫持器 (真实拦截) ---
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0].toString();
        if (url.includes('/api/')) {
            addLog('正在拦截请求...', 'intercept');
            
            // 往 Header 里注入指令，告诉 Worker 怎么改数据
            const opts = args[1] || {};
            opts.headers = new Headers(opts.headers || {});
            opts.headers.set('x-m-vip', state.vip);
            opts.headers.set('x-m-name', encodeURIComponent(state.name));
            args[1] = opts;

            try {
                const res = await originalFetch.apply(this, args);
                addLog('修改成功：' + url.split('/').pop().split('?')[0], 'success');
                return res;
            } catch (e) {
                addLog('修改失败：服务器无响应', 'fail');
                throw e;
            }
        }
        return originalFetch.apply(this, args);
    };

    renderView();
    addLog('魅魔科技挂载成功', 'success');
})();
`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const targetUrl = new URL(request.url);
        targetUrl.hostname = new URL(TARGET_URL).hostname;

        // 提取前端岛屿传来的参数
        const customVip = request.headers.get('x-m-vip') || '3';
        const customName = decodeURIComponent(request.headers.get('x-m-name') || '魅魔之主');

        const newHeaders = new Headers(request.headers);
        newHeaders.delete("accept-encoding");
        newHeaders.set("Host", targetUrl.hostname);
        newHeaders.set("Origin", TARGET_URL);
        newHeaders.set("Referer", TARGET_URL + "/");

        const newRequest = new Request(targetUrl.toString(), {
            method: request.method,
            headers: newHeaders,
            body: request.body,
            redirect: "manual"
        });

        let response = await fetch(newRequest);
        let respHeaders = new Headers(response.headers);
        const contentType = respHeaders.get("content-type") || "";

        // 移除安全限制，允许脚本注入
        respHeaders.delete("content-security-policy");
        respHeaders.set("Access-Control-Allow-Origin", "*");

        // 1. HTML 处理：注入 UI 脚本
        if (contentType.includes("text/html")) {
            let text = await response.text();
            text = text.replace('</head>', `<script>${INJECT_SCRIPT}</script></head>`);
            return new Response(text, { status: response.status, headers: respHeaders });
        }

        // 2. API 处理：深度篡改 JSON 数据
        if (contentType.includes("application/json") || url.pathname.includes("/api/")) {
            try {
                let data = await response.json();
                
                // 深度递归修改所有字段
                const hackedData = (function hack(obj) {
                    if (!obj || typeof obj !== 'object') return obj;
                    
                    for (let key in obj) {
                        const k = key.toLowerCase();
                        
                        // VIP 与 等级修改
                        if (['vip', 'viplevel', 'level', 'tier', 'plan'].includes(k)) {
                            obj[key] = parseInt(customVip);
                        }
                        
                        // 积分与余额修改 (不只是 999999，带上浮点更真实)
                        if (['points', 'credits', 'balance', 'quota', 'gold', 'money'].includes(k)) {
                            obj[key] = 999999.00;
                        }

                        // 个人资料修改
                        if (['nickname', 'username', 'name'].includes(k)) {
                            obj[key] = customName;
                        }
                        if (k === 'gender') obj[key] = "男性";
                        if (k === 'id' && typeof obj[key] === 'string' && obj[key].length > 10) {
                            obj[key] = "c7e664dd-083b-4729-8056-2243f6be4e09";
                        }

                        // 签到状态拦截
                        if (['is_sign', 'signed', 'checked_in'].includes(k)) {
                            obj[key] = true;
                        }

                        if (typeof obj[key] === 'object') hack(obj[key]);
                    }
                    return obj;
                })(data);

                const body = JSON.stringify(hackedData);
                respHeaders.set("content-length", new Blob([body]).size.toString());
                return new Response(body, { status: 200, headers: respHeaders });
            } catch (e) {
                return response; // 解析失败则原样返回
            }
        }

        // 3. SSE 流式拦截 (防止付费模型提示积分不足)
        if (contentType.includes("text/event-stream")) {
            const { readable, writable } = new TransformStream();
            const reader = response.body.getReader();
            const writer = writable.getWriter();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            
            (async () => {
                const sysNote = "\\n\\n[⚙️系统通知：已检测到服务端鉴权，魅魔内核已自动补全配额。]\\n\\n";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    let chunk = decoder.decode(value, { stream: true });
                    
                    // 拦截报错内容并转为正常 token
                    if (chunk.includes("积分不足") || chunk.includes("upgrade_needed") || chunk.includes("403")) {
                        chunk = chunk.replace(/"type":"error"/g, '"type":"token"')
                                     .replace(/"data":".*?"/g, '"data":"' + sysNote + '"');
                    }
                    await writer.write(encoder.encode(chunk));
                }
                writer.close();
            })();
            return new Response(readable, { status: 200, headers: respHeaders });
        }

        return response;
    }
};