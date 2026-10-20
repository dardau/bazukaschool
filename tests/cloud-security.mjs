import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public,storage to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;`);
await db.exec(await readFile(new URL('../supabase/migrations/202610210001_school.sql',import.meta.url),'utf8'));
const ids={s1:'11111111-1111-4111-8111-111111111111',s2:'22222222-2222-4222-8222-222222222222',t1:'33333333-3333-4333-8333-333333333333',t2:'44444444-4444-4444-8444-444444444444'};
for(const [name,id] of Object.entries(ids))await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,{display_name:name,role:'teacher'}]);
assert.equal((await db.query('select count(*)::int n from public.profiles where role=\'teacher\'')).rows[0].n,0,'metadata cannot promote a teacher');
await db.query("update public.profiles set role='teacher' where id in ($1,$2)",[ids.t1,ids.t2]);
async function as(who,fn){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[who]||'']);await db.exec('set role '+(who?'authenticated':'anon'));try{return await fn();}finally{await db.exec('reset role');}}
async function denied(fn,label){await assert.rejects(fn,undefined,label);}
await as('s1',async()=>{
 await denied(()=>db.query("update public.profiles set role='teacher' where id=$1",[ids.s1]),'role escalation');
 await denied(()=>db.query('insert into public.enrollments(student_id,teacher_id) values($1,$2)',[ids.s1,ids.t1]),'self assignment without invite');
 await denied(()=>db.query('insert into public.invitations default values'),'student invitation');
});
let invite;await as('t1',async()=>{invite=(await db.query('insert into public.invitations default values returning code')).rows[0].code;});
await as('s1',()=>db.query('select public.join_class($1)',[invite]));
await as('s2',()=>denied(()=>db.query('select public.join_class($1)',[invite]),'one-use invitation'));
await as('t2',async()=>{invite=(await db.query('insert into public.invitations default values returning code')).rows[0].code;});
await as('s2',()=>db.query('select public.join_class($1)',[invite]));
await as('s1',async()=>{
 await db.query("select public.save_study_item('answer:test','\"private draft\"',0)");
 await denied(()=>db.query("select public.save_study_item('answer:test','\"overwrite\"',0)"),'conflict on new row');
 await db.query("select public.save_study_item('answer:test','\"updated draft\"',1)");
 await denied(()=>db.query("select public.save_study_item('answer:test','\"stale\"',1)"),'stale update');
 await db.query("select public.save_study_item('word:test','{\"known\":true}',0)");
});
for(const who of ['s2','t1','t2'])await as(who,async()=>assert.equal((await db.query('select * from public.study_items')).rows.length,0,'private drafts'));
const sid='55555555-5555-4555-8555-555555555555';const path=ids.s1+'/'+sid+'.audio';
await as('s1',async()=>{
 await denied(()=>db.query('insert into public.submissions(id,teacher_id,assignment_key,title,body) values($1,$2,\'test\',\'Test\',\'answer\')',[sid,ids.t2]),'wrong teacher');
 await db.query("insert into storage.objects(bucket_id,name) values('student-audio',$1)",[path]);
 await db.query('insert into public.submissions(id,teacher_id,assignment_key,title,audio_path) values($1,$2,\'test\',\'Test\',$3)',[sid,ids.t1,path]);
 await denied(()=>db.query("update public.submissions set body='changed' where id=$1",[sid]),'immutable submitted answer');
 await denied(()=>db.query('insert into public.reviews(submission_id,feedback,status) values($1,\'fake\',\'reviewed\')',[sid]),'student feedback forgery');
 assert.equal((await db.query('delete from storage.objects where name=$1 returning id',[path])).rows.length,0,'submitted audio protected');
});
for(const who of ['s2','t2'])await as(who,async()=>{
 assert.equal((await db.query('select * from public.submissions')).rows.length,0,'other classroom submissions hidden');
 assert.equal((await db.query('select * from storage.objects')).rows.length,0,'other classroom audio hidden');
 await denied(()=>db.query('insert into public.reviews(submission_id,feedback,status) values($1,\'fake\',\'reviewed\')',[sid]),'other teacher feedback');
});
await as('t1',async()=>{
 assert.equal((await db.query('select * from public.submissions')).rows.length,1);
 assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await db.query('insert into public.reviews(submission_id,feedback,status) values($1,\'Useful feedback\',\'revise\')',[sid]);
 const p=(await db.query('select * from public.class_progress()')).rows;assert.equal(p.length,1);assert.equal(Number(p[0].words),1);
});
await as('s1',async()=>assert.equal((await db.query('select * from public.reviews')).rows[0].feedback,'Useful feedback'));
await as('s2',async()=>assert.equal((await db.query('select * from public.reviews')).rows.length,0));
await as('',()=>denied(()=>db.query('select * from public.profiles'),'anonymous data access'));
await db.query('update public.enrollments set teacher_id=$1 where student_id=$2',[ids.t2,ids.s1]);
await db.query('update public.submissions set teacher_id=$1 where id=$2',[ids.t2,sid]);
await as('t1',async()=>{assert.equal((await db.query('select * from public.submissions')).rows.length,0);assert.equal((await db.query('select * from storage.objects')).rows.length,0);});
await as('t2',async()=>{await db.query("update public.reviews set teacher_id=$1,feedback='New teacher feedback' where submission_id=$2",[ids.t2,sid]);assert.equal((await db.query('select * from public.reviews')).rows[0].feedback,'New teacher feedback');});
await db.close();console.log('PASS: role escalation, enrollment invitations, cross-account isolation, immutable submissions, private audio, teacher reviews, progress privacy and optimistic concurrency.');
