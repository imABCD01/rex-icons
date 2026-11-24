/*! 河马剧场独立模块；请勿记录游客令牌。 */
(() => {
  // Rex JavaScriptCore has no browser encoding or query APIs.
  var g = globalThis;
  if (!g.TextEncoder) g.TextEncoder = class {
    encode(value = "") {
      return Uint8Array.from(unescape(encodeURIComponent(String(value))), (c) => c.charCodeAt(0));
    }
  };
  if (!g.TextDecoder) g.TextDecoder = class {
    decode(bytes2 = new Uint8Array()) {
      return decodeURIComponent(Array.from(bytes2, (b) => "%" + b.toString(16).padStart(2, "0")).join(""));
    }
  };
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  if (!g.btoa) g.btoa = (value) => {
    let result = "";
    for (let i = 0; i < value.length; i += 3) {
      const a = value.charCodeAt(i), b = value.charCodeAt(i + 1), c = value.charCodeAt(i + 2);
      if (a > 255 || b > 255 || c > 255) throw new Error("Invalid base64 input");
      const n = a << 16 | (b || 0) << 8 | (c || 0);
      result += alphabet[n >>> 18] + alphabet[n >>> 12 & 63] + (i + 1 < value.length ? alphabet[n >>> 6 & 63] : "=") + (i + 2 < value.length ? alphabet[n & 63] : "=");
    }
    return result;
  };
  if (!g.atob) g.atob = (value) => {
    value = String(value).replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) throw new Error("Invalid base64");
    let n = 0, bits = 0, result = "";
    for (const c of value.replace(/=+$/, "")) {
      n = n << 6 | alphabet.indexOf(c);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        result += String.fromCharCode(n >>> bits & 255);
      }
    }
    return result;
  };
  if (!g.URLSearchParams) g.URLSearchParams = class {
    constructor(value = {}) {
      const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
      this.rows = typeof value === "string" ? value.replace(/^\?/, "").split("&").filter(Boolean).map((part) => {
        const i = part.indexOf("=");
        return i < 0 ? [decode(part), ""] : [decode(part.slice(0, i)), decode(part.slice(i + 1))];
      }) : Object.entries(value).map(([key, v]) => [key, String(v)]);
    }
    get(key) {
      return this.rows.find((row) => row[0] === key)?.[1] ?? null;
    }
    getAll(key) {
      return this.rows.filter((row) => row[0] === key).map((row) => row[1]);
    }
    has(key) {
      return this.rows.some((row) => row[0] === key);
    }
    keys() {
      return this.rows.map((row) => row[0])[Symbol.iterator]();
    }
    [Symbol.iterator]() {
      return this.rows[Symbol.iterator]();
    }
    toString() {
      const encode = (s) => encodeURIComponent(s).replace(/[!'()~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, "+");
      return this.rows.map(([key, value]) => encode(key) + "=" + encode(value)).join("&");
    }
  };

  const API='https://freevideo.zqqds.cn/free-video-portal/portal/',SITE='https://www.kuaikaw.cn';
  const utf8=s=>new TextEncoder().encode(String(s)),text=b=>new TextDecoder().decode(b);
  const base64=b=>btoa(Array.from(b,x=>String.fromCharCode(x)).join(''));
  const unbase64=s=>{if(typeof s!=='string'||s.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('河马密文格式无效');return Uint8Array.from(atob(s),c=>c.charCodeAt(0));};
  // Fixed protocol material from the official Android HttpEncryptUtils, not account credentials.
  const KEY=utf8('dzkjgfyxgshylgzm'),IV=utf8('apiupdownedcrypt');
  function mul(a,b){let n=0;for(;b;b>>>=1,a=(a<<1)^((a&128)?283:0))if(b&1)n^=a;return n&255;}
  const S=Array.from({length:256},(_,x)=>{let y=0;if(x){y=1;for(let i=0;i<254;i++)y=mul(y,x);}let s=y;for(let i=1;i<5;i++)s^=(y<<i)|(y>>>(8-i));return(s^99)&255;}),IS=[];
  S.forEach((v,i)=>IS[v]=i);
  const schedule=Array.from(KEY);let rc=1;
  for(let i=16;i<176;i+=4){let t=schedule.slice(i-4,i);if(i%16===0){t.push(t.shift());t=t.map(v=>S[v]);t[0]^=rc;rc=mul(rc,2);}for(let j=0;j<4;j++)schedule[i+j]=schedule[i+j-16]^t[j];}
  function block(input,decrypt){let s=Array.from(input);
    const add=r=>s=s.map((v,i)=>v^schedule[r*16+i]);
    const shift=inv=>{const p=s.slice();for(let c=0;c<4;c++)for(let r=0;r<4;r++)s[4*c+r]=p[4*((c+(inv?4-r:r))%4)+r];};
    const mix=inv=>{for(let c=0;c<4;c++){let i=4*c,a=s.slice(i,i+4),m=inv?[14,11,13,9]:[2,3,1,1];for(let r=0;r<4;r++)s[i+r]=a.reduce((n,v,j)=>n^mul(v,m[(j-r+4)%4]),0);}};
    if(decrypt){add(10);for(let r=9;r>=0;r--){shift(true);s=s.map(v=>IS[v]);add(r);if(r)mix(true);}}
    else{add(0);for(let r=1;r<=10;r++){s=s.map(v=>S[v]);shift(false);if(r<10)mix(false);add(r);}}
    return s;
  }
  function aesCbcEncrypt(value){const raw=utf8(value),pad=16-raw.length%16,b=new Uint8Array(raw.length+pad);b.set(raw);b.fill(pad,raw.length);let prev=IV;
    for(let i=0;i<b.length;i+=16){const out=block(b.slice(i,i+16).map((v,j)=>v^prev[j]),false);b.set(out,i);prev=out;}return base64(b);
  }
  function aesCbcDecrypt(value){const raw=unbase64(value);if(!raw.length||raw.length%16)throw Error('河马密文长度无效');const b=new Uint8Array(raw.length);let prev=IV;
    for(let i=0;i<raw.length;i+=16){const chunk=raw.slice(i,i+16),out=block(chunk,true);b.set(out.map((v,j)=>v^prev[j]),i);prev=chunk;}
    const pad=b[b.length-1];if(pad<1||pad>16||!b.slice(-pad).every(v=>v===pad))throw Error('河马密文填充无效');return text(b.slice(0,-pad));
  }
  function randomHex(n){let s='';while(s.length<n)s+=Math.floor(Math.random()*0x100000000).toString(16).padStart(8,'0');return s.slice(0,n);}
  const uuid=()=>randomHex(8)+'-'+randomHex(4)+'-4'+randomHex(3)+'-a'+randomHex(3)+'-'+randomHex(12);
  class HemaClient {
    constructor(widget){this.widget=widget;this.identity=null;this.initializing=null;this.loggingIn=null;}
    async init(){if(!this.initializing)this.initializing=(async()=>{let d;try{d=await this.widget.storage?.get?.('hema:guest:v1');if(typeof d==='string')d=JSON.parse(d);}catch{}
      if(!d||typeof d.utdid!=='string'||!d.utdid||typeof d.session1!=='string')d={utdid:base64(Uint8Array.from({length:12},()=>Math.floor(Math.random()*256))),session1:uuid(),session2:uuid(),createdAt:Date.now()-90000,userId:'',token:''};this.identity=d;
    })();await this.initializing;}
    common(){const d=this.identity;return {freeflow:0,version:'3.12.0',pname:'com.dz.hmjc',channelCode:'VHSE1000000',utdidTmp:d.utdid,utdid:d.utdid,token:d.token||'',userId:d.userId||'',os:'android',osv:33,brand:'google',model:'Pixel 6',manu:'Google',launch:'packagename',mchid:'',nchid:'VHSE1000000',session1:d.session1,session2:d.session2,startScene:'packagename',recSwitch:false,ds:-1,installTime:d.createdAt,p:65,nonce:randomHex(32),timeZone:'Asia/Shanghai',timestamp:String(Date.now())};}
    async raw(url,body){const options={url,method:body===undefined?'GET':'POST',base64Data:true,timeout:25,headers:{'user-agent':'okhttp/4.10.0','content-type':'application/json; charset=utf-8'}};
      if(body!==undefined){options.headers.alg='HG45LKBS';options.headers.datas=aesCbcEncrypt(JSON.stringify(this.common()));options.data=aesCbcEncrypt(JSON.stringify(body));}
      const r=await this.widget.http.request(options),status=Number(r?.statusCode??r?.status??200);if(status<200||status>=300)throw Error('河马接口 HTTP '+status);
      if(typeof r?.data!=='string')throw Error('河马响应编码无效');let decoded;try{decoded=text(unbase64(r.data));}catch{throw Error('河马响应编码无效');}
      if(body===undefined)return decoded;
      let json;try{json=JSON.parse(decoded);}catch{throw Error('河马接口响应无效');}
      if(Number(json.code)!==0)throw Error('河马接口请求失败（'+String(json.code??'unknown')+'）');
      try{return JSON.parse(aesCbcDecrypt(json.data));}catch{throw Error('河马接口数据无效');}
    }
    async login(){await this.init();if(!this.loggingIn)this.loggingIn=(async()=>{const d=this.identity,r=await this.raw(API+'1103',{oaid:'',requestType:1,activeType:1,isFirstLaunch:true,showPreference:0,todayLaunchNums:1,launchTime:Date.now(),scDistinctId:uuid(),deviceType:'Pixel 6',systemVersion:'13',curVerUpdateTime:d.createdAt});
      if(!r?.userId)throw Error('河马游客会话建立失败');d.userId=String(r.userId);d.token=typeof r.token==='string'?r.token:'';try{await this.widget.storage?.set?.('hema:guest:v1',JSON.stringify(d));}catch{}
    })().finally(()=>this.loggingIn=null);return this.loggingIn;}
    async request(path,body){await this.init();if(!this.identity.userId)await this.login();return this.raw(API+path,body);}
  }
  let instance;const client=()=>instance||(instance=new HemaClient(Widget));
  const pageNumber=x=>{const n=Number(x??1);if(!Number.isSafeInteger(n)||n<1||n>10000)throw Error('河马页码无效');return n;};
  const validId=x=>{const s=String(x??'');if(!/^\d{1,24}$/.test(s))throw Error('河马剧集 ID 无效');return s;};
  const clean=x=>String(x??'').replace(/<[^>]*>/g,'').trim();
  const isPaid=x=>Number(x?.isCharge)>0||Number(x?.price)>0;
  function card(x){const id=validId(x.bookId),cover=x.coverWap??x.cover??'';return {id:'hema:'+id,type:'url',mediaType:'tv',title:clean(x.bookName)||'河马短剧',description:clean(x.introduction),coverUrl:cover,posterPath:cover,backdropPath:cover,remark:(x.updateNum||x.totalChapterNum)?'全'+(x.updateNum||x.totalChapterNum)+'集':'',link:'hema://drama/'+id};}
  function cards(rows){if(!Array.isArray(rows))throw Error('河马列表格式无效');const seen=new Set();return rows.filter(x=>x&&/^\d{1,24}$/.test(String(x.bookId))&&!Number(x.isOffSiteBook)&&String(x.isNovel??'0')!=='1'&&Number(x.canFree??1)!==0&&!isPaid(x)).filter(x=>{const id=String(x.bookId);if(seen.has(id))return false;seen.add(id);return true;}).map(card);}
  async function loadList(params={}){const page=pageNumber(params.page),category=String(params.category??'0');if(!/^\d+(?:-\d+)*$/.test(category))throw Error('河马分类无效');
    const html=await client().raw(SITE+'/browse/'+category+'/'+page),match=/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);let d;try{d=JSON.parse(match?.[1]).props.pageProps;}catch{throw Error('河马官网列表解析失败');}return cards(d.bookList);
  }
  async function search(params={}){const keyword=String(params.keyword??params.query??'').trim();if(!keyword)return [];const page=pageNumber(params.page);const d=await client().request('1803',{keyword,searchKey:keyword,page});return cards(d.searchVos??[]);}
  function linkId(link){const m=typeof link==='string'&&/^hema:\/\/drama\/(\d{1,24})$/.exec(link);if(!m)throw Error('河马链接无效');return m[1];}
  async function detailData(id){const d=await client().request('1131',{bookId:id,resolutionRate:'720P'});if(!d?.videoInfo)throw Error('河马详情无效');if(!Array.isArray(d.chapterList))d.chapterList=(await client().request('1132',{bookId:id})).chapterList;return d;}
  function chapters(d){if(!Array.isArray(d.chapterList))throw Error('河马未返回剧集列表');const seen=new Set();return d.chapterList.filter(e=>{const n=Number(e.chapterIndex);if(!Number.isSafeInteger(n)||n<1||seen.has(n)||!/^\d{1,24}$/.test(String(e.chapterId)))return false;seen.add(n);return true;}).sort((a,b)=>Number(a.chapterIndex)-Number(b.chapterIndex));}
  async function loadDetail(link){const id=linkId(link),d=await detailData(id),item=card({...d.videoInfo,bookId:id});item.playerType='app';item.episodeItems=chapters(d).map(e=>({id:'hema:'+id+':1:'+e.chapterIndex,type:'url',mediaType:'tv',title:item.title,description:'第'+e.chapterIndex+'集',coverUrl:item.coverUrl,posterPath:item.posterPath,backdropPath:item.backdropPath,episode:Number(e.chapterIndex),episodeNumber:Number(e.chapterIndex),season:1,seasonNumber:1,link:item.link,playerType:'app'}));if(!item.episodeItems.length)throw Error('河马未返回剧集列表');return item;}
  async function loadResource(params={}){const id=linkId(params.link),selected=Number(params.episode??params.episodeNumber??1);if(!Number.isSafeInteger(selected)||selected<1)throw Error('河马集数无效');
    const d=await detailData(id),e=chapters(d).find(x=>Number(x.chapterIndex)===selected);if(!e)throw Error('河马集数不存在');if(isPaid(e))throw Error('河马付费剧集暂不提供');
    const r=await client().request('1131',{bookId:id,chapterId:String(e.chapterId),resolutionRate:'720P'}),v=r?.videoInfo,c=v?.content;if(!c)throw Error('河马未返回播放地址');
    if(String(v.chapterId)!==String(e.chapterId))throw Error('河马返回集数不匹配');const rate=(c.resolutionRates??[]).find(x=>x.rate===c.mp4UrlRate);if(Number(rate?.needVip)>0)throw Error('河马会员清晰度暂不提供');
    const urls=[c.mp4Url,...(Array.isArray(c.mp4SwitchUrl)?c.mp4SwitchUrl:[])].filter(x=>typeof x==='string'&&/^https?:\/\/[^\s]+$/.test(x));if(!urls.length)throw Error('河马未返回播放地址');
    return [...new Set(urls)].map((url,i)=>({name:i?'河马剧场 备用'+i:'河马剧场',playerType:'app',url,headers:{},format:/\.m3u8(?:\?|$)/i.test(url)?'hls':'auto',title:clean(v.bookName),episode:selected}));
  }
  const genres=[['全部','0'],['逆袭','417-464'],['重生','439-465'],['甜宠','462'],['现代言情','1145'],['都市','1129'],['古装','444'],['穿越','916'],['萌宝','589-1175'],['悬疑','445-470'],['家庭','714-1126'],['神医','438'],['女性成长','463'],['战神','1153-1173'],['总裁','1147'],['古代言情','468'],['漫剧','1115-1589']];
  const WidgetMetadata={id:'forward.hema.short-drama',title:'河马剧场',version:'1.0.0',requiredVersion:'0.0.1',author:'balge',site:SITE,detailCacheDuration:120,description:'河马短剧的分类、搜索和播放。',modules:[
    {id:'discover',title:'剧场',functionName:'loadList',cacheDuration:120,params:[{name:'page',title:'页码',type:'page'},{name:'category',title:'题材',type:'enumeration',value:'0',enumOptions:genres.map(([title,value])=>({title,value}))}]},
    {id:'search',title:'搜索',functionName:'search',cacheDuration:60,params:[{name:'keyword',title:'关键词',type:'input'},{name:'page',title:'页码',type:'page'}]},
    {id:'loadResource',title:'播放资源',functionName:'loadResource',type:'stream',cacheDuration:0,params:[]}
  ],search:{title:'搜索',functionName:'search',params:[{name:'keyword',title:'关键词',type:'input'},{name:'page',title:'页码',type:'page'}]}};
  Object.assign(globalThis,{WidgetMetadata,HemaClient,aesCbcEncrypt,aesCbcDecrypt,loadList,search,loadDetail,loadResource});
})();
