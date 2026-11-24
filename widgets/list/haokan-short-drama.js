(() => {
  const SITE = 'https://sv.baidu.com';
  const cache = new Map(), searchStates = new Map(), searchLocks = new Map(), listEnds = new Map();
  const tags = [
    ['1','热播剧'],['2','新剧'],['5','漫剧'],['3','男频'],['4','女频'],
    ['2013','都市'],['2009','玄幻'],['2014','年代'],['2015','科幻'],['2016','军旅战争'],['2010','历史架空'],['2017','武侠武打'],['2012','家庭伦理'],['2011','古代言情'],['2008','现代言情'],['2018','青春校园'],
    ['1004','逆袭'],['2019','鉴宝'],['2005','异能'],['1007','甜宠'],['1006','虐恋'],['2007','闪婚'],['2020','种田'],['2004','穿越重生'],['2006','宫斗宅斗'],
    ['1001','战神'],['1008','总裁'],['2001','神豪'],['1002','神医'],['2003','萌宝'],['1003','赘婿'],['2002','王妃']
  ];
  const ranks = [['hot','热播榜'],['new','新剧榜'],['like','点赞榜'],['mustsee','必看榜']];
  const clean = x => String(x ?? '').replace(/<[^>]*>/g, '').trim();
  const query = x => Object.entries(x).map(([k,v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  function id(x) {return typeof x === 'string' && /^\d{1,24}$/.test(x) ? x : '';}
  function positive(x, label, maximum = 5000) {
    const n = Number(x); if (!Number.isSafeInteger(n) || n < 1 || n > maximum) throw Error('好看短剧' + label + '无效'); return n;
  }
  function linkFor(collection, vid) {return 'haokan://drama/' + collection + '/' + (vid || '0');}
  function parse(link) {
    const m = typeof link === 'string' && /^haokan:\/\/drama\/(\d{1,24})\/(\d{1,24})$/.exec(link);
    if (!m || m[1] === '0') throw Error('好看短剧链接无效'); return {collection: m[1], vid: m[2]};
  }
  function decode(value) {
    if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw Error('好看短剧响应编码无效');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let bits = 0, buffer = 0, text = '';
    for (const c of value.replace(/=+$/, '')) {buffer = buffer << 6 | alphabet.indexOf(c); bits += 6; if (bits >= 8) {bits -= 8; text += '%' + (buffer >>> bits & 255).toString(16).padStart(2,'0');}}
    return decodeURIComponent(text);
  }
  async function request(path, body, {batch, missing = false} = {}) {
    const response = await Widget.http.request({url: SITE + path, method: 'POST', data: query(body), base64Data: true, timeout: 25,
      headers: {'Content-Type':'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent':'Mozilla/5.0', Referer: SITE + '/'}});
    const status = Number(response?.statusCode ?? response?.status ?? 200);
    if (status < 200 || status >= 300) throw Error('好看短剧接口 HTTP ' + status);
    let data; try {data = JSON.parse(decode(response.data));} catch {throw Error('好看短剧接口响应无效');}
    if (batch) data = data?.[batch];
    if (missing && String(data?.status) === '3') return null;
    if (String(data?.status) !== '0' || !data.data || typeof data.data !== 'object') throw Error('好看短剧官方接口请求失败');
    return data.data;
  }
  function remember(collection, value) {cache.set(collection, {time: Date.now(), value}); if (cache.size > 60) cache.delete(cache.keys().next().value);}
  function coverFields(image) {return {coverUrl: image, posterPath: image, backdropPath: image};}
  function cards(rows) {
    if (!Array.isArray(rows)) throw Error('好看短剧列表无效');
    const seen = new Set(); return rows.flatMap(row => {
      const collection = id(row?.playlet_id), title = clean(row?.playlet_title || row?.title);
      if (!collection || !title || seen.has(collection) || ['3','6'].includes(String(row.playlet_type))) return [];
      seen.add(collection);
      return [{id: 'haokan:' + collection, type:'url', mediaType:'tv', title, description: clean(row.description || row.episodes_num_text),
        ...coverFields(clean(row.playlet_poster || row.poster)), link: linkFor(collection, id(row.progress_vid)), playerType:'app'}];
    });
  }
  async function loadList(params = {}) {
    const page = positive(params.page ?? 1, '页码', 100), tag = String(params.tag ?? '1');
    if (!tags.some(x => x[0] === tag)) throw Error('好看短剧分类无效');
    const ended = listEnds.get(tag);
    if (page === 1 || ended && Date.now() - ended.time >= 120000) listEnds.delete(tag);
    else if (ended && page > ended.page) return [];
    const data = await request('/haokan/ui-feed/playletTagsFeed', {tag_id: tag, pn: page, rn: 18});
    const rows = data.list === null ? [] : data.list, result = cards(rows);
    if (!rows.length || data.has_more === false || String(data.has_more) === '0') listEnds.set(tag, {page, time: Date.now()});
    return result;
  }
  async function loadRank(params = {}) {
    const page = positive(params.page ?? 1, '页码', 100), tab = String(params.rank ?? 'hot');
    if (!ranks.some(x => x[0] === tab)) throw Error('好看短剧榜单无效');
    return cards((await request('/haokan/ui-interact/playlet/hotlist', {pn:page, rn:25, tab_name:tab, source:'playlet'})).list);
  }
  async function directory(reference, strict = true) {
    let vid = reference.vid;
    if (vid === '0') {
      // Legacy directory is only used to resolve one seed; it repeats its first ten rows on pn changes.
      const data = await request('/appui/api?cuid=00000000000000000000000000000000%7C0', {'video/commonlist':query({type:'playlet',from:'playlet_talos',id:reference.collection,rn:10,pn:1,direction:3})}, {batch:'video/commonlist'});
      vid = id(data.results?.[0]?.content?.vid); if (!vid) throw Error('好看短剧未返回首集');
    }
    const data = await request('/haokan/ui-video/playlet/rec/detail', {playlet_id:reference.collection,vid}, {missing:!strict});
    const count = Number(data?.episodes_num), videos = data?.vid_list;
    const eligible = data && id(data.playlet_id) === reference.collection && String(data.playlet_type) === '2' && clean(data.playlet_title)
      && Number.isSafeInteger(count) && count > 0 && count <= 5000 && Array.isArray(videos) && videos.length === count
      && videos.every(v => id(v)) && new Set(videos).size === count && videos.includes(vid);
    if (!eligible) {if (!strict) return null; throw Error('好看短剧目录不完整、身份不匹配或为付费/受限版本');}
    remember(reference.collection, data); return data;
  }
  async function searchPage(keyword, page) {
    let state = searchStates.get(keyword);
    if (!state || page === 1 || Date.now() - state.time > 120000) state = {time:Date.now(), inner:0, pn:1, pages:[], seen:[], done:false};
    while (state.pages.length < page && !state.done) {
      const result = [], seen = new Set(state.seen);
      // Skip pages containing only clips while keeping official pagination bounded.
      for (let attempt = 0; attempt < 3 && !result.length && !state.done; attempt++) {
        const data = await request('/haokan/ui-search/v2/search?cmd=search', {search:query({method:'get',tag:'rc',rn:10,pn:state.pn,title:keyword,force:0,needBjh:1,long_video:1,wordseg:1,outpn:0,innerpn:state.inner})});
        if (!Array.isArray(data.list)) throw Error('好看短剧搜索列表无效');
        for (let offset = 0; offset < data.list.length; offset += 3) {
          const resolved = await Promise.all(data.list.slice(offset, offset + 3).map(async row => {
            const vid = id(row?.vid); if (!vid) return null;
            const related = await request('/appui/api', {'video/relate':query({method:'post',vid,tag:'playlet_talos'})}, {batch:'video/relate'});
            const current = related.cur_video, collection = id(current?.video_collection_id);
            if (!collection || id(current.vid) !== vid || seen.has(collection)) return null;
            return directory({collection,vid}, false);
          }));
          for (const item of resolved) if (item && !seen.has(item.playlet_id)) {seen.add(item.playlet_id); result.push(...cards([{...item,progress_vid:item.vid_list[0]}]));}
        }
        if (![0,1,'0','1',false,true].includes(data.has_more)) throw Error('好看短剧搜索分页状态无效');
        state.done = data.has_more === false || String(data.has_more) === '0';
        if (!state.done && (!Number.isSafeInteger(Number(data.innerpn)) || Number(data.innerpn) <= state.inner)) throw Error('好看短剧搜索分页未前进');
        state.inner = Number(data.innerpn); state.pn++;
      }
      if (!result.length && !state.done) throw Error('好看短剧搜索仍有结果待核对，请缩小关键词后重试');
      state.pages.push(result); state.seen = [...seen];
    }
    searchStates.set(keyword,state); if (searchStates.size > 10) searchStates.delete(searchStates.keys().next().value);
    return state.pages[page-1] || [];
  }
  async function search(params = {}) {
    const keyword = clean(params.keyword ?? params.query), page = positive(params.page ?? 1,'页码',30); if (!keyword) return [];
    const task = (searchLocks.get(keyword) || Promise.resolve()).catch(() => {}).then(() => searchPage(keyword,page)); searchLocks.set(keyword,task);
    try {return await task;} finally {if (searchLocks.get(keyword) === task) searchLocks.delete(keyword);}
  }
  async function loadDetail(link) {
    const reference = parse(link), stored = cache.get(reference.collection);
    const data = stored && Date.now()-stored.time < 120000 && (reference.vid === '0' || stored.value.vid_list.includes(reference.vid)) ? stored.value : await directory(reference);
    const image = clean(data.playlet_poster), title = clean(data.playlet_title);
    return {id:'haokan:'+reference.collection, type:'url', mediaType:'tv', title, description:clean(data.description), ...coverFields(image), link, playerType:'app',
      episodeItems:data.vid_list.map((videoId,index) => ({id:'haokan:'+reference.collection+':'+videoId,type:'url',mediaType:'tv',title,description:'第'+(index+1)+'集',
        episode:index+1,episodeNumber:index+1,season:1,seasonNumber:1,videoId,collectionId:reference.collection,link,...coverFields(image),playerType:'app'}))};
  }
  async function loadResource(params = {}) {
    const reference = parse(params.link), episode = positive(params.episode ?? params.episodeNumber ?? 1,'集数'), season = positive(params.season ?? params.seasonNumber ?? 1,'季度');
    if (season !== 1) throw Error('好看短剧未返回该季度');
    const data = await directory(reference), vid = data.vid_list[episode-1]; if (!vid) throw Error('好看短剧该集不存在');
    const [info, badges, related] = await Promise.all([
      request('/haokan/ui-video/getPlayletInfo',{vid}),
      request('/haokan/ui-video/playlet/rec/video/pageInfo',{playlet_id:reference.collection,vid_list:vid}),
      request('/appui/api',{'video/relate':query({method:'post',vid,tag:'playlet_talos',video_set_id:reference.collection})},{batch:'video/relate'})
    ]);
    const current = related.cur_video, badge = badges.list?.find(row => row.vid === vid);
    if (info.is_free !== true || !badge || String(badge.playlet_type) !== '2' || current?.playlet_unlock !== true || ['3','6'].includes(String(current.playlet_type))) throw Error('好看短剧付费或受限剧集暂不提供');
    if (id(current.vid) !== vid || id(current.video_collection_id) !== reference.collection || Number(current.location_index) !== episode-1 || Number(current.video_collection_item_count_int) !== data.episodes_num) throw Error('好看短剧播放分集不匹配');
    const qualities = Array.isArray(current.clarityUrl) ? [...current.clarityUrl] : [], seen = new Set();
    const resources = qualities.sort((a,b) => Number(b.rank ?? 0)-Number(a.rank ?? 0)).flatMap(row => {
      if (!/^https?:\/\/vd\d+\.bdstatic\.com\/[^\s]+$/i.test(row?.url || '')) return [];
      const url = row.url.replace(/^http:/i,'https:'); if (seen.has(url)) return []; seen.add(url);
      return [{name:'好看短剧 '+clean(row.title || row.key || '高清'),url,format:'mp4',playerType:'app',episode,season,headers:{'User-Agent':'Mozilla/5.0',Referer:SITE+'/'}}];
    });
    if (!resources.length) throw Error('好看短剧未返回官方免费播放地址'); return resources;
  }
  const searchParams = [{name:'keyword',title:'关键词',type:'input'},{name:'page',title:'页码',type:'page'}];
  const WidgetMetadata = {id:'forward.haokan.short-drama',title:'好看免费短剧',version:'1.0.1',requiredVersion:'0.0.1',author:'balge',site:SITE,
    description:'好看短剧的分类、搜索和播放。',detailCacheDuration:120,
    modules:[
      {id:'discover',title:'短剧广场',functionName:'loadList',cacheDuration:120,params:[{name:'page',title:'页码',type:'page'},{name:'tag',title:'分类',type:'enumeration',value:'1',enumOptions:tags.map(([value,title])=>({title,value}))}]},
      {id:'rank',title:'榜单',functionName:'loadRank',cacheDuration:120,params:[{name:'page',title:'页码',type:'page'},{name:'rank',title:'榜单',type:'enumeration',value:'hot',enumOptions:ranks.map(([value,title])=>({title,value}))}]},
      {id:'search',title:'搜索',functionName:'search',cacheDuration:60,params:searchParams},
      {id:'loadResource',title:'播放资源',functionName:'loadResource',type:'stream',cacheDuration:0,params:[]}
    ],search:{title:'搜索',functionName:'search',params:searchParams}};
  Object.assign(globalThis,{WidgetMetadata,loadList,loadRank,search,loadDetail,loadResource});
})();
