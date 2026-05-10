-- AI Marketing OS — supplemental SQL seed
--
-- Supabase does not reliably allow inserting into `auth.users` from SQL across hosted/local setups.
-- Run `npm run seed` to create the demo user via the Admin API and upsert the Deskbound brand + embedding.
--
-- If you already created `demo@deskbound.test` in Auth, you can manually run the INSERT below
-- (replace :user_id with the user's UUID from Authentication → Users).

-- Example (commented):
-- insert into public.brands (user_id, name, tagline, description, voice, audience, products, content_pillars, pain_points, competitors)
-- values (
--   '<USER_UUID>',
--   'Deskbound',
--   'Move better. Sit less. Think clearer.',
--   'Deskbound teaches mobility and posture for desk workers...',
--   'Direct, warm, slightly nerdy...',
--   '28–45, knowledge workers...',
--   '[{"name":"The 10-Minute Mobility Reset","type":"digital course","price":"$49","description":"..."}]'::jsonb,
--   '["micro-mobility drills","the science of why sitting wrecks you","workspace setup","habit stacking","myth-busting wellness BS"]'::jsonb,
--   '["lower back pain","tight hips","brain fog from poor circulation","expensive useless ergonomic gear"]'::jsonb,
--   '["GMB Fitness","Knees Over Toes Guy","The Ready State"]'::jsonb
-- );

select 1;
