/*
 * sr-log-report v1.0 — Shadowrocket 设备侧链路日志自动上报（type=http-response）
 * 目的：把「请求从设备发出后到底成没成」自动送到 Minis 可读的位置，
 *       用户不用在 TV/手机上手动截图、翻日志、复制报错。
 * 工作方式：
 *   ① 失败（HTTP >= 400 或连接层异常）→ 立刻上报；
 *   ② 成功 → 同一域名每 60 秒最多上报一次样本（既留证据，又不给图片加载添延迟）；
 *   ③ 上报内容只含 host + 去掉 query 的 path + 状态码 + 设备标识，不含任何密钥。
 * 配套：sr-health.js（cron）会上报 8 条链路体检结果，两者互补——
 *       本脚本回答「单个请求发生了什么」，cron 回答「整体链路通不通」。
 */
var SINK = 'https://ntfy.sh/rexlog73ce7856b8137f6e3601c94e2d5384de';
var THROTTLE_MS = 60000;
var POST_TIMEOUT = 2;

function deviceId() {
  var id = $persistentStore.read('srlog_devid');
  if (!id) {
    id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    $persistentStore.write('srlog_devid', id);
  }
  return id;
}

function hostOf(u) {
  try { return new URL(u).host; } catch (e) { return String(u || '').split('/')[2] || '?'; }
}
function pathOf(u) {
  try { return new URL(u).pathname.slice(0, 120); } catch (e) { return String(u || '').split('?')[0].slice(0, 120); }
}

function report(obj) {
  var body = JSON.stringify(obj);
  $httpClient.post({
    url: SINK,
    headers: {
      'Title': 'SR',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Expires': '7200'
    },
    body: body,
    timeout: POST_TIMEOUT
  }, function (err, resp) { /* 结果不关心，失败也不阻塞业务请求 */ });
}

(function () {
  var status = 0;
  try {
    if (typeof $response !== 'undefined' && $response && $response.status) status = $response.status;
    var url = (typeof $request !== 'undefined' && $request && $request.url) ? $request.url : '';
    var host = hostOf(url);
    var now = Date.now();
    var last = parseInt($persistentStore.read('srlog_last_' + host) || '0', 10);
    var failed = (status === 0 || status >= 400);
    if (failed || (now - last) > THROTTLE_MS) {
      $persistentStore.write('srlog_last_' + host, String(now));
      report({
        t: now,
        k: failed ? 'fail' : 'ok',
        d: deviceId(),
        h: host,
        p: pathOf(url),
        s: status
      });
    }
  } catch (e) {
    /* 任何异常都不允许影响业务请求 */
  }
  $done();
})();
