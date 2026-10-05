-- Local development and test users. Never run against production (supabase db push does not seed).
-- Password for both: plantvision-dev

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'admin@plantvision.test',
    extensions.crypt('plantvision-dev', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"admin"}', '{"full_name":"Elin Andersson"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'designer@plantvision.test',
    extensions.crypt('plantvision-dev', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"designer"}', '{"full_name":"Carl Gustafsson"}',
    now(), now(), '', '', '', ''
  );

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where email in ('admin@plantvision.test', 'designer@plantvision.test');
