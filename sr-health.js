/*
 * sr-health v2.0 — Shadowrocket 内置链路自检（type=cron，每 10 分钟）
 * v1.3 的两条测试地址是历史遗留、早已失效，导致长期假警：
 *   ① 「TMDB图片代理」测 https://imabcd.dpdns.org/__ping —— 该域名早已没有 Worker 路由，
 *      必然失败，而真实图片代理（shrill-poetry-07fc.svipqq888.workers.dev）一直健康；
 *   ② 「Rex模块源」测 jsdelivr 的 all-modules6.rex —— 那是历史轮次，不是生产固定入口
 *      （cdn.imabcd.dpdns.org/m/all-modules.rex），测到的是错误的东西。
 * v2.0 全部换成生产真实端点，并补齐两条此前没测的关键链路（官方模块源 / TMDB 数据中继）：
 *   - 官方模块源 assets.rexnow.tv：Rex 官方模块 JS 的真实来源
 *   - TMDB 数据中继 cdn.imabcd.dpdns.org/relay/tmdb/：Rex 数据 API 的真实来源
 * 通知策略（v1.1 降噪）：
 *   1) 同一异常需连续 2 轮（约 20 分钟）确认才通知——过滤瞬时抖动；
 *   2) 全部链路失败（网络级瘫痪）跳过确认立即通知；
 *   3) 同一签名 2 小时内不重复通知；每日最多 4 条；
 *   4) 恢复后补报一条「已恢复」。
 */
/* v2.2（2026-11-14）：全部检测端点改走 workers.dev 生产域名（2407813427 账号），
   避开 dpdns 边缘缓存和旧账号 svipqq888 域名的不稳定：
   - TMDB图片代理 svipqq888→2407813427（旧域名已废弃，偶发超时导致假警）
   - Rex模块源 / TMDB数据中继 cdn.imabcd.dpdns.org → rex-mod-cdn.2407813427.workers.dev
   workers.dev 被 IMG/MOD 组 fallback,DIRECT,PROXY 覆盖，直连优先、代理兜底。 */
const TESTS = [
  { name: '代理链路', url: 'https://www.gstatic.com/generate_204' },
  { name: 'Rex模块源', url: 'https://rex-mod-cdn.2407813427.workers.dev/m/all-modules.rex' },
  { name: '官方模块源', url: 'https://assets.rexnow.tv/scripts/rex-tmdb.js' },
  { name: 'TMDB图片代理', url: 'https://shrill-poetry-07fc.2407813427.workers.dev/health' },
  { name: 'TMDB数据中继', url: 'https://rex-mod-cdn.2407813427.workers.dev/relay/tmdb/3/configuration' },
  { name: 'PikPak WebDAV', url: 'https://dav.pikpak.ai/' },
  { name: 'TestFlight', url: 'https://testflight.apple.com' },
  { name: 'PikPak API', url: 'https://www.mypikpak.com/' }
];
/* v2.1（2026-11-08）：增加设备侧自动上报——每次体检结果直发 sink（ntfy.sh），
   Minis 侧定时拉取后自动汇报，用户不必在 TV/手机上手动截图或抄报错。
   保留原有 iOS 通知策略作为兜底。 */
var SINK = 'https://ntfy.sh/rexlog73ce7856b8137f6e3601c94e2d5384de';

function deviceId() {
  var id = $persistentStore.read('srlog_devid');
  if (!id) {
    id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    $persistentStore.write('srlog_devid', id);
  }
  return id;
}

function reportSink(obj, cb) {
  var body = JSON.stringify(obj);
  $httpClient.post({
    url: SINK,
    headers: { 'Title': 'SR-chain', 'Content-Type': 'text/plain; charset=utf-8', 'X-Expires': '7200' },
    body: body,
    timeout: 4
  }, function () { if (cb) cb(); });
}

const K_LAST_SIG = 'sr_h_last_sig';      // 上次已通知签名
const K_LAST_TS = 'sr_h_last_ts';        // 上次已通知时间
const K_STREAK_SIG = 'sr_h_streak_sig';  // 连续失败签名
const K_STREAK_N = 'sr_h_streak_n';      // 连续失败轮数
const K_PREV_FAIL = 'sr_h_prev_fail';    // 上一轮是否有未恢复异常
const K_DAY = 'sr_h_day';                // 当日日期
const K_DAY_N = 'sr_h_day_n';            // 当日已通知数

function runAll(done) {
  var results = [], pending = TESTS.length;
  TESTS.forEach(function (t) {
    var t0 = Date.now();
    $httpClient.get({ url: t.url, timeout: 8 }, function (err, resp) {
      var ms = Date.now() - t0;
      var status = 'ok';
      if (err || !resp || !resp.status) status = 'fail';
      else if (ms > 5000) status = 'slow';
      results.push({ name: t.name, status: status, ms: ms });
      if (--pending === 0) done(results);
    });
  });
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function main() {
  runAll(function (rs) {
    var ts = Date.now();
    var fails = rs.filter(function (r) { return r.status !== 'ok'; });
    /* 先把体检结果上报 sink（成功后再走通知逻辑），保证 $done 只在最后触发一次 */
    reportSink({
      t: ts,
      k: 'chain',
      d: deviceId(),
      f: fails.map(function (f) { return f.name; }).join(','),
      r: rs.map(function (r) { return r.name + ':' + r.status + ':' + r.ms; }).join(' ')
    }, function () {

    /* 恢复分支 */
    if (fails.length === 0) {
      var prev = $persistentStore.read(K_PREV_FAIL);
      if (prev) {
        $notification.post('SR 网络自检', '✅ 已恢复', '此前异常：' + prev + '，当前全部链路正常');
        $persistentStore.write(K_PREV_FAIL, '');
      }
      $persistentStore.write(K_STREAK_N, '0');
      $done();
      return;
    }

    /* 连续失败计数（同签名累计，跨签名重置） */
    var sig = fails.map(function (f) { return f.name; }).join(',');
    var streakSig = $persistentStore.read(K_STREAK_SIG) || '';
    var n = parseInt($persistentStore.read(K_STREAK_N) || '0', 10);
    n = (sig === streakSig) ? n + 1 : 1;
    $persistentStore.write(K_STREAK_SIG, sig);
    $persistentStore.write(K_STREAK_N, String(n));

    /* 通知判定：全部失败跳过确认；部分失败需连续 2 轮 */
    var allDown = fails.length === TESTS.length;
    if (!allDown && n < 2) { $done(); return; }

    /* 去重 2 小时 + 每日 4 条 */
    if (sig === $persistentStore.read(K_LAST_SIG) &&
        ts - parseInt($persistentStore.read(K_LAST_TS) || '0', 10) < 2 * 60 * 60 * 1000) { $done(); return; }
    var today = todayStr();
    var cnt = ($persistentStore.read(K_DAY) === today) ? parseInt($persistentStore.read(K_DAY_N) || '0', 10) : 0;
    if (cnt >= 4) { $done(); return; }

    /* 发通知 */
    var detail = fails.map(function (f) {
      return f.name + (f.status === 'fail' ? '（连接失败）' : '（延迟 ' + f.ms + 'ms）');
    }).join('、');
    $notification.post('SR 网络自检', '⚠️ ' + fails.length + ' 条链路异常',
      detail + '。策略组将自动切换（≤2min）；持续异常请打开 Minis 分析。');
    $persistentStore.write(K_LAST_SIG, sig);
    $persistentStore.write(K_LAST_TS, String(ts));
    $persistentStore.write(K_PREV_FAIL, sig);
    $persistentStore.write(K_DAY, today);
    $persistentStore.write(K_DAY_N, String(cnt + 1));
    $done();
    });
  });
}

main();