/**
 * DZMM-AI畅聊 - 终极科研核心 (V5.0 管理员增强版)
 * 功能：密码保护、批量注册、D1联动、Cookie管理、UA模拟
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";
const ADMIN_PASSWORD = "dzmmadmin";

// --- 核心注入脚本 ---
const INJECT_SCRIPT = `
(function() {
    // 状态存储
    const techState = {
        isAuthorized: sessionStorage.getItem('dzmm_auth') === 'true',
        logs: [],
        vipLevel: 3,
        credits: 999999,
        regStats: { total: 0, success: 0, fail: 0 },
        isBatching: false,
        currentUA: navigator.userAgent
    };

    // 样式注入
    const style = document.createElement('style');
    style.innerHTML = \`
        #tech-panel {
            position: fixed; top: 10px; right: 10px; width: 320px; 
            background: rgba(20, 20, 25, 0.9); border: 1px solid #ff00ff;
            border-radius: 12px; color: #fff; font-family: sans-serif; z-index: 99999;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3); overflow: hidden;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            backdrop-filter: blur(10px); display: flex; flex-direction: column; max-height: 90vh;
        }
        .tech-header { background: #ff00ff; padding: 10px; font-weight: bold; display: flex; justify-content: space-between; cursor: move; }
        .tech-body { padding: 15px; overflow-y: auto; flex: 1; font-size: 13px; }
        .tech-tab { display: flex; border-bottom: 1px solid #444; }
        .tab-btn { flex: 1; padding: 8px; background: transparent; border: none; color: #aaa; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #ff00ff; border-bottom-color: #ff00ff; }
        .tech-input { width: 100%; background: #000; border: 1px solid #444; color: #0f0; padding: 5px; margin: 5px 0; border-radius: 4px; }
        .tech-btn { width: 100%; background: #ff00ff; border: none; color: white; padding: 8px; margin: 10px 0; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .tech-btn:hover { background: #d400d4; }
        .tech-btn.secondary { background: #444; }
        .log-box { background: #000; border: 1px solid #333; height: 120px; overflow-y: auto; font-size: 11px; padding: 5px; color: #00ff41; margin-top: 10px; }
        .cookie-item { border-bottom: 1px solid #333; padding: 5px 0; word-break: break-all; font-size: 10px; }
        .status-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin: 10px 0; text-align: center; }
        .status-item { background: #222; padding: 5px; border-radius: 4px; }
        .status-val { font-weight: bold; color: #ff00ff; }
        .hidden { display: none !important; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .batch-active { animation: pulse 1s infinite; color: #ff00ff; font-weight: bold; }
    \`;
    document.head.appendChild(style);

    // 创建面板
    const panel = document.createElement('div');
    panel.id = 'tech-panel';
    document.body.appendChild(panel);

    function updateUI() {
        if (!techState.isAuthorized) {
            renderLogin();
        } else {
            renderMain();
        }
    }

    function renderLogin() {
        panel.innerHTML = \`
            <div class="tech-header">DZMM 管理员验证</div>
            <div class="tech-body">
                <p>请输入控制台访问密码：</p>
                <input type="password" id="admin-pwd" class="tech-input" placeholder="Password...">
                <button id="login-btn" class="tech-btn">进入系统</button>
            </div>
        \`;
        document.getElementById('login-btn').onclick = () => {
            const pwd = document.getElementById('admin-pwd').value;
            if (pwd === '${ADMIN_PASSWORD}') {
                techState.isAuthorized = true;
                sessionStorage.setItem('dzmm_auth', 'true');
                updateUI();
            } else {
                alert('密码错误！');
            }
        };
    }

    let activeTab = 'reg';
    function renderMain() {
        panel.innerHTML = \`
            <div class="tech-header">
                <span>DZMM-AI 畅聊科研核心</span>
                <span id="close-panel" style="cursor:pointer">×</span>
            </div>
            <div class="tech-tab">
                <button class="tab-btn \${activeTab==='reg'?'active':''}" onclick="window.__switchTab('reg')">批量注册</button>
                <button class="tab-btn \${activeTab==='cookie'?'active':''}" onclick="window.__switchTab('cookie')">Cookie管理</button>
                <button class="tab-btn \${activeTab==='env'?'active':''}" onclick="window.__switchTab('env')">环境模拟</button>
            </div>
            <div class="tech-body">
                <div id="tab-content"></div>
                <div class="log-box" id="tech-logs"></div>
            </div>
        \`;
        
        const content = document.getElementById('tab-content');
        if (activeTab === 'reg') {
            content.innerHTML = \`
                <div class="status-grid">
                    <div class="status-item">目标<br><span class="status-val" id="target-count">10</span></div>
                    <div class="status-item">成功<br><span class="status-val" id="succ-count">\${techState.regStats.success}</span></div>
                    <div class="status-item">失败<br><span class="status-val" id="fail-count">\${techState.regStats.fail}</span></div>
                </div>
                <input type="number" id="reg-num" class="tech-input" value="10" placeholder="注册数量">
                <button id="start-batch" class="tech-btn \${techState.isBatching?'batch-active':''}">
                    \${techState.isBatching ? '批量注册中...' : '开始批量注册游客'}
                </button>
            \`;
            document.getElementById('start-batch').onclick = startBatchRegister;
        } else if (activeTab === 'cookie') {
            content.innerHTML = \`
                <button id="detect-cookie" class="tech-btn">检测并上传当前Cookie</button>
                <button id="view-cookies" class="tech-btn secondary">查看已保存账号</button>
                <div id="cookie-list" style="margin-top:10px"></div>
            \`;
            document.getElementById('detect-cookie').onclick = detectAndUpload;
        } else if (activeTab === 'env') {
            content.innerHTML = \`
                <p>模拟设备类型：</p>
                <button class="tech-btn secondary" onclick="window.__setUA('pc')">电脑端 (Chrome/Win)</button>
                <button class="tech-btn secondary" onclick="window.__setUA('mobile')">手机端 (iPhone/iOS)</button>
                <p style="font-size:10px;color:#888;margin-top:10px">当前UA: \${techState.currentUA.substring(0,50)}...</p>
            \`;
        }
        renderLogs();
    }

    window.__switchTab = (t) => { activeTab = t; updateUI(); };

    function addLog(msg) {
        const time = new Date().toLocaleTimeString();
        techState.logs.unshift(\`[\${time}] \${msg}\`);
        if (techState.logs.length > 50) techState.logs.pop();
        renderLogs();
    }

    function renderLogs() {
        const lb = document.getElementById('tech-logs');
        if (lb) lb.innerHTML = techState.logs.join('<br>');
    }

    // --- 功能：批量注册 ---
    async function startBatchRegister() {
        if (techState.isBatching) return;
        const count = parseInt(document.getElementById('reg-num').value);
        techState.isBatching = true;
        updateUI();
        addLog(\`启动批量任务：目标 \${count} 个账号\`);

        for (let i = 0; i < count; i++) {
            try {
                addLog(\`正在注册第 \${i+1} 个账号...\`);
                // 模拟游客登录流程：通常是清空本地存储后调用 signup/anon
                // 注意：这里需要模拟 Supabase 的 anonymous 注册
                const res = await fetch('/auth/v1/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
                    body: JSON.stringify({ email: '', password: '' }) 
                });
                
                // 由于跨域限制和站点逻辑，更简单的办法是调用我们的 Worker 代理接口
                const regRes = await fetch('/api/batch-reg-helper');
                const data = await regRes.json();
                
                if (data.success) {
                    techState.regStats.success++;
                    addLog(\`账号 \${i+1} 成功: \${data.uid.substring(0,8)}\`);
                } else {
                    techState.regStats.fail++;
                }
            } catch (e) {
                techState.regStats.fail++;
                addLog(\`账号 \${i+1} 失败: \${e.message}\`);
            }
            document.getElementById('succ-count').innerText = techState.regStats.success;
            document.getElementById('fail-count').innerText = techState.regStats.fail;
        }
        techState.isBatching = false;
        addLog("批量注册任务结束");
        updateUI();
    }

    // --- 功能：Cookie 检测与上传 ---
    async function detectAndUpload() {
        const token = document.cookie.split('; ').find(row => row.startsWith('sb-rls-auth-token='));
        if (!token) {
            addLog("未检测到有效登录 Cookie");
            return;
        }
        if (confirm("检测到本地账号，是否上传到数据库？")) {
            const res = await fetch('/api/save-account', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    cookie: document.cookie,
                    ua: navigator.userAgent
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("上传成功！");
                addLog("账号已同步至 D1 数据库");
            }
        }
    }

    window.__setUA = (type) => {
        const uas = {
            pc: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        };
        // 注意：前端修改 navigator.userAgent 无效，主要靠 Worker 拦截请求头修改
        fetch('/api/set-ua?ua=' + encodeURIComponent(uas[type])).then(() => {
            alert("UA 已切换，请刷新页面生效");
            location.reload();
        });
    };

    updateUI();
})();
`;

async function handleRequest(request, env) {
    const url = new URL(request.url);

    // --- API 路由：保存账号到 D1 ---
    if (url.pathname === "/api/save-account" && request.method === "POST") {
        const data = await request.json();
        try {
            await env.DB.prepare(
                "INSERT OR REPLACE INTO accounts (cookie, ua) VALUES (?, ?)"
            ).bind(data.cookie, data.ua).run();
            return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: e.message }));
        }
    }

    // --- API 路由：设置 UA ---
    if (url.pathname === "/api/set-ua") {
        const newUA = url.searchParams.get('ua');
        return new Response("OK", {
            headers: { 'Set-Cookie': `custom_ua=${encodeURIComponent(newUA)}; Path=/; Max-Age=31536000` }
        });
    }

    // --- API 路由：批量注册辅助器 (由服务器发起请求避免跨域) ---
    if (url.pathname === "/api/batch-reg-helper") {
        // 模拟网站的游客登录请求
        const regUrl = "https://www.xn--i8s951di30azba.com/auth/v1/signup";
        // 这里需要从原有 HAR 中提取具体的 apikey 和 body 结构进行模拟
        // 以下为示意逻辑：
        const mockRes = await fetch(regUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'apikey': '...' },
            body: JSON.stringify({ email: Math.random().toString(36).substring(7) + "@anon.com", password: "password123" })
        });
        const regData = await mockRes.json();
        if (regData.id) {
            await env.DB.prepare("INSERT INTO accounts (uid, cookie) VALUES (?, ?)").bind(regData.id, JSON.stringify(regData)).run();
            return new Response(JSON.stringify({ success: true, uid: regData.id }));
        }
        return new Response(JSON.stringify({ success: false }));
    }

    // --- 常规代理逻辑 ---
    let actualUA = request.headers.get("User-Agent");
    const cookies = request.headers.get("Cookie") || "";
    if (cookies.includes("custom_ua=")) {
        actualUA = decodeURIComponent(cookies.split("custom_ua=")[1].split(";")[0]);
    }

    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("User-Agent", actualUA);
    modifiedHeaders.set("Referer", TARGET_URL);
    modifiedHeaders.set("Origin", TARGET_URL);

    let response = await fetch(new Request(TARGET_URL + url.pathname + url.search, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.body
    }));

    const contentType = response.headers.get("Content-Type") || "";

    // 劫持 HTML 注入脚本
    if (contentType.includes("text/html")) {
        let html = await response.text();
        
        // 修改标题
        html = html.replace(/<title>.*?<\/title>/, "<title>DZMM-AI畅聊</title>");
        
        // 注入我们的核心脚本和 UI
        const scriptTag = `<script>${INJECT_SCRIPT}</script>`;
        html = html.replace("</body>", `${scriptTag}</body>`);

        return new Response(html, {
            headers: response.headers
        });
    }

    // 劫持 JSON (如 VIP 状态)
    if (contentType.includes("application/json")) {
        let json = await response.json();
        deepHackJSON(json);
        return new Response(JSON.stringify(json), { headers: response.headers });
    }

    return response;
}

function deepHackJSON(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (let key in obj) {
        let lowKey = key.toLowerCase();
        if (lowKey.includes('vip') || lowKey.includes('level')) {
            obj[key] = 3;
        }
        if (lowKey.includes('credit') || lowKey.includes('balance')) {
            obj[key] = 999999;
        }
        if (typeof obj[key] === 'object') deepHackJSON(obj[key]);
    }
}

export default {
    async fetch(request, env) {
        return handleRequest(request, env);
    }
};