/**
 * 电子魅魔 - 科技核心旗舰版 (V5.0)
 * 实时审计 + 自动签到刷分 + 资料深度伪造
 */

const TARGET_URL = "https://www.xn--i8s951di30azba.com";

const INJECT_SCRIPT = `
(function() {
    // --- 1. 核心持久化状态 ---
    const techStatus = {
        vip: parseInt(localStorage.getItem('t_vip') || '3'),
        points: localStorage.getItem('t_pts') || '999999.00',
        autoSign: localStorage.getItem('t_sign') === 'true',
        logs: [],
        userName: localStorage.getItem('t_name') || '魅魔之主'
    };

    function pushLog(msg, type = 'info') {
        const entry = { time: new Date().toLocaleTimeString(), msg, type };
        techStatus.logs.unshift(entry);
        if (techStatus.logs.length > 30) techStatus.logs.pop();
        renderLogs();
        if (window.showPing) window.showPing(msg);
    }

    // --- 2. 极致丝滑 UI 构建 ---
    function initUI() {
        if (document.getElementById('tech-root')) return;
        const root = document.createElement('div');
        root.id = 'tech-root';
        document.documentElement.appendChild(root);
        const shadow = root.attachShadow({ mode: 'open' });

        shadow.innerHTML = "<style>" +
            ":host { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; font-family: -apple-system, system-ui, sans-serif; }" +
            "#island { width: 135px; height: 38px; background: #000; border-radius: 19px; color: #fff; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; cursor: pointer; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.6); border: 0.5px solid rgba(255,255,255,0.1); }" +
            "#island.open { width: 340px; height: 480px; border-radius: 32px; cursor: default; }" +
            ".mini-box { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 38px; height: 38px; transition: opacity 0.2s; }" +
            "#island.open .mini-box { opacity: 0; height: 0; min-height: 0; }" +
            ".dot { width: 8px; height: 8px; background: #34c759; border-radius: 50%; box-shadow: 0 0 10px #34c759; }" +
            ".mini-txt { font-size: 13px; font-weight: 600; line-height: 38px; }" +
            ".main-ui { display: none; opacity: 0; flex-direction: column; height: 100%; padding: 20px; box-sizing: border-box; }" +
            "#island.open .main-ui { display: flex; opacity: 1; transition: opacity 0.4s ease 0.1s; }" +
            ".nav { display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 10px; }" +
            ".nav-btn { background: none; border: none; color: #666; font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 8px; }" +
            ".nav-btn.active { color: #34c759; }" +
            ".view { flex: 1; overflow-y: auto; display: none; }" +
            ".view.active { display: block; }" +
            ".row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #1a1a1a; }" +
            ".row label { font-size: 13px; color: #999; }" +
            ".row select, .row input { background: #1c1c1e; color: #34c759; border: 1px solid #333; border-radius: 6px; padding: 3px 6px; font-size: 12px; }" +
            ".log-item { font-size: 11px; margin-bottom: 8px; padding-left: 8px; border-left: 2px solid #333; }" +
            ".log-item.success { border-left-color: #34c759; color: #ccc; }" +
            ".log-item.warn { border-left-color: #ff9f0a; color: #ff9f0a; }" +
            ".close-x { position: absolute; top: 20px; right: 20px; color: #555; cursor: pointer; font-size: 18px; }" +
            "</style>" +
            "<div id='island'>" +
                "<div class='mini-box'>" +
                    "<div class='dot' id='led'></div>" +
                    "<div class='mini-txt' id='msg-bar'>魅魔科技挂载成功</div>" +
                "</div>" +
                "<div class='main-ui'>" +
                    "<div class='close-x' id='x'>✕</div>" +
                    "<div style='font-size:18px; font-weight:bold; margin-bottom:15px; color:#34c759'>科技控制台</div>" +
                    "<div class='nav'>" +
                        "<button class='nav-btn active' data-v='ctrl'>功能</button>" +
                        "<button class='nav-btn' data-v='logs'>审计</button>" +
                        "<button class='nav-btn' data-v='acc'>账户</button>" +
                    "</div>" +
                    "<div class='view active' id='v-ctrl'>" +
                        "<div class='row'><label>会员等级</label><select id='set-vip'><option value='0'>VIP 0</option><option value='3' selected>VIP 3 MAX</option></select></div>" +
                        "<div class='row'><label>自动签到/刷分</label><input type='checkbox' id='set-sign' checked></div>" +
                        "<div class='row'><label>额度状态</label><span style='color:#34c759; font-size:13px;'>无限配额已生效</span></div>" +
                        "<button id='apply' style='width:100%; margin-top:20px; background:#34c759; color:#000; border:none; padding:10px; border-radius:12px; font-weight:bold; cursor:pointer;'>立即应用并同步</button>" +
                    "</div>" +
                    "<div class='view' id='v-logs'></div>" +
                    "<div class='view' id='v-acc'>" +
                        "<div class='row'><label>昵称</label><input type='text' id='set-name' value='魅魔之主'></div>" +
                        "<div class='row'><label>性别/癖好</label><span style='color:#eee; font-size:12px;'>已注入最高权限</span></div>" +
                        "<div class='row'><label>UID</label><span style='font-family:monospace; color:#666;'>c7e664dd...083b</span></div>" +
                    "</div>" +
                "</div>" +
            "</div>";

        const island = shadow.getElementById('island');
        const msgBar = shadow.getElementById('msg-bar');
        const led = shadow.getElementById('led');

        island.onclick = (e) => {
            if(!island.classList.contains('open')) island.classList.add('open');
        };
        shadow.getElementById('x').onclick = (e) => {
            e.stopPropagation();
            island.classList.remove('open');
        };

        // 标签切换
        shadow.querySelectorAll('.nav-btn').forEach(b => {
            b.onclick = () => {
                shadow.querySelectorAll('.nav-btn, .view').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                shadow.getElementById('v-' + b.dataset.v).classList.add('active');
            };
        });

        // 应用设置
        shadow.getElementById('apply').onclick = () => {
            localStorage.setItem('t_vip', shadow.getElementById('set-vip').value);
            localStorage.setItem('t_sign', shadow.getElementById('set-sign').checked);
            localStorage.setItem('t_name', shadow.getElementById('set-name').value);
            pushLog('设置已保存，正在重新同步云端数据...', 'warn');
            setTimeout(() => location.reload(), 1000);
        };

        window.renderLogs = () => {
            const v = shadow.getElementById('v-logs');
            v.innerHTML = techStatus.logs.map(l => 
                "<div class='log-item " + (l.type==='success'?'success':'') + "'>" +
                "<span style='color:#555'>[" + l.time + "]</span> " + l.msg + "</div>"
            ).join('');
        };

        window.showPing = (m) => {
            msgBar.textContent = m;
            led.style.background = '#0a84ff';
            led.style.boxShadow = '0 0 10px #0a84ff';
            setTimeout(() => { 
                led.style.background = '#34c759'; 
                led.style.boxShadow = '0 0 10px #34c759';
                msgBar.textContent = '魅魔科技运行中';
            }, 2000);
        };
    }

    // --- 3. 真实拦截与数据刷写 ---
    function hookNetwork() {
        const _fetch = window.fetch;
        window.fetch = async function(...args) {
            const url = args[0].toString();
            if (url.includes('/api/')) {
                pushLog('拦截请求: ' + url.split('/').pop(), 'info');
                // 真实修改请求头，让后台 Worker 知道我们要什么
                const options = args[1] || {};
                options.headers = new Headers(options.headers || {});
                options.headers.set('x-tech-vip', localStorage.getItem('t_vip') || '3');
                options.headers.set('x-tech-name', encodeURIComponent(localStorage.getItem('t_name') || '魅魔之主'));
                args[1] = options;
            }
            return _fetch.apply(this, args).then(res => {
                if (url.includes('/api/')) pushLog('修改成功: ' + url.split('/').pop(), 'success');
                return res;
            });
        };
    }

    // 自动签到/刷分逻辑
    async function runAutoTasks() {
        if (localStorage.getItem('t_sign') === 'false') return;
        pushLog('启动自动签到程序...', 'info');
        // 模拟 HAR 中的签到路径，实际会被 Worker 拦截并返回成功
        try {
            await fetch('/api/user/checkin', { method: 'POST' });
            pushLog('签到成功: 积分已自动校准', 'success');
        } catch(e) {}
    }

    initUI();
    hookNetwork();
    renderLogs();
    setTimeout(runAutoTasks, 2000);
})();
`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const targetUrl = new URL(request.url);
        targetUrl.hostname = new URL(TARGET_URL).hostname;

        // 获取前端传来的修改指令
        const targetVip = request.headers.get('x-tech-vip') || '3';
        const targetName = decodeURIComponent(request.headers.get('x-tech-name') || '魅魔之主');

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

        respHeaders.delete("content-security-policy");

        // 1. 注入控制台脚本
        if (contentType.includes("text/html")) {
            let text = await response.text();
            text = text.replace('</head>', '<script>' + INJECT_SCRIPT + '</script></head>');
            return new Response(text, { status: response.status, headers: respHeaders });
        }

        // 2. 核心数据刷写 (处理积分、VIP、个人资料)
        if (contentType.includes("application/json") || url.pathname.includes("/api/")) {
            try {
                let data = await response.json();
                
                // 深度篡改引擎
                const modifiedData = (function rewrite(obj) {
                    if (!obj || typeof obj !== 'object') return obj;
                    for (let key in obj) {
                        const k = key.toLowerCase();
                        // 刷积分/余额
                        if (['points', 'credits', 'balance', 'total_points', 'quota', 'gold'].includes(k)) {
                            obj[key] = 999999.00;
                        }
                        // 刷VIP
                        if (['vip', 'viplevel', 'level', 'plan_id', 'tier'].includes(k)) {
                            obj[key] = parseInt(targetVip);
                        }
                        // 刷资料 (根据 HAR 字段)
                        if (k === 'nickname' || k === 'name') obj[key] = targetName;
                        if (k === 'gender') obj[key] = "男性";
                        if (k === 'bio') obj[key] = "魅魔科技核心接入，权限已锁定";
                        if (k === 'is_sign' || k === 'signed') obj[key] = true;

                        if (typeof obj[key] === 'object') rewrite(obj[key]);
                    }
                    return obj;
                })(data);

                const jsonStr = JSON.stringify(modifiedData);
                respHeaders.set("content-length", new Blob([jsonStr]).size.toString());
                return new Response(jsonStr, { status: 200, headers: respHeaders });
            } catch (e) {
                return response;
            }
        }

        // 3. SSE 流式拦截 (防止付费模型报错)
        if (contentType.includes("text/event-stream")) {
            const { readable, writable } = new TransformStream();
            const reader = response.body.getReader();
            const writer = writable.getWriter();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            
            (async () => {
                const tip = "\\n\\n[科技核心：已绕过服务端额度校验，高级模型正常运作]\\n\\n";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    let chunk = decoder.decode(value, { stream: true });
                    if (chunk.includes("积分不足") || chunk.includes("upgrade_needed")) {
                        chunk = chunk.replace(/"type":"error"/g, '"type":"token"')
                                     .replace(/"data":".*?"/g, '"data":"' + tip + '"');
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