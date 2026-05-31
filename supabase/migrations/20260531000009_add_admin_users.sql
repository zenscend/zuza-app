-- Add Koketso and Winston as admins.
-- They will be auto-promoted to 'admin' on first Google sign-in.

insert into public.admin_allowlist (email, role) values
  ('koketso@zuzatech.com', 'admin'),
  ('winston@zuzatech.com',  'admin')
on conflict (email) do nothing;
