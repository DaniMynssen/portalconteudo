-- Portal de Conteúdo — estrutura inicial
-- Tabelas, segurança por cliente (RLS), funções de aprovação e bucket de mídia.

-- ============================================================
-- Tabelas
-- ============================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default 'green',
  avatar_url text,
  youtube_url text,
  instagram_handle text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  platform text not null check (platform in ('youtube', 'instagram')),
  format text not null check (format in ('video', 'reels', 'carrossel', 'post', 'stories')),
  status text not null default 'ideia',
  publish_date date,
  title text not null default '',
  briefing text not null default '',
  script text not null default '',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  post_url text,
  transcript text,
  position int not null default 0,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contents_client_date_idx on public.contents (client_id, publish_date);
create index contents_status_idx on public.contents (status);

create table public.title_options (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  text text not null,
  is_selected boolean not null default false,
  client_pick boolean not null default false,
  created_at timestamptz not null default now()
);
create index title_options_content_idx on public.title_options (content_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  kind text not null check (kind in ('thumbnail', 'capa', 'slide', 'arte')),
  storage_path text not null,
  file_name text,
  sort_order int not null default 0,
  is_selected boolean not null default false,
  client_pick boolean not null default false,
  created_at timestamptz not null default now()
);
create index media_content_idx on public.media (content_id);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  title text not null,
  description text not null default '',
  platform text check (platform in ('youtube', 'instagram')),
  format text check (format in ('video', 'reels', 'carrossel', 'post', 'stories')),
  reference_url text,
  attachment_path text,
  status text not null default 'nova' check (status in ('nova', 'em_analise', 'aceita', 'recusada')),
  admin_reply text,
  content_id uuid references public.contents (id) on delete set null,
  created_at timestamptz not null default now()
);
create index suggestions_client_idx on public.suggestions (client_id, status);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.contents (id) on delete cascade,
  suggestion_id uuid references public.suggestions (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  check (content_id is not null or suggestion_id is not null)
);
create index comments_content_idx on public.comments (content_id);
create index comments_suggestion_idx on public.comments (suggestion_id);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  decision text not null check (decision in ('aprovado', 'ajuste')),
  comment text,
  from_status text,
  to_status text,
  created_at timestamptz not null default now()
);
create index approvals_content_idx on public.approvals (content_id);

-- ============================================================
-- Funções auxiliares
-- ============================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid();
$$;

create or replace function public.can_see_content(p_content_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.contents c
    where c.id = p_content_id and c.client_id = public.my_client_id()
  );
$$;

create or replace function public.can_see_suggestion(p_suggestion_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.suggestions s
    where s.id = p_suggestion_id and s.client_id = public.my_client_id()
  );
$$;

-- Nomes de quem comenta/aprova, sem expor e-mail: admins + pessoas do mesmo cliente
create or replace function public.profile_names(p_ids uuid[])
returns table (id uuid, full_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.role
  from public.profiles p
  where p.id = any (p_ids)
    and (public.is_admin() or p.role = 'admin' or p.client_id = public.my_client_id());
$$;

-- Fluxo de etapas por formato (espelha src/lib/pipelines.ts)
create or replace function public.pipeline_steps(p_format text)
returns text[] language sql immutable as $$
  select case p_format
    when 'video'     then array['ideia','titulo_thumb','aprovacao','roteiro','gravar','editar','metadados','agendado','postado']
    when 'reels'     then array['ideia','roteiro','aprovacao','gravar','editar','legenda','agendado','postado']
    when 'carrossel' then array['ideia','copy','design','aprovacao','legenda','agendado','postado']
    when 'post'      then array['ideia','copy','design','aprovacao','legenda','agendado','postado']
    when 'stories'   then array['ideia','producao','aprovacao','postado']
  end;
$$;

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contents_touch before update on public.contents
for each row execute function public.touch_updated_at();

-- Valida status contra o fluxo do formato
create or replace function public.validate_content_status()
returns trigger language plpgsql as $$
begin
  if not (new.status = any (public.pipeline_steps(new.format))) then
    raise exception 'Etapa "%" não existe no fluxo do formato "%"', new.status, new.format;
  end if;
  return new;
end;
$$;

create trigger contents_validate_status before insert or update on public.contents
for each row execute function public.validate_content_status();

-- Perfil criado a cada novo usuário.
-- O primeiro usuário do sistema vira admin; os demais entram como cliente sem vínculo
-- (o vínculo com o cliente é feito pelo convite, via service role).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  has_admin boolean;
begin
  select exists (select 1 from public.profiles where role = 'admin') into has_admin;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when has_admin then 'client' else 'admin' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- Ações do cliente (security definer, com checagens)
-- ============================================================

create or replace function public.decide_approval(p_content_id uuid, p_decision text, p_comment text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  c public.contents;
  steps text[];
  idx int;
  new_status text;
begin
  select * into c from public.contents where id = p_content_id;
  if c.id is null then
    raise exception 'Conteúdo não encontrado';
  end if;
  if not (public.is_admin() or c.client_id = public.my_client_id()) then
    raise exception 'Sem permissão';
  end if;
  if c.status <> 'aprovacao' then
    raise exception 'Este conteúdo não está aguardando aprovação';
  end if;
  if p_decision not in ('aprovado', 'ajuste') then
    raise exception 'Decisão inválida';
  end if;
  if p_decision = 'ajuste' and coalesce(trim(p_comment), '') = '' then
    raise exception 'Conte o que precisa ajustar';
  end if;

  steps := public.pipeline_steps(c.format);
  idx := array_position(steps, 'aprovacao');
  new_status := case when p_decision = 'aprovado' then steps[idx + 1] else steps[idx - 1] end;

  update public.contents set status = new_status where id = c.id;

  insert into public.approvals (content_id, user_id, decision, comment, from_status, to_status)
  values (c.id, auth.uid(), p_decision, nullif(trim(coalesce(p_comment, '')), ''), c.status, new_status);

  if coalesce(trim(p_comment), '') <> '' then
    insert into public.comments (content_id, author_id, body) values (c.id, auth.uid(), trim(p_comment));
  end if;

  return new_status;
end;
$$;

create or replace function public.client_pick_media(p_media_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.media;
begin
  select * into m from public.media where id = p_media_id;
  if m.id is null or not public.can_see_content(m.content_id) then
    raise exception 'Sem permissão';
  end if;
  update public.media set client_pick = (id = p_media_id)
  where content_id = m.content_id and kind = m.kind;
end;
$$;

create or replace function public.client_pick_title(p_title_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.title_options;
begin
  select * into t from public.title_options where id = p_title_id;
  if t.id is null or not public.can_see_content(t.content_id) then
    raise exception 'Sem permissão';
  end if;
  update public.title_options set client_pick = (id = p_title_id)
  where content_id = t.content_id;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.title_options enable row level security;
alter table public.media enable row level security;
alter table public.suggestions enable row level security;
alter table public.comments enable row level security;
alter table public.approvals enable row level security;

-- clients
create policy "clients_select" on public.clients for select
  using (public.is_admin() or id = public.my_client_id());
create policy "clients_admin_write" on public.clients for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: cada um lê o seu; admin lê e altera todos. Ninguém altera o próprio papel.
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- contents
create policy "contents_select" on public.contents for select
  using (public.is_admin() or client_id = public.my_client_id());
create policy "contents_admin_write" on public.contents for all
  using (public.is_admin()) with check (public.is_admin());

-- title_options
create policy "titles_select" on public.title_options for select
  using (public.can_see_content(content_id));
create policy "titles_admin_write" on public.title_options for all
  using (public.is_admin()) with check (public.is_admin());

-- media
create policy "media_select" on public.media for select
  using (public.can_see_content(content_id));
create policy "media_admin_write" on public.media for all
  using (public.is_admin()) with check (public.is_admin());

-- suggestions: cliente lê e cria as suas; admin faz tudo
create policy "suggestions_select" on public.suggestions for select
  using (public.is_admin() or client_id = public.my_client_id());
create policy "suggestions_client_insert" on public.suggestions for insert
  with check (
    public.is_admin()
    or (client_id = public.my_client_id() and created_by = auth.uid() and status = 'nova' and content_id is null and admin_reply is null)
  );
create policy "suggestions_admin_update" on public.suggestions for update
  using (public.is_admin()) with check (public.is_admin());
create policy "suggestions_admin_delete" on public.suggestions for delete
  using (public.is_admin());

-- comments
create policy "comments_select" on public.comments for select
  using (
    (content_id is not null and public.can_see_content(content_id))
    or (suggestion_id is not null and public.can_see_suggestion(suggestion_id))
  );
create policy "comments_insert" on public.comments for insert
  with check (
    author_id = auth.uid()
    and (
      (content_id is not null and public.can_see_content(content_id))
      or (suggestion_id is not null and public.can_see_suggestion(suggestion_id))
    )
  );
create policy "comments_delete" on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());

-- approvals: leitura para quem vê o conteúdo; escrita só pela função decide_approval (ou admin)
create policy "approvals_select" on public.approvals for select
  using (public.can_see_content(content_id));
create policy "approvals_admin_write" on public.approvals for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Storage: bucket privado "media"
-- Caminho: {client_id}/{content_id}/{arquivo}  ou  {client_id}/sugestoes/{arquivo}
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 52428800)
on conflict (id) do nothing;

create policy "media_objects_select" on storage.objects for select
  using (
    bucket_id = 'media'
    and (public.is_admin() or (storage.foldername(name))[1] = public.my_client_id()::text)
  );

create policy "media_objects_admin_write" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media_objects_client_suggestion_upload" on storage.objects for insert
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = public.my_client_id()::text
    and (storage.foldername(name))[2] = 'sugestoes'
  );
