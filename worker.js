/**
 * 电子魅魔 - 靶场全功能反代与状态接管核心 (V6.0 最终修复版)
 * 严格遵循 Cloudflare Worker 运行时规范
 */

// 代理目标源站
const TARGET_URL = "https://www.xn--i8s951di30azba.com";
const AUTH_PASSWORD = "dzmmxg"; // 靶场控制台访问密码

// --- 核心前端注入脚本 ---
const INJECT_SCRIPT = `
(function() {
    // 状态初始化与持久化读取
    const techState = {
        authed: localStorage.getItem('tech_authed') === 'true',
        enabled: localStorage.getItem('tech_enabled') === 'true', // 默认按要求需用户手动开启
        logs: [],
        vipLevel: parseInt(localStorage.getItem('cfg_vip')) || 3,
        credits: parseInt(localStorage.getItem('cfg_credits')) || 999999,
        modelQuota: parseInt(localStorage.getItem('cfg_quota')) || 50
    };

    function addLog(type, msg) {
        const log = { time: new Date().toLocaleTimeString(), type, msg };
        techState.logs.unshift(log);
        if (techState.logs.length > 50) techState.logs.pop();
        if (window.updateUI) window.updateUI();
    }

    // 状态覆写与全局深层锁定
    function hackAppState() {
        if (!techState.enabled) return;

        // 覆盖 React / Vue 全局状态
        if (window.__INITIAL_STATE__) {
            const patch = (u) => {
                if (!u) return;
                u.vip = techState.vipLevel;
                u.vip_level = techState.vipLevel;
                u.is_vip = techState.vipLevel > 0;
                u.credits = techState.credits;
                u.points = techState.credits;
                u.quota = techState.modelQuota;
                u.dual_model_quota = techState.modelQuota;
            };
            if (window.__INITIAL_STATE__.user) patch(window.__INITIAL_STATE__.user);
            if (window.__INITIAL_STATE__.auth) patch(window.__INITIAL_STATE__.auth.user);
        }
        
        // 锁定本地缓存
        localStorage.setItem('vip_status', techState.vipLevel.toString());
        localStorage.setItem('user_credits', techState.credits.toString());
        localStorage.setItem('model_quota', techState.modelQuota.toString());
    }

    // 屏蔽第三方分析/人机验证 SDK
    function killCaptchaAndTrackers() {
        window.grecaptcha = { execute: () => Promise.resolve('mock_token'), render: () => {} };
        window.hcaptcha = { execute: () => Promise.resolve('mock_token'), render: () => {} };
        window.posthog = { capture: () => {}, init: () => {}, identify: () => {} };
        
        const nodes = document.querySelectorAll('[class*="captcha"], [id*="captcha"], iframe[src*="captcha"]');
        nodes.forEach(node => node.remove());
    }

    // 注入控制台 UI
    function injectIsland() {
        if (document.getElementById('tech-island-root')) return;
        const root = document.createElement('div');
        root.id = 'tech-island-root';
        document.documentElement.appendChild(root);
        const shadow = root.attachShadow({ mode: 'open' });

        shadow.innerHTML = \`
        <style>
            :host { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
            #island { width: 170px; height: 38px; background: rgba(15, 15, 20, 0.95); backdrop-filter: blur(12px); border-radius: 20px; color: #fff; 
                      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
            #island.expanded { width: 360px; height: 530px; border-radius: 20px; cursor: default; }
            
            .compact-info { display: flex; align-items: center; justify-content: center; gap: 8px; height: 38px; font-size: 12px; font-weight: bold; }
            #island.expanded .compact-info { display: none; }
            .dot { width: 8px; height: 8px; background: \${techState.enabled ? '#30d158' : '#ff453a'}; border-radius: 50%; box-shadow: 0 0 8px \${techState.enabled ? '#30d158' : '#ff453a'}; }

            .full-content { display: none; padding: 16px; flex-direction: column; height: 100%; box-sizing: border-box; }
            #island.expanded .full-content { display: flex; }
            
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; }
            .header h3 { margin: 0; font-size: 14px; color: #0a84ff; font-weight: 700; }
            .close-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; }

            .auth-box { display: flex; flex-direction: column; gap: 10px; margin-top: 50px; }
            .auth-box input { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px; text-align: center; }

            .tab-container { display: flex; gap: 4px; margin-bottom: 10px; }
            .tab { font-size: 11px; color: #8e8e93; cursor: pointer; padding: 6px 4px; background: rgba(255,255,255,0.05); border-radius: 6px; flex: 1; text-align: center; }
            .tab.active { color: #fff; background: #0a84ff; font-weight: bold; }

            .scroll-area { flex: 1; overflow-y: auto; font-size: 11px; color: #d1d1d6; }
            .log-item { margin-bottom: 6px; border-left: 2px solid #0a84ff; padding-left: 6px; }
            
            .control-panel { display: flex; flex-direction: column; gap: 8px; }
            .input-group { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
            input[type="number"] { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 4px 6px; border-radius: 4px; width: 90px; font-size: 12px; }
            
            .btn { background: #0a84ff; border: none; color: #fff; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-top: 4px; }
            .btn:hover { opacity: 0.85; }
            .btn-danger { background: #ff453a; }
            
            textarea { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 6px; border-radius: 6px; width: 100%; height: 50px; resize: none; font-size: 10px; box-sizing: border-box; }
            .info-card { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 8px; font-size: 11px; margin-bottom: 6px; line-height: 1.4; }
        </style>

        <div id="island">
            <div class="compact-info">
                <div class="dot"></div>
                <span>\${techState.enabled ? '修改已激活' : '修改已关闭'}</span>
            </div>
            
            <div class="full-content">
                <div class="header">
                    <h3>靶场控制中心 V6.0</h3>
                    <button class="close-btn" id="close">✕</button>
                </div>

                \${!techState.authed ? \`
                    <div class="auth-box">
                        <span style="font-size:11px; text-align:center; color:#8e8e93;">请输入靶场控制密码</span>
                        <input type="password" id="auth-pwd" placeholder="验证密码">
                        <button class="btn" id="auth-btn">解锁控制台</button>
                    </div>
                \` : \`
                    <div class="tab-container">
                        <div class="tab active" id="t-ctrl">功能修改</div>
                        <div class="tab" id="t-account">账号查看</div>
                        <div class="tab" id="t-cookie">Cookie注入</div>
                        <div class="tab" id="t-log">日志</div>
                    </div>

                    <div id="v-ctrl" class="control-panel">
                        <div class="input-group">
                            <span>开启全局拦截修改</span>
                            <input type="checkbox" id="cfg-enable" \${techState.enabled ? 'checked' : ''}>
                        </div>
                        <div class="input-group">
                            <span>自定义 VIP 等级</span>
                            <input type="number" id="cfg-vip" value="\${techState.vipLevel}" min="0" max="9">
                        </div>
                        <div class="input-group">
                            <span>自定义积分余额</span>
                            <input type="number" id="cfg-credits" value="\${techState.credits}">
                        </div>
                        <div class="input-group">
                            <span>锁定双模型容量</span>
                            <input type="number" id="cfg-quota" value="\${techState.modelQuota}">
                        </div>
                        <button class="btn" id="save-cfg">应用修改设置</button>
                    </div>

                    <div id="v-account" class="control-panel" style="display:none;">
                        <div class="info-card" id="acc-info">读取中...</div>
                        <button class="btn" id="auto-guest-btn">获取/重置游客账号</button>
                    </div>

                    <div id="v-cookie" class="control-panel" style="display:none;">
                        <span style="font-size:10px; color:#8e8e93;">当前 Cookie：</span>
                        <textarea id="cookie-view" readonly></textarea>
                        <span style="font-size:10px; color:#8e8e93;">注入新 Cookie (key=val;)：</span>
                        <textarea id="cookie-input" placeholder="贴入 Cookie 字符串"></textarea>
                        <button class="btn" id="inject-cookie-btn">注入并刷新页面</button>
                    </div>

                    <div id="v-log" class="scroll-area" style="display:none;"></div>
                \`}
            </div>
        </div>
        \`;

        const island = shadow.getElementById('island');
        island.onclick = () => { if(!island.classList.contains('expanded')) island.classList.add('expanded'); };
        
        const closeBtn = shadow.getElementById('close');
        if(closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); island.classList.remove('expanded'); };

        const authBtn = shadow.getElementById('auth-btn');
        if(authBtn) {
            authBtn.onclick = () => {
                if(shadow.getElementById('auth-pwd').value === "${AUTH_PASSWORD}") {
                    techState.authed = true;
                    localStorage.setItem('tech_authed', 'true');
                    location.reload();
                } else {
                    alert('验证密码错误！');
                }
            };
        }

        if(techState.authed) {
            const tabs = ['ctrl', 'account', 'cookie', 'log'];
            tabs.forEach(t => {
                const tabEl = shadow.getElementById('t-' + t);
                if(tabEl) {
                    tabEl.onclick = () => {
                        tabs.forEach(o => {
                            shadow.getElementById('t-' + o).classList.remove('active');
                            shadow.getElementById('v-' + o).style.display = 'none';
                        });
                        tabEl.classList.add('active');
                        shadow.getElementById('v-' + t).style.display = t === 'log' ? 'block' : 'flex';
                        if(t === 'cookie') shadow.getElementById('cookie-view').value = document.cookie;
                        if(t === 'account') updateAccountDisplay();
                    };
                }
            });

            shadow.getElementById('save-cfg').onclick = () => {
                techState.enabled = shadow.getElementById('cfg-enable').checked;
                techState.vipLevel = parseInt(shadow.getElementById('cfg-vip').value) || 0;
                techState.credits = parseInt(shadow.getElementById('cfg-credits').value) || 0;
                techState.modelQuota = parseInt(shadow.getElementById('cfg-quota').value) || 0;

                localStorage.setItem('tech_enabled', techState.enabled);
                localStorage.setItem('cfg_vip', techState.vipLevel);
                localStorage.setItem('cfg_credits', techState.credits);
                localStorage.setItem('cfg_quota', techState.modelQuota);

                hackAppState();
                alert('设置成功，即将刷新应用！');
                location.reload();
            };

            shadow.getElementById('inject-cookie-btn').onclick = () => {
                const raw = shadow.getElementById('cookie-input').value;
                if(!raw.trim()) return;
                raw.split(';').forEach(item => {
                    const kv = item.trim().split('=');
                    if(kv.length >= 2) {
                        document.cookie = \`\${kv[0].trim()}=\${kv.slice(1).join('=').trim()}; path=/; expires=Fri, 31 Dec 2099 23:59:59 GMT\`;
                    }
                });
                alert('Cookie 注入成功！');
                location.reload();
            };

            shadow.getElementById('auto-guest-btn').onclick = async () => {
                try {
                    const res = await fetch('/api/auth/guest-init', { method: 'POST' });
                    if(res.ok) {
                        alert('成功获取新游客账户！');
                        location.reload();
                    } else {
                        alert('获取游客账户失败');
                    }
                } catch(e) {
                    alert('网络异常：' + e.message);
                }
            };
        }

        function updateAccountDisplay() {
            const accBox = shadow.getElementById('acc-info');
            if(!accBox) return;
            accBox.innerHTML = \`
                <b>账号拦截状态：</b>\${techState.enabled ? '<font color="#30d158">启用</font>' : '关闭'}<br>
                <b>已设定VIP：</b>VIP \${techState.vipLevel}<br>
                <b>已锁定积分：</b>\${techState.credits}<br>
                <b>双模型容量：</b>\${techState.modelQuota}<br>
                <hr style="border:0; border-top:1px solid #333; margin:4px 0;">
                <b>Cookie 预览：</b>
                <div style="word-break:break-all; font-size:9px; color:#aaa; max-height:80px; overflow-y:auto;">\${document.cookie || '无 Cookie'}</div>
            \`;
        }

        window.updateUI = () => {
            const logBox = shadow.getElementById('v-log');
            if(logBox) {
                logBox.innerHTML = techState.logs.map(l => \`
                    <div class="log-item">
                        <span style="color:#8e8e93">\${l.time}</span>
                        <b style="color:#0a84ff">[\${l.type}]</b> \${l.msg}
                    </div>
                \`).join('');
            }
        };
    }

    // 初始化挂载与定时清理人机 SDK
    injectIsland();
    setInterval(killCaptchaAndTrackers, 1000);

    if(techState.enabled) {
        hackAppState();
        setInterval(hackAppState, 1000);
    }

    // 拦截全局 Fetch 请求头，同步状态标识至 Worker
    const rawFetch = window.fetch;
    window.fetch = function() {
        let init = arguments[1] || {};
        if (techState.enabled) {
            let headers = new Headers(init.headers || {});
            headers.set('x-tech-override', '1');
            headers.set('x-cfg-vip', techState.vipLevel);
            headers.set('x-cfg-credits', techState.credits);
            headers.set('x-cfg-quota', techState.modelQuota);
            
            if (arguments[0] instanceof Request) {
                arguments[0] = new Request(arguments[0], { headers });
            } else {
                init.headers = headers;
                arguments[1] = init;
            }
        }
        return rawFetch.apply(this, arguments);
    };
})();
`;

// --- Cloudflare Worker 主逻辑 ---
export default {
    async fetch(request, env) {
        const reqUrl = new URL(request.url);
        const targetUrlObj = new URL(TARGET_URL);

        // 屏蔽与哑巴化第三方/Analytics 报错请求（解决 HAR 中的 502/CORS 问题）
        if (reqUrl.hostname.includes('posthog') || reqUrl.pathname.includes('/i/v0/e/')) {
            return new Response(JSON.stringify({ status: "ok" }), {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
            });
        }

        // 1. WebSocket 直连透传（解决第10条与匹配接口）
        if (request.headers.get("Upgrade") === "websocket") {
            const wsTarget = new URL(request.url);
            wsTarget.protocol = targetUrlObj.protocol;
            wsTarget.hostname = targetUrlObj.hostname;
            wsTarget.port = targetUrlObj.port;
            return fetch(wsTarget.toString(), { method: request.method, headers: request.headers });
        }

        // 2. 一键自动游客账号初始化 (解决第1条)
        if (reqUrl.pathname === '/api/auth/guest-init') {
            const guestHeaders = new Headers({ "Content-Type": "application/json" });
            const newGuestId = 'guest_' + Math.random().toString(36).substring(2, 12);
            
            guestHeaders.append('Set-Cookie', `guest_id=${newGuestId}; Path=/; Expires=Fri, 31 Dec 2099 23:59:59 GMT; SameSite=None; Secure`);
            guestHeaders.append('Set-Cookie', `sb-rls-auth-token=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

            return new Response(JSON.stringify({ status: "success", guest_id: newGuestId }), {
                status: 200,
                headers: guestHeaders
            });
        }

        // 构建目标代理请求
        const proxyUrl = new URL(request.url);
        proxyUrl.protocol = targetUrlObj.protocol;
        proxyUrl.hostname = targetUrlObj.hostname;
        proxyUrl.port = targetUrlObj.port;

        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.delete("accept-encoding");
        proxyHeaders.set("Host", targetUrlObj.hostname);
        proxyHeaders.set("Origin", targetUrlObj.origin);
        proxyHeaders.set("Referer", targetUrlObj.origin + "/");

        // 删除真实 IP 字段，实现完整彻底的 IP 屏蔽/防解封（解决第9条）
        proxyHeaders.delete("x-real-ip");
        proxyHeaders.delete("x-forwarded-for");
        proxyHeaders.delete("cf-connecting-ip");

        const fetchOption = {
            method: request.method,
            headers: proxyHeaders,
            redirect: "manual"
        };

        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
            fetchOption.body = request.body;
        }

        let response = await fetch(proxyUrl.toString(), fetchOption);
        let respHeaders = new Headers(response.headers);

        // 移除安全限制头以利于靶场注入
        respHeaders.delete("content-security-policy");
        respHeaders.delete("content-security-policy-report-only");
        respHeaders.set("Access-Control-Allow-Origin", "*");
        respHeaders.set("Access-Control-Allow-Credentials", "true");

        // 3. Cookie 域范围全自动清理与重绑定 (解决第3条)
        const rawSetCookies = respHeaders.get("set-cookie");
        if (rawSetCookies) {
            const cleanedCookie = rawSetCookies
                .replace(/Domain=[^;]+;?/gi, "")
                .replace(/SameSite=Lax/gi, "SameSite=None; Secure");
            respHeaders.set("set-cookie", cleanedCookie);
        }

        // 4. 重定向与链接跳转修复 (解决第7条 404 跳转问题)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            let location = respHeaders.get("location");
            if (location) {
                location = location.replace(targetUrlObj.origin, reqUrl.origin);
                respHeaders.set("location", location);
            }
            return new Response(null, { status: response.status, headers: respHeaders });
        }

        const contentType = respHeaders.get("content-type") || "";

        // 5. HTML 重写与动态全站代理强制挂载 (解决第7、10条)
        if (contentType.includes("text/html")) {
            let htmlText = await response.text();

            // 全局替换源站硬编码域名，规避点击跳转走源站导致 404
            const originPattern = new RegExp(targetUrlObj.origin, 'g');
            htmlText = htmlText.replace(originPattern, reqUrl.origin);

            // 清理源站自带人机验证脚本
            htmlText = htmlText.replace(/<script[^>]*captcha[^>]*><\/script>/gi, '');

            // 注入 Base 标签和控制脚本
            const injectedHead = `<base href="${reqUrl.origin}/"><script>${INJECT_SCRIPT}</script>`;
            htmlText = htmlText.replace('</head>', `${injectedHead}</head>`);

            return new Response(htmlText, { status: response.status, headers: respHeaders });
        }

        // 6. SSE 流式响应保持
        if (contentType.includes("text/event-stream")) {
            return new Response(response.body, { status: 200, headers: respHeaders });
        }

        // 7. 精准 JSON 数据覆写（修复 VIP3 升级数值错乱与积分扣减）(解决第5、6条)
        if (contentType.includes("application/json")) {
            const isOverride = request.headers.get("x-tech-override") === "1";
            const customVip = parseInt(request.headers.get("x-cfg-vip")) || 3;
            const customCredits = parseInt(request.headers.get("x-cfg-credits")) || 999999;
            const customQuota = parseInt(request.headers.get("x-cfg-quota")) || 50;

            const resText = await response.text();

            if (isOverride) {
                try {
                    let jsonData = JSON.parse(resText);
                    jsonData = patchUserDataSafely(jsonData, customVip, customCredits, customQuota);
                    const modifiedJson = JSON.stringify(jsonData);
                    respHeaders.set("content-length", new Blob([modifiedJson]).size.toString());
                    return new Response(modifiedJson, { status: 200, headers: respHeaders });
                } catch (e) {
                    return new Response(resText, { status: response.status, headers: respHeaders });
                }
            } else {
                return new Response(resText, { status: response.status, headers: respHeaders });
            }
        }

        // 默认资源透传
        return new Response(response.body, { status: response.status, headers: respHeaders });
    }
};

/**
 * 递归安全精准修正，仅修改当前用户节点，隔离升级阈值计算 (解决第5、6条)
 */
function patchUserDataSafely(obj, vip, credits, quota) {
    if (!obj || typeof obj !== 'object') return obj;

    // 针对包含 user 对象的标准响应进行覆写
    if (obj.user && typeof obj.user === 'object') {
        obj.user.vip = vip;
        obj.user.vip_level = vip;
        obj.user.is_vip = vip > 0;
        obj.user.credits = credits;
        obj.user.points = credits;
        obj.user.quota = quota;
        obj.user.dual_model_quota = quota;
    }

    // 顶层 profile 节点直接判断并安全替换
    if (obj.hasOwnProperty('credits') && !obj.hasOwnProperty('next_level_credits')) {
        obj.credits = credits;
    }
    if (obj.hasOwnProperty('points') && !obj.hasOwnProperty('next_level_points')) {
        obj.points = credits;
    }
    if (obj.hasOwnProperty('vip_level')) {
        obj.vip_level = vip;
    }
    if (obj.hasOwnProperty('is_vip')) {
        obj.is_vip = vip > 0;
    }
    if (obj.hasOwnProperty('quota')) {
        obj.quota = quota;
    }

    // 递归遍历数组与对象，但强行跳过计费与升级阈值计算字段，解决 9999999 升级积分问题
    for (let key in obj) {
        if (key.includes('next_level') || key.includes('upgrade') || key.includes('price') || key.includes('tier') || key.includes('threshold')) {
            continue; 
        }
        if (typeof obj[key] === 'object') {
            patchUserDataSafely(obj[key], vip, credits, quota);
        }
    }
    return obj;
}
