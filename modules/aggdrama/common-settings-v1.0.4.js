// Worker 通用配置 v1.0.4
// v1.0.4 (2026-11-17): 移除「列表缓存秒数」参数——缓存时间改由各聚合模块按源自动管理（写死在模块里）；新保存的配置只含 Worker 地址；旧 v1.0.3 存的 listCacheSeconds/listCacheRevision 读到时忽略、不报错。状态卡改显示「缓存：由模块自动管理」。
// v1.0.3 (2026-11-17): 首次保存必须填写地址（不再被默认缓存秒数绕过）；格式错误会说明缺密钥段、带了接口路径、有空格或查询参数；保存时同时写共享缓存和本脚本本地备份，并分别读回校验；共享缓存丢失时从备份恢复并回写；CLEAR 写入 cleared:true，避免历史空地址挡住各模块自有地址。保存结果和状态卡分行显示共享/备份校验、缓存秒数、地址已配置或未配置、保存时间，不显示地址。
// v1.0.2 (2026-11-16): 移除中转地址字段——单 Worker 配置, 只发主地址; 旧已保存配置里的中转字段一律忽略。
// 接口依据：baranwang/rex-widget-libs 的 WidgetAdaptor.sharedCache。
// 跨脚本仍走 Widget.sharedCache；本脚本另用 Widget.storage 做备份。不发起网络请求，不输出地址或密钥。
WidgetMetadata = {
  id: "forward.aggdrama.common-settings",
  title: "Worker 通用配置",
  version: "1.0.4",
  requiredVersion: "0.0.1",
  description: "地址只在这里填一次，已接入的聚合模块自动沿用。填完需运行「保存通用配置」。需要宿主支持 Widget.sharedCache。",
  globalParams: [
    {name:"workerUrl",title:"Worker 地址（https://域名/密钥；CLEAR 清除）",type:"input",value:""}
  ],
  modules: [
    {id:"save",title:"保存通用配置",functionName:"save_common",cacheDuration:0,params:[]},
    {id:"status",title:"查看通用配置状态",functionName:"status_common",cacheDuration:0,params:[]}
  ]
};
const COMMON_NS = "forward.aggdrama.config.v1";
const COMMON_KEY = "settings";
const BACKUP_KEY = "agg_common_backup_v1";
function commonCard(title,description) {
  return {id:"worker-common:status",link:"worker-common:status",type:"url",title,description,remarks:description};
}
function sharedApi() {
  if (typeof Widget === "undefined" || !Widget.sharedCache ||
      typeof Widget.sharedCache.get !== "function" || typeof Widget.sharedCache.set !== "function") {
    throw Error("此版本未提供 Widget.sharedCache，无法跨 JS 共用；请使用支持该接口的客户端版本。");
  }
  return Widget.sharedCache;
}
function hasStorage() {
  return typeof Widget !== "undefined" && Widget.storage &&
    (typeof Widget.storage.get === "function" || typeof Widget.storage.getItem === "function") &&
    (typeof Widget.storage.set === "function" || typeof Widget.storage.setItem === "function");
}
async function storageGet(key) {
  if (typeof Widget === "undefined" || !Widget.storage) return null;
  try {
    if (typeof Widget.storage.get === "function") {
      const v = await Widget.storage.get(key);
      if (v !== null && v !== undefined && v !== "") return v;
    }
  } catch (_) {}
  try {
    if (typeof Widget.storage.getItem === "function") {
      const v = await Widget.storage.getItem(key);
      if (v !== null && v !== undefined && v !== "") return v;
    }
  } catch (_) {}
  return null;
}
async function storageSet(key, value) {
  const s = String(value);
  let wrote = false;
  if (typeof Widget === "undefined" || !Widget.storage) throw Error("此版本未提供 Widget.storage，无法写入本地备份。");
  try { if (typeof Widget.storage.set === "function") { await Widget.storage.set(key, s); wrote = true; } } catch (_) {}
  try { if (typeof Widget.storage.setItem === "function") { await Widget.storage.setItem(key, s); wrote = true; } } catch (_) {}
  if (!wrote) throw Error("本地备份写入失败。");
}
function parseConfig(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const c = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!c || c.schemaVersion !== 1 || typeof c.workerUrl !== "string") {
    throw Error("共享配置格式异常，请重新保存通用配置。");
  }
  return c;
}
function sameConfig(a, b) {
  if (!a || !b) return false;
  return a.schemaVersion === 1 && b.schemaVersion === 1 &&
    a.workerUrl === b.workerUrl &&
    !!a.cleared === !!b.cleared &&
    Number(a.savedAt || 0) === Number(b.savedAt || 0);
}
async function tryReadShared() {
  try {
    const raw = await sharedApi().get(COMMON_NS, COMMON_KEY);
    if (raw === null || raw === undefined || raw === "") return {status:"empty", cfg:null};
    try {
      return {status:"ok", cfg:parseConfig(raw)};
    } catch (e) {
      return {status:"badformat", cfg:null, error:e};
    }
  } catch (e) {
    const msg = String((e && e.message) || e || "");
    if (msg.indexOf("未提供 Widget.sharedCache") >= 0) return {status:"noapi", cfg:null, error:e};
    return {status:"error", cfg:null, error:e};
  }
}
async function tryReadBackup() {
  if (!hasStorage()) return {status:"nostorage", cfg:null};
  try {
    const raw = await storageGet(BACKUP_KEY);
    if (raw === null || raw === undefined || raw === "") return {status:"empty", cfg:null};
    try {
      return {status:"ok", cfg:parseConfig(raw)};
    } catch (e) {
      return {status:"badformat", cfg:null, error:e};
    }
  } catch (e) {
    return {status:"error", cfg:null, error:e};
  }
}
async function writeShared(config) {
  const api = sharedApi();
  await api.set(COMMON_NS, COMMON_KEY, JSON.stringify(config));
  const check = await tryReadShared();
  if (check.status !== "ok" || !sameConfig(check.cfg, config)) {
    throw Error("共享缓存写入后校验失败。");
  }
}
async function writeBackup(config) {
  await storageSet(BACKUP_KEY, JSON.stringify(config));
  const check = await tryReadBackup();
  if (check.status !== "ok" || !sameConfig(check.cfg, config)) {
    throw Error("本地备份写入后校验失败。");
  }
}
async function restoreSharedFromBackup(cfg) {
  await writeShared(cfg);
}
function address(value, previous) {
  const raw = typeof value === "string" ? value : "";
  const trimmed = raw.trim();
  const v = trimmed.replace(/\/+$/, "");
  if (!v) return previous || "";
  if (v === "CLEAR") return "";
  if (/\s/.test(trimmed)) {
    throw Error("地址里有空格，请去掉后再保存。");
  }
  if (/[?#]/.test(trimmed)) {
    throw Error("地址不要带查询参数（问号或井号），请只填根地址。");
  }
  if (!/^https:\/\//i.test(v)) {
    throw Error("请使用 https:// 开头的完整地址。");
  }
  if (/\/(?:play|cover|poster|web\/put|v1\/rankings)$/.test(v)) {
    throw Error("请填 Worker 根地址（含密钥段），不要附加 /play、/cover 等接口路径。");
  }
  if (/^https:\/\/[^/\s?#]+$/.test(v)) {
    throw Error("地址缺少密钥段，请填成 https://域名/密钥 这种形式。");
  }
  if (!/^https:\/\/[^/\s?#]+\/[^\s?#]+$/.test(v)) {
    throw Error("请填写完整 HTTPS Worker 根地址并包含密钥段。");
  }
  return v;
}
function formatTime(ts) {
  const d = new Date(ts);
  if (!ts || Number.isNaN(d.getTime())) return "未知";
  const p = function (n) { return n < 10 ? "0" + n : String(n); };
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " +
    p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}
function configTime(c) {
  if (c && typeof c.savedAt === "number" && c.savedAt > 0) return formatTime(c.savedAt);
  const n = c ? Number(c.listCacheRevision) : NaN;
  if (Number.isFinite(n) && n > 1000000000000) return formatTime(n);
  return "未知";
}
function safeError(e) {
  return String(e && e.message || e).replace(/https?:\/\/\S+/gi,"<地址已隐藏>");
}
function describeLines(rows) {
  return rows.join("\n");
}
function statusLineShared(result, restored) {
  if (restored === "ok") return "共享缓存读取并校验：未找到，已从本地备份恢复并回写成功";
  if (restored === "fail") return "共享缓存读取并校验：未找到，从本地备份回写失败" + (result && result.error ? "（" + safeError(result.error) + "）" : "");
  if (!result) return "共享缓存读取并校验：失败";
  if (result.status === "ok") return "共享缓存读取并校验：成功";
  if (result.status === "empty") return "共享缓存读取并校验：未保存";
  if (result.status === "badformat") return "共享缓存读取并校验：失败（格式异常）";
  if (result.status === "noapi") return "共享缓存读取并校验：失败（此版本无共享接口）";
  return "共享缓存读取并校验：失败" + (result.error ? "（" + safeError(result.error) + "）" : "");
}
function statusLineBackup(result, patched) {
  if (patched === "ok") return "本地备份读取并校验：未找到，已从共享缓存补写并校验成功";
  if (patched === "fail") return "本地备份读取并校验：未找到，从共享缓存补写失败";
  if (!result) return "本地备份读取并校验：失败";
  if (result.status === "ok") return "本地备份读取并校验：成功";
  if (result.status === "empty") return "本地备份读取并校验：无备份";
  if (result.status === "nostorage") return "本地备份读取并校验：失败（此版本无本地存储）";
  if (result.status === "badformat") return "本地备份读取并校验：失败（格式异常）";
  return "本地备份读取并校验：失败" + (result.error ? "（" + safeError(result.error) + "）" : "");
}
function describeConfigFields(c, source) {
  const lines = [];
  lines.push("缓存：由模块自动管理");
  lines.push("Worker 地址：" + (c && c.workerUrl && !c.cleared ? "已配置" : "未配置"));
  if (source) lines.push("来源：" + source);
  lines.push("保存时间：" + configTime(c));
  return lines;
}
async function loadPrevious() {
  const shared = await tryReadShared();
  if (shared.status === "ok") return {previous:shared.cfg, shared, backup:await tryReadBackup(), restored:null};
  const backup = await tryReadBackup();
  if (backup.status === "ok") {
    try {
      await restoreSharedFromBackup(backup.cfg);
      return {previous:backup.cfg, shared, backup, restored:"ok"};
    } catch (e) {
      return {previous:backup.cfg, shared, backup, restored:"fail", restoreError:e};
    }
  }
  return {previous:null, shared, backup, restored:null};
}
async function save_common(params) {
  try {
    sharedApi();
    const loaded = await loadPrevious();
    const previous = loaded.previous;
    const p = params || {};
    const rawUrl = String(p.workerUrl || "").trim();
    if (rawUrl === "CLEAR") {
      if (!previous) {
        return [commonCard("没有可清除的配置","当前没有已保存的通用配置，请先填写 Worker 地址再保存。")];
      }
    } else {
      const nextUrl = address(p.workerUrl, previous && previous.workerUrl);
      if (!nextUrl) {
        return [commonCard("尚未填写地址","第一次保存必须填写 Worker 地址（https://域名/密钥）。")];
      }
    }
    const now = Date.now();
    const workerUrl = address(p.workerUrl, previous && previous.workerUrl);
    const config = {
      schemaVersion:1,
      workerUrl:workerUrl,
      savedAt:now
    };
    if (!workerUrl) config.cleared = true;
    let sharedWrite = "失败", backupWrite = "失败";
    let sharedErr = "", backupErr = "";
    try {
      await writeShared(config);
      sharedWrite = "成功";
    } catch (e) { sharedErr = safeError(e); }
    try {
      await writeBackup(config);
      backupWrite = "成功";
    } catch (e) { backupErr = safeError(e); }
    const lines = [
      "共享缓存写入并读回校验：" + (sharedWrite === "成功" ? "成功" : ("失败" + (sharedErr ? "（" + sharedErr + "）" : ""))),
      "本地备份写入并读回校验：" + (backupWrite === "成功" ? "成功" : ("失败" + (backupErr ? "（" + backupErr + "）" : "")))
    ].concat(describeConfigFields(config, null));
    if (sharedWrite === "成功" && backupWrite === "成功") {
      return [commonCard("通用配置已保存", describeLines(lines))];
    }
    if (sharedWrite === "成功" || backupWrite === "成功") {
      return [commonCard("通用配置部分保存", describeLines(lines))];
    }
    return [commonCard("保存失败", describeLines(lines))];
  } catch (e) {return [commonCard("保存失败",safeError(e))];}
}
async function status_common() {
  try {
    const shared = await tryReadShared();
    const backup = await tryReadBackup();
    let cfg = null, source = "", restored = null, patched = null;
    if (shared.status === "ok") {
      cfg = shared.cfg;
      source = "共享缓存";
      if (backup.status !== "ok" || (backup.cfg && !sameConfig(backup.cfg, shared.cfg))) {
        try {
          await writeBackup(shared.cfg);
          patched = "ok";
        } catch (_) { patched = "fail"; }
      }
    } else if (backup.status === "ok") {
      cfg = backup.cfg;
      source = "备份恢复";
      try {
        await restoreSharedFromBackup(backup.cfg);
        restored = "ok";
      } catch (_) { restored = "fail"; }
    }
    const backupAfter = patched || restored ? await tryReadBackup() : backup;
    const lines = [
      statusLineShared(shared, restored),
      statusLineBackup(backupAfter, patched)
    ];
    if (cfg) {
      lines.push.apply(lines, describeConfigFields(cfg, source));
      const title = cfg.workerUrl && !cfg.cleared ? "通用配置状态：已配置" : "通用配置状态：未配置";
      return [commonCard(title, describeLines(lines))];
    }
    lines.push("缓存：由模块自动管理");
    lines.push("Worker 地址：未配置");
    lines.push("来源：无");
    lines.push("保存时间：—");
    return [commonCard("尚未保存通用配置", describeLines(lines))];
  } catch (e) {return [commonCard("无法读取通用配置",safeError(e))];}
}
async function loadDetail() {
  const rows=await status_common();
  return Object.assign({},rows[0],{episodeItems:[]});
}
async function loadResource() { return []; }
async function search() { return status_common(); }
