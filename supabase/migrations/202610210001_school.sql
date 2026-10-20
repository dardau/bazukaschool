-- BazukaSchool pilot. Apply once to a new Supabase project as postgres.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 80),
 role text not null default 'student' check(role in ('student','teacher')),
 created_at timestamptz not null default now()
);
create function public.school_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),80),''),'Ученик'));
 return new;
end $$;
create trigger school_new_user after insert on auth.users for each row execute function public.school_new_user();
create table public.enrollments (
 student_id uuid primary key references public.profiles(id) on delete cascade,
 teacher_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), check(student_id<>teacher_id)
);
create index on public.enrollments(teacher_id);
create function public.is_teacher() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='teacher');
$$;
create function public.teaches(student uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_teacher() and exists(select 1 from public.enrollments where student_id=student and teacher_id=auth.uid());
$$;
create table public.invitations (
 code uuid primary key default gen_random_uuid(), teacher_id uuid not null default auth.uid() references public.profiles(id),
 expires_at timestamptz not null default now()+interval '7 days', used_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create function public.join_class(invite uuid) returns void language plpgsql security definer set search_path='' as $$
declare invitation public.invitations;
begin
 if auth.uid() is null or public.is_teacher() then raise exception 'Student account required'; end if;
 select * into invitation from public.invitations where code=invite for update;
 if invitation.code is null or invitation.used_by is not null or invitation.expires_at<now() then raise exception 'Invitation expired or used'; end if;
 if not exists(select 1 from public.profiles where id=invitation.teacher_id and role='teacher') then raise exception 'Teacher unavailable'; end if;
 insert into public.enrollments(student_id,teacher_id) values(auth.uid(),invitation.teacher_id);
 update public.invitations set used_by=auth.uid() where code=invite;
end $$;
create table public.study_items (
 user_id uuid not null references public.profiles(id) on delete cascade,
 key text not null check(length(key)<250 and key ~ '^(lesson|word|answer|note|custom|check|last):'),
 value jsonb not null check(octet_length(value::text)<=150000), revision integer not null default 1,
 updated_at timestamptz not null default now(), primary key(user_id,key)
);
create function public.save_study_item(item_key text,item_value jsonb,expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare rev integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision=0 then
  insert into public.study_items(user_id,key,value) values(auth.uid(),item_key,item_value) on conflict do nothing returning revision into rev;
 else
  update public.study_items set value=item_value,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and key=item_key and revision=expected_revision returning revision into rev;
 end if;
 if rev is null then raise exception 'EDIT_CONFLICT'; end if;
 return rev;
end $$;
create table public.lesson_materials (
 key text primary key check(key ~ '^note:teacher-' and length(key)<250), value jsonb not null check(octet_length(value::text)<=150000),
 updated_by uuid not null default auth.uid() references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 teacher_id uuid not null references public.profiles(id), assignment_key text not null check(length(assignment_key) between 1 and 250),
 title text not null check(length(title) between 1 and 1200), body text not null default '' check(length(body)<=100000),
 audio_path text unique, created_at timestamptz not null default now(),
 check(length(trim(body))>0 or audio_path is not null),
 check(audio_path is null or audio_path=student_id::text||'/'||id::text||'.audio')
);
create index on public.submissions(teacher_id,created_at desc);
create index on public.submissions(student_id,created_at desc);
create table public.reviews (
 submission_id uuid primary key references public.submissions(id) on delete cascade,
 teacher_id uuid not null default auth.uid() references public.profiles(id),
 feedback text not null check(length(trim(feedback)) between 1 and 10000),
 status text not null check(status in ('reviewed','revise')), updated_at timestamptz not null default now()
);
-- No client can assign roles, change enrollment, edit submitted snapshots, or write someone else's feedback.
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.invitations enable row level security;
alter table public.study_items enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
revoke all on public.profiles,public.enrollments,public.invitations,public.study_items,public.lesson_materials,public.submissions,public.reviews from anon,authenticated;
grant select on public.profiles,public.enrollments,public.invitations,public.study_items,public.lesson_materials,public.submissions,public.reviews to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert on public.invitations,public.submissions to authenticated;
grant insert,update on public.reviews,public.lesson_materials to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.teaches(id) or exists(select 1 from public.enrollments where student_id=auth.uid() and teacher_id=profiles.id));
create policy profiles_name on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy enrollment_read on public.enrollments for select to authenticated using(student_id=auth.uid() or teacher_id=auth.uid());
create policy invitation_read on public.invitations for select to authenticated using(teacher_id=auth.uid() and public.is_teacher());
create policy invitation_create on public.invitations for insert to authenticated with check(teacher_id=auth.uid() and public.is_teacher() and used_by is null and expires_at>now() and expires_at<=now()+interval '7 days');
create policy study_read on public.study_items for select to authenticated using(user_id=auth.uid());
create policy material_read on public.lesson_materials for select to authenticated using(true);
create policy material_insert on public.lesson_materials for insert to authenticated with check(public.is_teacher() and updated_by=auth.uid());
create policy material_update on public.lesson_materials for update to authenticated using(public.is_teacher()) with check(public.is_teacher() and updated_by=auth.uid());
create policy submission_read on public.submissions for select to authenticated using(student_id=auth.uid() or (teacher_id=auth.uid() and public.teaches(student_id)));
create policy submission_create on public.submissions for insert to authenticated with check(student_id=auth.uid() and exists(select 1 from public.enrollments where student_id=auth.uid() and teacher_id=submissions.teacher_id) and (audio_path is null or exists(select 1 from storage.objects where bucket_id='student-audio' and name=audio_path)));
create policy review_read on public.reviews for select to authenticated using(exists(select 1 from public.submissions s where s.id=submission_id));
create policy review_insert on public.reviews for insert to authenticated with check(teacher_id=auth.uid() and public.is_teacher() and exists(select 1 from public.submissions s where s.id=submission_id and s.teacher_id=auth.uid() and public.teaches(s.student_id)));
create policy review_update on public.reviews for update to authenticated using(public.is_teacher() and exists(select 1 from public.submissions s where s.id=submission_id and s.teacher_id=auth.uid() and public.teaches(s.student_id))) with check(teacher_id=auth.uid() and exists(select 1 from public.submissions s where s.id=submission_id and s.teacher_id=auth.uid() and public.teaches(s.student_id)));
-- Only completion flags and word counts are shared; personal notes/drafts remain private.
create function public.class_progress() returns table(student_id uuid,completed bigint,words bigint,last_activity timestamptz) language sql stable security definer set search_path='' as $$
 select e.student_id,count(i.key) filter(where (i.key like 'check:course-%' or i.key like 'lesson:%') and i.value='true'::jsonb),
 count(i.key) filter(where i.key like 'word:%' and i.value->>'known'='true'),max(i.updated_at)
 from public.enrollments e left join public.study_items i on i.user_id=e.student_id
 where e.teacher_id=auth.uid() and public.is_teacher() group by e.student_id;
$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('student-audio','student-audio',false,26214400,array['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav']);
create policy audio_insert on storage.objects for insert to authenticated with check(bucket_id='student-audio' and split_part(name,'/',1)=auth.uid()::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.audio$' and exists(select 1 from public.enrollments where student_id=auth.uid()));
create policy audio_read on storage.objects for select to authenticated using(bucket_id='student-audio' and (split_part(name,'/',1)=auth.uid()::text or exists(select 1 from public.submissions s where s.audio_path=name and s.teacher_id=auth.uid() and public.teaches(s.student_id))));
create policy audio_cleanup on storage.objects for delete to authenticated using(bucket_id='student-audio' and split_part(name,'/',1)=auth.uid()::text and not exists(select 1 from public.submissions s where s.audio_path=name));
revoke all on function public.school_new_user(),public.is_teacher(),public.teaches(uuid),public.join_class(uuid),public.save_study_item(text,jsonb,integer),public.class_progress() from public,anon;
grant execute on function public.is_teacher(),public.teaches(uuid),public.join_class(uuid),public.save_study_item(text,jsonb,integer),public.class_progress() to authenticated;
commit;
