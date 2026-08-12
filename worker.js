/**
 * 电子魅魔 - 靶场全功能反代与状态接管核心 (V5.1 修复版)
 * - 修复 Set-Cookie 多值丢失问题
 * - 确保验证图片正常加载
 * - 完整保留 Cookie 传递
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";
const AUTH_PASSWORD = "dzmmxg"; // 靶场控制台访问密码

// --- 前端注入脚本（内含 Cookie 注入功能）---
const INJECT_SCRIPT = `
(function() {
    const techState = {
        authed: localStorage.getItem('tech_authed') === 'true',
        enabled: localStorage.getItem('tech_enabled') === 'true',
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

    function hackAppState() {
        if (!techState.enabled) return;
        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.user) {
            const u = window.__INITIAL_STATE__.user;
            u.vip = u.vip_level = techState.vipLevel;
            u.is_vip = techState.vipLevel > 0;
            u.credits = u.points = techState.credits;
            u.quota = techState.modelQuota;
        }
        localStorage.setItem('vip_status', techState.vipLevel);
        localStorage.setItem('user_credits', techState.credits);
    }

    function killCaptcha() {
        window.grecaptcha = { execute: () => Promise.resolve('mock_token'), render: () => {} };
        window.hcaptcha = { execute: () => Promise.resolve('mock_token'), render: () => {} };
        document.querySelectorAll('[class*="captcha"], [id*="captcha"], iframe[src*="captcha"]').forEach(el => el.remove());
    }

    function injectIsland() {
        if (document.getElementById('tech-island-root')) return;
        const root = document.createElement('div');
        root.id = 'tech-island-root';
        document.documentElement.appendChild(root);
        const shadow = root.attachShadow({ mode: 'open' });

        shadow.innerHTML = \`
        <style>
            :host { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #island { width: 160px; height: 38px; background: rgba(15,15,20,0.95); backdrop-filter: blur(12px); border-radius: 20px; color: #fff; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
            #island.expanded { width: 360px; height: 520px; border-radius: 24px; cursor: default; }
            .compact-info { display: flex; align-items: center; justify-content: center; gap: 8px; height: 38px; }
            #island.expanded .compact-info { display: none; }
            .dot { width: 8px; height: 8px; background: \${techState.enabled ? '#30d158' : '#ff453a'}; border-radius: 50%; box-shadow: 0 0 8px \${techState.enabled ? '#30d158' : '#ff453a'}; }
            .status-text { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
            .full-content { display: none; padding: 18px; flex-direction: column; height: 100%; box-sizing: border-box; }
            #island.expanded .full-content { display: flex; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
            .header h3 { margin: 0; font-size: 15px; color: #0a84ff; font-weight: 700; }
            .close-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
            .auth-box { display: flex; flex-direction: column; gap: 10px; margin-top: 40px; }
            .auth-box input { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 10px; border-radius: 8px; font-size: 14px; text-align: center; }
            .tab-container { display: flex; gap: 6px; margin-bottom: 12px; }
            .tab { font-size: 11px; color: #8e8e93; cursor: pointer; padding: 6px 10px; background: rgba(255,255,255,0.05); border-radius: 6px; flex: 1; text-align: center; }
            .tab.active { color: #fff; background: #0a84ff; font-weight: bold; }
            .scroll-area { flex: 1; overflow-y: auto; font-size: 11px; color: #d1d1d6; }
            .log-item { margin-bottom: 6px; border-left: 2px solid #0a84ff; padding-left: 6px; }
            .control-panel { display: flex; flex-direction: column; gap: 10px; }
            .input-group { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
            input[type="number"] { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 6px 8px; border-radius: 6px; width: 80px; font-size: 12px; }
            .btn { background: #0a84ff; border: none; color: #fff; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.85; }
            .btn-danger { background: #ff453a; }
            .btn-sub { background: rgba(255,255,255,0.15); color: #eee; }
            textarea { background: #1c1c1e; border: 1px solid #3a3a3c; color: #fff; padding: 8px; border-radius: 6px; width: 100%; height: 60px; resize: none; font-size: 11px; box-sizing: border-box; }
            .info-card { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px; font-size: 11px; margin-bottom: 8px; line-height: 1.5; }
        </style>
        <div id="island">
            <div class="compact-info">
                <div class="dot"></div>
                <span class="status-text">\${techState.enabled ? '修改核心已激活' : '修改已暂停'}</span>
            </div>
            <div class="full-content">
                <div class="header">
                    <h3>靶场控制中心 V5.0</h3>
                    <button class="close-btn" id="close">✕</button>
                </div>
                \${!techState.authed ? \`
                    <div class="auth-box">
                        <span style="font-size:12px; text-align:center; color:#8e8e93;">请输入控制验证密码</span>
                        <input type="password" id="auth-pwd" placeholder="验证密码">
                        <button class="btn" id="auth-btn">身份解锁</button>
                    </div>
                \` : \`
                    <div class="tab-container">
                        <div class="tab active" id="t-ctrl">功能修改</div>
                        <div class="tab" id="t-account">账号控制</div>
                        <div class="tab" id="t-cookie">Cookie注入</div>
                        <div class="tab" id="t-log">日志记录</div>
                    </div>
                    <div id="v-ctrl" class="control-panel">
                        <div class="input-group"><span>开启拦截修改</span><input type="checkbox" id="cfg-enable" \${techState.enabled ? 'checked' : ''}></div>
                        <div class="input-group"><span>自定义 VIP 等级</span><input type="number" id="cfg-vip" value="\${techState.vipLevel}" min="0" max="9"></div>
                        <div class="input-group"><span>自定义积分余额</span><input type="number" id="cfg-credits" value="\${techState.credits}"></div>
                        <div class="input-group"><span>锁定双模型容量</span><input type="number" id="cfg-quota" value="\${techState.modelQuota}"></div>
                        <button class="btn" id="save-cfg">应用并保存设置</button>
                    </div>
                    <div id="v-account" class="control-panel" style="display:none;">
                        <div class="info-card" id="acc-info">正在读取当前真实账号信息...</div>
                        <button class="btn" id="auto-guest-btn">一键自动获取/刷取游客账号</button>
                    </div>
                    <div id="v-cookie" class="control-panel" style="display:none;">
                        <span style="font-size:11px; color:#8e8e93;">当前站点的 Cookie：</span>
                        <textarea id="cookie-view" readonly></textarea>
                        <span style="font-size:11px; color:#8e8e93;">写入新 Cookie (格式: k1=v1; k2=v2)：</span>
                        <textarea id="cookie-input" placeholder="贴入 Cookie 字符串..."></textarea>
                        <button class="btn" id="inject-cookie-btn">强行注入并刷新</button>
                    </div>
                    <div id="v-log" class="scroll-area" style="display:none;"></div>
                \`}
            </div>
        </div>
        \`;

        const island = shadow.getElementById('island');
        island.onclick = (e) => { if(!island.classList.contains('expanded')) island.classList.add('expanded'); };
        const closeBtn = shadow.getElementById('close');
        if(closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); island.classList.remove('expanded'); };

        const authBtn = shadow.getElementById('auth-btn');
        if(authBtn) {
            authBtn.onclick = () => {
                const pwd = shadow.getElementById('auth-pwd').value;
                if(pwd === "${AUTH_PASSWORD}") {
                    techState.authed = true;
                    localStorage.setItem('tech_authed', 'true');
                    location.reload();
                } else alert('验证密码错误！');
            };
        }

        if(techState.authed) {
            const tabs = ['ctrl', 'account', 'cookie', 'log'];
            tabs.forEach(t => {
                const tabEl = shadow.getElementById('t-' + t);
                if(tabEl) {
                    tabEl.onclick = () => {
                        tabs.forEach(other => {
                            shadow.getElementById('t-' + other).classList.remove('active');
                            shadow.getElementById('v-' + other).style.display = 'none';
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
                addLog('SYS', '全局配置已重新写入持久化区');
                hackAppState();
                alert('设置成功，即将刷新页面应用！');
                location.reload();
            };

            shadow.getElementById('inject-cookie-btn').onclick = () => {
                const rawCookie = shadow.getElementById('cookie-input').value;
                if(!rawCookie.trim()) return;
                rawCookie.split(';').forEach(item => {
                    const kv = item.trim().split('=');
                    if(kv.length >= 2) {
                        const key = kv[0].trim();
                        const val = kv.slice(1).join('=').trim();
                        document.cookie = \`\${key}=\${val}; path=/; expires=Fri, 31 Dec 2099 23:59:59 GMT\`;
                    }
                });
                addLog('COOKIE', '手动注入 Cookie 成功');
                alert('Cookie 注入成功，页面即刻重载');
                location.reload();
            };

            shadow.getElementById('auto-guest-btn').onclick = async () => {
                addLog('AUTH', '请求后端重新分配游客 Identity...');
                try {
                    const res = await fetch('/api/auth/guest-init', { method: 'POST', headers: { 'x-force-new-guest': '1' } });
                    if(res.ok) {
                        alert('已成功刷新并重置游客账户！');
                        location.reload();
                    } else alert('游客生成接口失败，请清空 Cookie 后直接刷新');
                } catch(e) { alert('网络异常：' + e.message); }
            };
        }

        function updateAccountDisplay() {
            const accBox = shadow.getElementById('acc-info');
            if(!accBox) return;
            const cookies = document.cookie;
            accBox.innerHTML = \`
                <b>当前客户端状态：</b><br>
                状态：\${techState.enabled ? '<font color="#30d158">本地拦截挂载中</font>' : '原生状态'}<br>
                VIP等级：\${techState.vipLevel}<br>
                积分点数：\${techState.credits}<br>
                模型配额：\${techState.modelQuota}容量<br>
                <hr style="border:0; border-top:1px solid #333; margin:4px 0;">
                <div style="word-break:break-all; font-size:10px; color:#aaa;">\${cookies || '未检测到任何 Cookie'}</div>
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

    injectIsland();
    setInterval(killCaptcha, 1000);

    if(techState.enabled) {
        hackAppState();
        setInterval(hackAppState, 1500);
    }

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

// --- Worker 主逻辑 ---
export default {
    async fetch(request, env) {
        const reqUrl = new URL(request.url);
        const targetUrlObj = new URL(TARGET_URL);

        // WebSocket 直连
        if (request.headers.get("Upgrade") === "websocket") {
            const wsTarget = new URL(request.url);
            wsTarget.protocol = targetUrlObj.protocol;
            wsTarget.hostname = targetUrlObj.hostname;
            wsTarget.port = targetUrlObj.port;
            return fetch(wsTarget.toString(), {
                method: request.method,
                headers: request.headers
            });
        }

        // 游客账号重置接口
        if (reqUrl.pathname === '/api/auth/guest-init') {
            const guestHeaders = new Headers();
            guestHeaders.append('Set-Cookie', `sb-rls-auth-token=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
            guestHeaders.append('Set-Cookie', `guest_id=guest_${Math.random().toString(36).substring(2, 10)}; Path=/; Expires=Fri, 31 Dec 2099 23:59:59 GMT`);
            return new Response(JSON.stringify({ status: "success", message: "Guest Account Generated" }), {
                status: 200,
                headers: guestHeaders
            });
        }

        // 构建代理请求
        const proxyUrl = new URL(request.url);
        proxyUrl.protocol = targetUrlObj.protocol;
        proxyUrl.hostname = targetUrlObj.hostname;
        proxyUrl.port = targetUrlObj.port;

        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.delete("accept-encoding");
        proxyHeaders.set("Host", targetUrlObj.hostname);
        proxyHeaders.set("Origin", targetUrlObj.origin);
        proxyHeaders.set("Referer", targetUrlObj.origin + "/");
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

        // 处理重定向
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            let location = respHeaders.get("location");
            if (location) {
                location = location.replace(targetUrlObj.origin, reqUrl.origin);
                respHeaders.set("location", location);
            }
            return new Response(null, { status: response.status, headers: respHeaders });
        }

        // 移除 CSP，添加 CORS
        respHeaders.delete("content-security-policy");
        respHeaders.delete("content-security-policy-report-only");
        respHeaders.set("Access-Control-Allow-Origin", "*");
        respHeaders.set("Access-Control-Allow-Credentials", "true");

        // ========== 修复：正确处理所有 Set-Cookie ==========
        const setCookieHeaders = response.headers.getAll("set-cookie") || [];
        if (setCookieHeaders.length > 0) {
            respHeaders.delete("set-cookie");
            for (let cookie of setCookieHeaders) {
                // 移除 Domain 限制，调整 SameSite
                let cleaned = cookie.replace(/Domain=[^;]+;?/gi, "")
                                    .replace(/SameSite=Lax/gi, "SameSite=None; Secure");
                respHeaders.append("set-cookie", cleaned);
            }
        }

        const contentType = respHeaders.get("content-type") || "";

        // HTML 注入
        if (contentType.includes("text/html")) {
            let htmlText = await response.text();
            // 替换源站域名
            htmlText = htmlText.replace(new RegExp(targetUrlObj.origin, 'g'), reqUrl.origin);
            // 移除可能的内联验证脚本
            htmlText = htmlText.replace(/<script[^>]*captcha[^>]*><\/script>/gi, '');
            // 注入控制台
            htmlText = htmlText.replace('</head>', `<script>${INJECT_SCRIPT}</script></head>`);
            return new Response(htmlText, { status: response.status, headers: respHeaders });
        }

        // JSON 精准覆写（VIP/积分/配额）
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
                    // fallback
                }
            }
            return new Response(resText, { status: response.status, headers: respHeaders });
        }

        // 其他资源（包括图片）直接透传
        return new Response(response.body, { status: response.status, headers: respHeaders });
    }
};

/**
 * 安全修正用户数据，跳过升级/计费字段
 */
function patchUserDataSafely(obj, vip, credits, quota) {
    if (!obj || typeof obj !== 'object') return obj;

    if (obj.user && typeof obj.user === 'object') {
        obj.user.vip = obj.user.vip_level = vip;
        obj.user.is_vip = vip > 0;
        obj.user.credits = obj.user.points = credits;
        obj.user.quota = quota;
    }
    if (obj.hasOwnProperty('credits')) obj.credits = credits;
    if (obj.hasOwnProperty('points')) obj.points = credits;
    if (obj.hasOwnProperty('vip_level')) obj.vip_level = vip;
    if (obj.hasOwnProperty('is_vip')) obj.is_vip = vip > 0;
    if (obj.hasOwnProperty('quota')) obj.quota = quota;

    for (let key in obj) {
        if (key.includes('next_level') || key.includes('upgrade') || key.includes('price') || key.includes('cost')) continue;
        if (typeof obj[key] === 'object') patchUserDataSafely(obj[key], vip, credits, quota);
    }
    return obj;
}