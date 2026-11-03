import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTelegramStats, telegramMarkdown, compareMetrics, formatChange } from './telegram-stats.mjs';
const dayMs=86_400_000;
const end=Math.floor((Date.now()+8*3600_000)/dayMs)*dayMs-8*3600_000;
const date=(ms)=>new Date(ms+8*3600_000).toISOString().slice(0,10);
const expectedDate=date(end-dayMs);
function fixture(){
 const report={version:1,service:'remote-job-radar',timezone:'Asia/Shanghai',generatedAt:new Date().toISOString(),reportDate:expectedDate,
 totals:{registeredUsers:10,enabledAlertUsers:3},weeklyActive:2,
 daily:Array.from({length:15},(_,i)=>({day:date(end+(i-14)*dayMs),newUsers:1,active:2,interactions:4})),
 privateField:'must not be published'};
 return {ok:true,result:{id:123,pinned_message:{from:{id:456},text:'Remote Job Radar · Daily statistics export\n'+JSON.stringify(report)}}};
}
function change(body,update){const report=JSON.parse(body.result.pinned_message.text.split('\n')[1]);update(report);body.result.pinned_message.text='Remote Job Radar · Daily statistics export\n'+JSON.stringify(report);return body;}
test('validated Telegram snapshot allows only aggregate fields, deduplicated weekly active and both README languages',()=>{
 const stats=validateTelegramStats(fixture(),expectedDate,'456','123');
 assert.equal(stats.dayBeforePrevious.date,date(end-2*dayMs));assert.equal(stats.comparison.newUsers.difference,0);
 assert.equal(stats.previousDay.date,expectedDate);assert.equal(stats.last7Days.activeUsers,2);assert.equal(stats.last7Days.interactions,28);
 assert.equal(stats.last7Days.endDateExclusive,date(end));assert.equal(stats.daily.length,14);assert.equal(stats.privateField,undefined);
 assert.match(telegramMarkdown(stats,true).join('\n'),/活跃用户/);assert.match(telegramMarkdown(stats,false).join('\n'),/active users/);
});
test('missing, stale, wrong author, truncated and inconsistent snapshots fail rather than publish zero',()=>{
 assert.throws(()=>validateTelegramStats({ok:true,result:{id:123}},expectedDate,'456','123'));
 assert.throws(()=>validateTelegramStats(fixture(),'2000-01-01','456','123'),/stale/);
 assert.throws(()=>validateTelegramStats(fixture(),expectedDate,'999','123'),/configured bot/);
 assert.throws(()=>validateTelegramStats(change(fixture(),r=>r.daily.pop()),expectedDate,'456','123'));
 assert.throws(()=>validateTelegramStats(change(fixture(),r=>r.daily[0].interactions=-1),expectedDate,'456','123'));
 assert.throws(()=>validateTelegramStats(change(fixture(),r=>r.weeklyActive=100),expectedDate,'456','123'));
 assert.throws(()=>validateTelegramStats(change(fixture(),r=>r.generatedAt='2000-01-01'),expectedDate,'456','123'));
});

test('daily differences handle increases, decreases and a zero baseline without infinity', () => {
 const metrics = compareMetrics({a:3,b:0,c:4,d:0},{a:2,b:2,c:0,d:0},['a','b','c','d']);
 assert.deepEqual(metrics.a,{difference:1,percent:50});
 assert.equal(formatChange(metrics.a),'+1 (+50%)');
 assert.equal(formatChange(metrics.b),'-2 (-100%)');
 assert.equal(formatChange(metrics.c,true),'+4 (前天为 0)');
 assert.equal(formatChange(metrics.d),'0 (0%)');
});
