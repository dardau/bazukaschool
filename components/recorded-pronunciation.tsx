'use client';
import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type Recording={url:string,source:string,label:string};
const cache=new Map<string,Recording[]>();
async function lookup(term:string,signal:AbortSignal):Promise<Recording[]>{
 if(cache.has(term))return cache.get(term)!;
 const qs=new URLSearchParams({action:'parse',page:term.toLowerCase(),prop:'text',format:'json',origin:'*',redirects:'1'});
 const r=await fetch('https://en.wiktionary.org/w/api.php?'+qs,{signal});if(!r.ok)throw Error('network');
 const data=await r.json() as {error?:unknown,parse?:{text?:{"*"?:string}}};if(data.error){cache.set(term,[]);return []}
 const html=data.parse?.text?.['*']||'';
 const start=html.search(/id="English"/);if(start<0)return [];
 const english=html.slice(start);const end=english.search(/<h2\b/);const section=end>=0?english.slice(0,end):english;
 const pronunciation=section.search(/id="Pronunciation(?:_\d+)?"/);if(pronunciation<0)return [];
 const tail=section.slice(pronunciation);const cut=tail.search(/<h[23]\b/);const fragment=cut>=0?tail.slice(0,cut):tail;
 const doc=new DOMParser().parseFromString(fragment,'text/html');
 const recordings:Recording[]=[];
 for(const audio of doc.querySelectorAll('audio')){
  const sources=Array.from(audio.querySelectorAll('source'));const src=(sources.find(s=>s.getAttribute('type')==='audio/mpeg')||sources[0])?.getAttribute('src');
  if(!src)continue;const url=new URL(src,'https://en.wiktionary.org');if(url.hostname!=='upload.wikimedia.org')continue;
  const container=audio.closest('table')||audio.parentElement;
  const fileLink=container?.querySelector('a[href*="File:"]')?.getAttribute('href');
  const name=decodeURIComponent(url.pathname.split('/').pop()||'');
  const label=/en[-_]uk|en[-_]gb/i.test(name)?'UK':/en[-_]us/i.test(name)?'US':'Запись';
  recordings.push({url:url.href,source:fileLink?new URL(fileLink,'https://en.wiktionary.org').href:'https://en.wiktionary.org/wiki/'+encodeURIComponent(term)+'#English',label});
 }
 const result=recordings.filter((v,i,a)=>a.findIndex(x=>x.url===v.url)===i).slice(0,4);cache.set(term,result);return result;
}
export default function RecordedPronunciation({text,onClose}:{text:string,onClose:()=>void}){
 const [rows,setRows]=useState<{term:string,recordings:Recording[]}[]>([]),[status,setStatus]=useState('loading'),[attempt,setAttempt]=useState(0),[partial,setPartial]=useState(false),[failed,setFailed]=useState<string[]>([]);
 useEffect(()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);let active=true;
 setStatus('loading');setRows([]);setFailed([]);setPartial(false);
 (async()=>{try{
  const terms=text.replace(/\([^)]*\)/g,'').split('/').map(t=>t.trim().replace(/^to\s+/i,'')).filter(Boolean);
  const whole=await Promise.all(terms.map(async term=>({term,recordings:await lookup(term,controller.signal)})));
  let result=whole;
  if(!whole.some(x=>x.recordings.length)&&terms.some(t=>t.includes(' '))){setPartial(true);const singles=Array.from(new Set(terms.join(' ').match(/[a-z]+(?:[-'][a-z]+)*/gi)||[])).filter(t=>!['smth','smb','sth'].includes(t.toLowerCase())).slice(0,15);result=await Promise.all(singles.map(async term=>({term,recordings:await lookup(term,controller.signal)})));}
  if(active){setRows(result);setStatus(result.some(x=>x.recordings.length)?'ready':'empty')}
 }catch{if(active)setStatus('error')}finally{clearTimeout(timeout)}})();
 return()=>{active=false;controller.abort();clearTimeout(timeout)}},[text,attempt]);
 return <Dialog open onOpenChange={v=>!v&&onClose()}><DialogContent className="pronunciation-dialog"><DialogHeader><DialogTitle>{text}</DialogTitle><DialogDescription>Словарные аудиозаписи Wiktionary. Источник, автор и условия использования доступны по ссылке у каждой записи.</DialogDescription></DialogHeader>
 {status==='loading'&&<p role="status">Ищу записи произношения…</p>}
 {partial&&<p className="info-note">Запись выражения целиком не найдена. Ниже — отдельные слова; это не связное произношение фразы.</p>}
 {rows.map(row=><div className="recording-row" key={row.term}><b>{row.term}</b>{row.recordings.length?row.recordings.map(rec=><div key={rec.url}><span className="pill">{rec.label}</span><audio aria-label={'Произношение '+row.term+' '+rec.label} controls preload="none" src={rec.url} onError={()=>setFailed(f=>f.includes(rec.url)?f:[...f,rec.url])}/>{failed.includes(rec.url)&&<small role="alert">Запись не загрузилась. Открой источник.</small>}<a href={rec.source} target="_blank" rel="noreferrer">Запись, автор и лицензия ↗</a></div>):<small>Запись не найдена. <a href={'https://en.wiktionary.org/wiki/'+encodeURIComponent(row.term)+'#English'} target="_blank" rel="noreferrer">Открыть словарь ↗</a></small>}</div>)}
 {(status==='error'||status==='empty')&&<p role="status">{status==='error'?'Сервис записей сейчас недоступен.':'Для этого выражения записи не найдены.'} <a href={'https://en.wiktionary.org/wiki/'+encodeURIComponent(text)+'#English'} target="_blank" rel="noreferrer">Открыть Wiktionary ↗</a></p>}
 {status==='error'&&<button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Попробовать снова</button>}
 <small>Для загрузки записей нужен интернет. Синтетическая озвучка отключена.</small>
 </DialogContent></Dialog>
}
