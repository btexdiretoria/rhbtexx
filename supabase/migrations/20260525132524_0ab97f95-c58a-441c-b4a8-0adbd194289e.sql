
-- 1) Lock down storage buckets for cashflow & overtime files
UPDATE storage.buckets SET public = false WHERE id IN ('cashflow-files','overtime-files');

DROP POLICY IF EXISTS "Cashflow files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Overtime files are publicly readable" ON storage.objects;

CREATE POLICY "Authenticated can read cashflow files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cashflow-files');

CREATE POLICY "Authenticated can read overtime files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'overtime-files');

-- 2) Prevent privilege escalation on system_users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_users
    WHERE auth_user_id = auth.uid()
      AND nivel_acesso = 'Administrador'
      AND status = 'Ativo'
  );
$$;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.system_users;

CREATE POLICY "system_users select authenticated"
ON public.system_users FOR SELECT TO authenticated
USING (true);

CREATE POLICY "system_users insert admin"
ON public.system_users FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "system_users delete admin"
ON public.system_users FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "system_users update self or admin"
ON public.system_users FOR UPDATE TO authenticated
USING (public.is_admin() OR auth_user_id = auth.uid())
WITH CHECK (public.is_admin() OR auth_user_id = auth.uid());

-- Trigger blocks non-admins from changing sensitive fields on their own row
CREATE OR REPLACE FUNCTION public.system_users_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.nivel_acesso IS DISTINCT FROM OLD.nivel_acesso
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Not allowed to change privileged fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS system_users_guard_trg ON public.system_users;
CREATE TRIGGER system_users_guard_trg
BEFORE UPDATE ON public.system_users
FOR EACH ROW EXECUTE FUNCTION public.system_users_guard();

-- 3) Lock down user_section_permissions writes to admins
DROP POLICY IF EXISTS "Authenticated users full access" ON public.user_section_permissions;

CREATE POLICY "permissions select authenticated"
ON public.user_section_permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "permissions insert admin"
ON public.user_section_permissions FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "permissions update admin"
ON public.user_section_permissions FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "permissions delete admin"
ON public.user_section_permissions FOR DELETE TO authenticated
USING (public.is_admin());
