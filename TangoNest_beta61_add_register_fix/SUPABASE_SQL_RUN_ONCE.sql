-- TangoNest Beta60: No-email sync account system
-- Run this once in Supabase SQL Editor.

create table if not exists public.tangonest_sync_accounts (
  email text primary key,
  password_hash text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.tangonest_sync_accounts enable row level security;

-- Do not allow direct table access from the browser.
revoke all on table public.tangonest_sync_accounts from anon;
revoke all on table public.tangonest_sync_accounts from authenticated;

create or replace function public.tn_signup(
  p_email text,
  p_password_hash text,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_hash text;
begin
  p_email := lower(trim(p_email));

  if p_email is null or p_email = '' then
    return jsonb_build_object('ok', false, 'error', 'Email is required');
  end if;

  if p_password_hash is null or length(p_password_hash) < 20 then
    return jsonb_build_object('ok', false, 'error', 'Password hash is invalid');
  end if;

  select password_hash into existing_hash
  from public.tangonest_sync_accounts
  where email = p_email;

  if existing_hash is not null then
    if existing_hash = p_password_hash then
      update public.tangonest_sync_accounts
      set data = coalesce(p_data, data),
          updated_at = now()
      where email = p_email;

      return jsonb_build_object(
        'ok', true,
        'mode', 'existing',
        'data', (select data from public.tangonest_sync_accounts where email = p_email)
      );
    else
      return jsonb_build_object('ok', false, 'error', 'Account already exists. Use Login instead.');
    end if;
  end if;

  insert into public.tangonest_sync_accounts(email, password_hash, data)
  values (p_email, p_password_hash, coalesce(p_data, '{}'::jsonb));

  return jsonb_build_object('ok', true, 'mode', 'created', 'data', coalesce(p_data, '{}'::jsonb));
end;
$$;

create or replace function public.tn_login(
  p_email text,
  p_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data public.tangonest_sync_accounts%rowtype;
begin
  p_email := lower(trim(p_email));

  select * into row_data
  from public.tangonest_sync_accounts
  where email = p_email;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Account not found. Create account first.');
  end if;

  if row_data.password_hash <> p_password_hash then
    return jsonb_build_object('ok', false, 'error', 'Wrong password.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', row_data.email,
    'data', row_data.data,
    'updated_at', row_data.updated_at
  );
end;
$$;

create or replace function public.tn_save(
  p_email text,
  p_password_hash text,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_hash text;
begin
  p_email := lower(trim(p_email));

  select password_hash into row_hash
  from public.tangonest_sync_accounts
  where email = p_email;

  if row_hash is null then
    return jsonb_build_object('ok', false, 'error', 'Account not found.');
  end if;

  if row_hash <> p_password_hash then
    return jsonb_build_object('ok', false, 'error', 'Wrong password.');
  end if;

  update public.tangonest_sync_accounts
  set data = coalesce(p_data, '{}'::jsonb),
      updated_at = now()
  where email = p_email;

  return jsonb_build_object('ok', true, 'updated_at', now());
end;
$$;

grant usage on schema public to anon, authenticated;
grant execute on function public.tn_signup(text, text, jsonb) to anon, authenticated;
grant execute on function public.tn_login(text, text) to anon, authenticated;
grant execute on function public.tn_save(text, text, jsonb) to anon, authenticated;
