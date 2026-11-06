import test from 'node:test';
import assert from 'node:assert/strict';
import { channelProductStats, validateChannelStats, validateMetadataStats, productMarkdown } from './product-report.mjs';
const product = {key:'metadata',name:'JAVIndexBot',service:'telegram-metadata',kind:'telegram',url:'https://t.me/JAVIndexBot',prefix:'Telegram Metadata · Daily statistics export\n'};
const dayMs=86400_000,offset=8*3600_000,end=Math.floor((Date.now()+offset)/dayMs)*dayMs-offset;
const date=n=>new Date(n+offset).toISOString().slice(0,10),expected=date(end-dayMs);
function fixture(complete=false){
 const r={version:1,service:'telegram-metadata',timezone:'Asia/Shanghai',reportDate:expected,
 generatedAt:new Date().toISOString(),trackingSince:new Date(complete?end-20*dayMs:end+1).toISOString(),
 totals:{registeredUsers:2},weeklyActive:complete?2:null,
 daily:Array.from({length:15},(_,i)=>({day:date(end+(i-14)*dayMs),newUsers:1,active:complete?2:null,interactions:complete?4:null,searches:complete?1:null})),secret:'must not escape'};
 return {ok:true,result:{id:123,pinned_message:{from:{id:456},text:product.prefix+JSON.stringify(r)}}};
}
function modify(b,fn){const r=JSON.parse(b.result.pinned_message.text.slice(product.prefix.length));fn(r);b.result.pinned_message.text=product.prefix+JSON.stringify(r);return b;}
test('metadata adapter preserves unavailable periods and only publishes aggregate allowlist',()=>{
 const r=validateMetadataStats(fixture(),expected,'456','123',product);
 assert.equal(r.previousDay.activeUsers,null);assert.equal(r.last7Days.interactions,null);assert.equal(r.last7Days.newUsers,7);
 assert.equal(r.secret,undefined);assert.equal(r.daily.length,14);
 assert.match(productMarkdown(product,r,true).join('\n'),/查询请求.*—/);
 assert.match(productMarkdown(product,r,false).join('\n'),/Search requests/);
});
test('complete weekly active is deduplicated and search attempts are summed',()=>{
 const r=validateMetadataStats(fixture(true),expected,'456','123',product);
 assert.equal(r.last7Days.activeUsers,2);assert.equal(r.last7Days.searches,7);
});
test('wrong author, stale snapshot, broken dates and fabricated coverage fail',()=>{
 assert.throws(()=>validateMetadataStats(fixture(),expected,'999','123',product));
 for(const fn of [r=>r.reportDate='2000-01-01',r=>r.daily.pop(),r=>r.daily[0].active=0,r=>r.weeklyActive=0,
 r=>r.daily[0].day='2000-01-01',r=>r.generatedAt='2000-01-01'])
  assert.throws(()=>validateMetadataStats(modify(fixture(),fn),expected,'456','123',product));
});

test('channel report uses daily subscriber snapshots and publication receipts without fabricating history',()=>{
 const product={key:'aiChannel',name:'AI Product Radar',nameZh:'AI产品雷达',kind:'telegram-channel',url:'https://t.me/ai_product_radar_cn'};
 const exportDay=(date,count,status='sent')=>({date,channels:[
  {key:'ai',status,publishedItems:status==='sent'?2:0,memberCount:count,messageId:status==='sent'?12:null,
   url:status==='sent'?'https://t.me/ai_product_radar_cn/12':null,collectedAt:count===null?null:`${date}T01:00:00.000Z`},
  {key:'steam',status:'no_content',publishedItems:0,memberCount:null,messageId:null,url:null,collectedAt:null},
 ]});
 const raw=validateChannelStats({version:1,generatedAt:new Date().toISOString(),
  currentSnapshot:{date:date(end),collectedAt:new Date().toISOString(),channels:[{key:'ai',memberCount:120},{key:'steam',memberCount:12}]},
  days:[exportDay(expected,120),exportDay(date(end-2*dayMs),null,'no_content')]},expected);
 const report=channelProductStats(raw,'aiChannel');
 assert.equal(report.previousDay.memberCount,120);
 assert.equal(report.previousDay.date,expected);
 assert.equal(report.currentSnapshot.memberCount,120);
 assert.equal(report.trackingSince,expected);
 assert.equal(report.dayBeforePrevious.memberCount,null);
 assert.equal(report.dayBeforePrevious.publishedItems,0);
 assert.match(productMarkdown(product,report,true).join('\n'),/订阅人数.*—.*120/);
 assert.match(productMarkdown(product,report,true).join('\n'),/当前订阅人数：120/);
 assert.throws(()=>validateChannelStats({version:1,generatedAt:new Date().toISOString(),currentSnapshot:{},days:[]},expected));
});
