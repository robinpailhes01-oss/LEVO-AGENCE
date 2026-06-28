-- ============================================================================
-- LEVO — optional demo seed data.
-- Run AFTER schema.sql to populate the dashboard with realistic sample rows.
-- Safe to skip in production.
-- ============================================================================

insert into public.clients (name, company, niche, instagram_handle, status, monthly_fee, services)
values
  ('Atelier Dubois', 'Menuiserie Dubois', 'Artisanat', '@atelier.dubois', 'active', 890, array['Contenu','Prospection']),
  ('Studio Lumen', 'Studio Lumen Photo', 'Photographie', '@studio.lumen', 'active', 650, array['Contenu']),
  ('Cabinet Vela', 'Vela Avocats', 'Juridique', '@vela.avocats', 'paused', 1200, array['Contenu','Rapports']);

insert into public.leads (name, company, niche, location, score, status, source)
values
  ('Marc Olivier', 'Plomberie Olivier', 'Artisanat', 'Montpellier', 82, 'enriched', 'instagram'),
  ('Sophie Renard', 'Renard Coaching', 'Coaching', 'Nîmes', 74, 'contacted', 'linkedin'),
  ('Karim Benali', 'Benali Immobilier', 'Immobilier', 'Montpellier', 61, 'new', 'manual'),
  ('Claire Fontaine', 'Fontaine Fleurs', 'Commerce', 'Sète', 45, 'new', 'instagram'),
  ('Hugo Mercier', 'Mercier Fitness', 'Sport', 'Montpellier', 88, 'qualified', 'referral');

insert into public.content_calendar (title, hook, pillar, format, status)
values
  ('5 automatisations IA pour artisans', '90% des artisans perdent 1h/jour sur des tâches automatisables', 'Éducation', 'carousel', 'idea'),
  ('Comment Levo a doublé les leads de Studio Lumen', 'De 4 à 9 demandes par semaine en 30 jours', 'Preuve sociale', 'carousel', 'approved'),
  ('Le coût caché de ne pas automatiser', 'Ce que vous perdez vraiment chaque mois', 'Éducation', 'carousel', 'drafted'),
  ('3 signes que votre Instagram ne convertit pas', 'Beaucoup de likes, zéro client ?', 'Éducation', 'carousel', 'published');

insert into public.agent_logs (agent, action, summary, status)
values
  ('luna', 'a généré 4 idées de contenu', 'Thème : automatisation pour artisans', 'success'),
  ('orion', 'a enrichi Hugo Mercier (score 88)', 'Fort potentiel, décideur accessible', 'success'),
  ('hermes', 'a généré le rapport hebdomadaire', 'Rapport enregistré', 'success'),
  ('veille', 'surveille 12 comptes concurrents', null, 'info'),
  ('orion', 'réponse reçue de Sophie Renard', 'Intéressée, demande un appel', 'success');

insert into public.watched_accounts (handle, display_name, category, followers)
values
  ('@agence.rivale', 'Agence Rivale', 'Concurrent direct', 8400),
  ('@ia.business.fr', 'IA Business FR', 'Inspiration', 23100);
