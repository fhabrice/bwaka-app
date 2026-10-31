-- ===========================================================================
-- BWAKA — schéma PostgreSQL / Supabase
-- Marketplace RDC : catalogue, commandes multi-vendeurs, séquestre,
-- livraison, avis vérifiés, litiges, back-office.
--
-- À exécuter dans Supabase > SQL Editor (ou `supabase db push`).
-- Idempotent : peut être rejoué sans casser une base existante.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Référentiels
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  slug        text primary key,
  nom         text not null,
  icone       text not null default '📦',
  position    int  not null default 0
);

insert into public.categories (slug, nom, icone, position) values
  ('mode',        'Mode & habillement', '👗', 1),
  ('electronique','Électronique',       '📱', 2),
  ('alimentation','Alimentation',       '🥘', 3),
  ('maison',      'Maison & cuisine',   '🏠', 4),
  ('beaute',      'Beauté & soins',     '💅', 5),
  ('agriculture', 'Agriculture',        '🌾', 6),
  ('sport',       'Sport & loisirs',    '⚽', 7),
  ('bebe',        'Bébé & enfants',     '🧸', 8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Profils (miroir de auth.users)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('acheteur', 'vendeur', 'livreur', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nom         text not null,
  email       text not null,
  telephone   text default '',
  ville       text default 'Goma',
  role        public.user_role not null default 'acheteur',
  verifie     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.bwaka_creer_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom, email, telephone, ville, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'telephone', ''),
    coalesce(new.raw_user_meta_data->>'ville', 'Goma'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'acheteur')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.bwaka_creer_profil();

-- ---------------------------------------------------------------------------
-- 3. Boutiques
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  nom         text not null,
  slug        text not null unique,
  description text not null default '',
  ville       text not null default 'Goma',
  quartier    text not null default '',
  logo        text,
  verifie     boolean not null default false,
  note        numeric(2,1) not null default 0,
  ventes      int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);

-- ---------------------------------------------------------------------------
-- 4. Produits
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  nom            text not null,
  slug           text not null unique,
  description    text not null default '',
  prix           bigint not null check (prix > 0),          -- en francs congolais (CDF)
  devise         text not null default 'CDF',
  stock          int not null default 0 check (stock >= 0),
  categorie_slug text not null references public.categories(slug),
  ville          text not null default 'Goma',
  image          text,
  statut         text not null default 'actif' check (statut in ('actif','inactif')),
  en_avant       boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_cat_idx on public.products(categorie_slug);
create index if not exists products_ville_idx on public.products(ville);
create index if not exists products_actif_idx on public.products(statut, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Commandes & lignes
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum ('en_attente','confirmee','expediee','livree','annulee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.escrow_status as enum ('en_attente','en_sequestre','libere','rembourse');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  numero         text not null unique,
  buyer_id       uuid not null references public.profiles(id) on delete restrict,
  statut         public.order_status not null default 'en_attente',
  sequestre      public.escrow_status not null default 'en_attente',
  mode_paiement  text not null check (mode_paiement in ('m_pesa','orange_money','airtel_money','afrimoney','livraison')),
  adresse        jsonb not null,
  sous_total     bigint not null default 0,
  frais_livraison bigint not null default 0,
  commission     bigint not null default 0,
  total          bigint not null default 0,
  code_livraison text not null,
  created_at     timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index if not exists orders_statut_idx on public.orders(statut);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  store_id   uuid not null references public.stores(id) on delete restrict,
  nom        text not null,
  prix       bigint not null,
  quantite   int not null check (quantite > 0),
  image      text
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_store_idx on public.order_items(store_id);

-- ---------------------------------------------------------------------------
-- 6. Livraisons
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.delivery_status as enum ('a_attribuer','assignee','en_route','livree','echouee');
exception when duplicate_object then null; end $$;

create table if not exists public.deliveries (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  livreur_id uuid references public.profiles(id) on delete set null,
  statut     public.delivery_status not null default 'a_attribuer',
  zone       text not null default 'Centre-ville',
  tarif      bigint not null default 0,
  code       text not null,
  created_at timestamptz not null default now(),
  maj_at     timestamptz not null default now()
);
create index if not exists deliveries_livreur_idx on public.deliveries(livreur_id, statut);
create index if not exists deliveries_statut_idx on public.deliveries(statut);

-- ---------------------------------------------------------------------------
-- 7. Transactions mobile money
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  montant    bigint not null,
  operateur  text not null,
  reference  text not null,
  statut     text not null default 'en_attente' check (statut in ('en_attente','reussi','echoue','rembourse')),
  created_at timestamptz not null default now()
);
create index if not exists transactions_order_idx on public.transactions(order_id);

-- ---------------------------------------------------------------------------
-- 8. Avis vérifiés
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  auteur_id   uuid not null references public.profiles(id) on delete cascade,
  auteur_nom  text not null,
  note        int not null check (note between 1 and 5),
  commentaire text not null default '',
  created_at  timestamptz not null default now(),
  unique (product_id, auteur_id, order_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- ---------------------------------------------------------------------------
-- 9. Litiges
-- ---------------------------------------------------------------------------
create table if not exists public.disputes (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  ouvert_par uuid not null references public.profiles(id) on delete cascade,
  motif      text not null,
  statut     text not null default 'ouvert' check (statut in ('ouvert','en_cours','resolu','rejete')),
  resolution text,
  created_at timestamptz not null default now()
);
create index if not exists disputes_statut_idx on public.disputes(statut);

-- ---------------------------------------------------------------------------
-- 10. Fonctions métier (séquestre, stock, commissions)
-- ---------------------------------------------------------------------------

-- Rôle de l'utilisateur courant
create or replace function public.bwaka_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role::text from public.profiles where id = auth.uid()), 'anonyme');
$$;

-- Création d'une commande : calcule totaux, décrémente le stock, ouvre le séquestre
create or replace function public.bwaka_creer_commande(
  p_items jsonb,
  p_adresse jsonb,
  p_mode_paiement text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_sous_total bigint := 0;
  v_livraison  bigint := 2500;
  v_commission bigint;
  v_total      bigint;
  v_order      public.orders;
  v_numero     text;
  v_code       text := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  v_item       jsonb;
  v_produit    public.products;
  v_qte        int;
  v_compteur   int;
begin
  if v_uid is null then raise exception 'Connexion requise'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Votre panier est vide'; end if;
  if coalesce(p_adresse->>'nom','') = '' or coalesce(p_adresse->>'quartier','') = '' then
    raise exception 'Adresse de livraison incomplète';
  end if;
  if p_mode_paiement not in ('m_pesa','orange_money','airtel_money','afrimoney','livraison') then
    raise exception 'Moyen de paiement invalide';
  end if;

  -- contrôle du stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_produit from public.products
      where id = (v_item->>'produitId')::uuid and statut = 'actif' for update;
    if not found then raise exception 'Un produit du panier n''est plus disponible'; end if;
    v_qte := greatest(1, coalesce((v_item->>'quantite')::int, 1));
    if v_produit.stock < v_qte then
      raise exception 'Stock insuffisant pour « % » (%)', v_produit.nom, v_produit.stock;
    end if;
    v_sous_total := v_sous_total + v_produit.prix * v_qte;
  end loop;

  select count(*) + 1 into v_compteur from public.orders;
  v_numero := 'BWK-' || to_char(now(), 'YYYY') || '-' || lpad(v_compteur::text, 4, '0');
  v_livraison := case
    when p_adresse->>'quartier' in ('Gombe','Ibanda','Katindo','Lubumbashi Centre','Makiso','Diulu') then 2500
    when p_adresse->>'ville' in ('Goma','Bukavu','Kinshasa','Lubumbashi','Kisangani','Mbuji-Mayi') then 4500
    else 9000 end;
  v_commission := round(v_sous_total * 0.04);
  v_total := v_sous_total + v_livraison;

  insert into public.orders (numero, buyer_id, statut, sequestre, mode_paiement, adresse,
                             sous_total, frais_livraison, commission, total, code_livraison)
  values (v_numero, v_uid,
          case when p_mode_paiement = 'livraison' then 'en_attente' else 'confirmee' end,
          case when p_mode_paiement = 'livraison' then 'en_attente' else 'en_sequestre' end,
          p_mode_paiement, p_adresse, v_sous_total, v_livraison, v_commission, v_total, v_code)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_produit from public.products where id = (v_item->>'produitId')::uuid;
    v_qte := greatest(1, coalesce((v_item->>'quantite')::int, 1));
    insert into public.order_items (order_id, product_id, store_id, nom, prix, quantite, image)
    values (v_order.id, v_produit.id, v_produit.store_id, v_produit.nom, v_produit.prix, v_qte, v_produit.image);

    update public.products
       set stock = stock - v_qte,
           statut = case when stock - v_qte <= 0 then 'inactif' else statut end
     where id = v_produit.id;
  end loop;

  insert into public.deliveries (order_id, statut, zone, tarif, code)
  values (v_order.id, 'a_attribuer', 'Centre-ville', v_livraison, v_code);

  if p_mode_paiement <> 'livraison' then
    insert into public.transactions (order_id, montant, operateur, reference, statut)
    values (v_order.id, v_total, p_mode_paiement,
            upper(left(p_mode_paiement, 2)) || '-' || v_code, 'reussi');
  end if;

  return to_jsonb(v_order);
end $$;

-- Transition de statut (vendeur / acheteur / admin) + effets séquestre et stock
create or replace function public.bwaka_changer_statut(p_order uuid, p_statut public.order_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_role  text := public.bwaka_role();
  v_order public.orders;
  v_autorise boolean;
  v_item  record;
begin
  select * into v_order from public.orders where id = p_order or numero = p_order::text for update;
  if not found then raise exception 'Commande introuvable'; end if;

  v_autorise := v_order.buyer_id = v_uid
    or v_role = 'admin'
    or exists (
      select 1 from public.order_items oi
      join public.stores s on s.id = oi.store_id
      where oi.order_id = v_order.id and s.owner_id = v_uid
    );
  if not v_autorise then raise exception 'Accès refusé'; end if;

  if not ( (v_order.statut = 'en_attente' and p_statut in ('confirmee','annulee'))
        or (v_order.statut = 'confirmee'   and p_statut in ('expediee','annulee'))
        or (v_order.statut = 'expediee'    and p_statut = 'livree') ) then
    raise exception 'Transition impossible : % → %', v_order.statut, p_statut;
  end if;

  update public.orders set statut = p_statut,
    sequestre = case
      when p_statut = 'confirmee' then 'en_sequestre'::public.escrow_status
      when p_statut = 'livree'    then 'libere'::public.escrow_status
      when p_statut = 'annulee'   then 'rembourse'::public.escrow_status
      else sequestre end
  where id = v_order.id;

  if p_statut = 'annulee' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      update public.products
        set stock = stock + v_item.quantite,
            statut = case when statut = 'inactif' then 'actif' else statut end
      where id = v_item.product_id;
    end loop;
  end if;

  update public.deliveries set statut = case
      when p_statut = 'expediee' then 'en_route'::public.delivery_status
      when p_statut = 'livree'   then 'livree'::public.delivery_status
      when p_statut = 'annulee'  then 'echouee'::public.delivery_status
      else statut end,
    maj_at = now()
  where order_id = v_order.id;

  if p_statut = 'livree' then
    update public.stores s set ventes = ventes + 1
    where s.id in (select distinct store_id from public.order_items where order_id = v_order.id);
  end if;
end $$;

-- Attribution d'une course à un livreur
create or replace function public.bwaka_assigner_livraison(p_delivery uuid, p_livreur uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if p_livreur <> auth.uid() and public.bwaka_role() <> 'admin' then
    raise exception 'Accès refusé';
  end if;
  update public.deliveries
     set livreur_id = p_livreur, statut = 'assignee', maj_at = now()
   where id = p_delivery and statut = 'a_attribuer';
  if not found then raise exception 'Mission déjà prise'; end if;
end $$;

-- Avancement d'une course par le livreur assigné
create or replace function public.bwaka_avancer_livraison(p_delivery uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_d public.deliveries;
begin
  select * into v_d from public.deliveries where id = p_delivery for update;
  if not found then raise exception 'Livraison introuvable'; end if;
  if v_d.livreur_id <> auth.uid() and public.bwaka_role() <> 'admin' then
    raise exception 'Accès refusé';
  end if;

  if p_action = 'demarrer' then
    update public.deliveries set statut = 'en_route', maj_at = now() where id = v_d.id;
    perform public.bwaka_changer_statut(v_d.order_id, 'expediee');
  elsif p_action = 'livrer' then
    update public.deliveries set statut = 'livree', maj_at = now() where id = v_d.id;
    perform public.bwaka_changer_statut(v_d.order_id, 'livree');
  else
    raise exception 'Action inconnue';
  end if;
end $$;

-- Mise à jour de la note d'une boutique après un avis
create or replace function public.bwaka_maj_note_boutique()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.stores s
     set note = coalesce((select round(avg(note)::numeric, 1) from public.reviews where store_id = new.store_id), 0)
   where s.id = new.store_id;
  return new;
end $$;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.bwaka_maj_note_boutique();

-- ---------------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.stores       enable row level security;
alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.deliveries   enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews      enable row level security;
alter table public.disputes     enable row level security;
alter table public.categories   enable row level security;

-- Référentiel public
drop policy if exists "categories lecture" on public.categories;
create policy "categories lecture" on public.categories for select using (true);

-- Profils : chacun voit et modifie le sien, l'admin voit tout
drop policy if exists "profil lecture" on public.profiles;
create policy "profil lecture" on public.profiles for select
  using (id = auth.uid() or public.bwaka_role() = 'admin');

drop policy if exists "profil mise a jour" on public.profiles;
create policy "profil mise a jour" on public.profiles for update
  using (id = auth.uid() or public.bwaka_role() = 'admin');

-- Boutiques : lecture publique, écriture par le propriétaire
drop policy if exists "boutiques lecture" on public.stores;
create policy "boutiques lecture" on public.stores for select using (true);

drop policy if exists "boutiques creation" on public.stores;
create policy "boutiques creation" on public.stores for insert
  with check (owner_id = auth.uid());

drop policy if exists "boutiques maj" on public.stores;
create policy "boutiques maj" on public.stores for update
  using (owner_id = auth.uid() or public.bwaka_role() = 'admin');

-- Produits : lecture des produits actifs, gestion par le propriétaire de la boutique
drop policy if exists "produits lecture" on public.products;
create policy "produits lecture" on public.products for select using (true);

drop policy if exists "produits creation" on public.products;
create policy "produits creation" on public.products for insert
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

drop policy if exists "produits maj" on public.products;
create policy "produits maj" on public.products for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
         or public.bwaka_role() = 'admin');

drop policy if exists "produits suppression" on public.products;
create policy "produits suppression" on public.products for delete
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
         or public.bwaka_role() = 'admin');

-- Commandes : acheteur, vendeurs concernés, livreur assigné, admin
drop policy if exists "commandes lecture" on public.orders;
create policy "commandes lecture" on public.orders for select
  using (
    buyer_id = auth.uid()
    or public.bwaka_role() = 'admin'
    or exists (select 1 from public.order_items oi join public.stores s on s.id = oi.store_id
               where oi.order_id = orders.id and s.owner_id = auth.uid())
    or exists (select 1 from public.deliveries d where d.order_id = orders.id and d.livreur_id = auth.uid())
  );

drop policy if exists "lignes lecture" on public.order_items;
create policy "lignes lecture" on public.order_items for select
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
    or public.bwaka_role() = 'admin'
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.deliveries d where d.order_id = order_items.order_id and d.livreur_id = auth.uid())
  );

-- Livraisons : missions libres visibles par les livreurs, détail par les concernés
drop policy if exists "livraisons lecture" on public.deliveries;
create policy "livraisons lecture" on public.deliveries for select
  using (
    statut = 'a_attribuer'
    or livreur_id = auth.uid()
    or public.bwaka_role() = 'admin'
    or exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
    or exists (select 1 from public.order_items oi join public.stores s on s.id = oi.store_id
               where oi.order_id = deliveries.order_id and s.owner_id = auth.uid())
  );

-- Transactions : acheteur et admin
drop policy if exists "transactions lecture" on public.transactions;
create policy "transactions lecture" on public.transactions for select
  using (public.bwaka_role() = 'admin'
         or exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- Avis : lecture publique, création par les acheteurs livrés
drop policy if exists "avis lecture" on public.reviews;
create policy "avis lecture" on public.reviews for select using (true);

drop policy if exists "avis creation" on public.reviews;
create policy "avis creation" on public.reviews for insert
  with check (
    auteur_id = auth.uid()
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.buyer_id = auth.uid()
        and o.statut = 'livree'
        and oi.product_id = reviews.product_id
        and (reviews.order_id is null or o.id = reviews.order_id)
    )
  );

-- Litiges : ouverture et lecture par l'acheteur, vendeur concerné et admin
drop policy if exists "litiges lecture" on public.disputes;
create policy "litiges lecture" on public.disputes for select
  using (
    ouvert_par = auth.uid()
    or public.bwaka_role() = 'admin'
    or exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
    or exists (select 1 from public.order_items oi join public.stores s on s.id = oi.store_id
               where oi.order_id = disputes.order_id and s.owner_id = auth.uid())
  );

drop policy if exists "litiges creation" on public.disputes;
create policy "litiges creation" on public.disputes for insert
  with check (ouvert_par = auth.uid());

drop policy if exists "litiges maj admin" on public.disputes;
create policy "litiges maj admin" on public.disputes for update
  using (public.bwaka_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 12. Droits d'exécution des fonctions métier
-- ---------------------------------------------------------------------------
grant execute on function public.bwaka_creer_commande(jsonb, jsonb, text) to authenticated;
grant execute on function public.bwaka_changer_statut(uuid, public.order_status) to authenticated;
grant execute on function public.bwaka_assigner_livraison(uuid, uuid) to authenticated;
grant execute on function public.bwaka_avancer_livraison(uuid, text) to authenticated;
grant execute on function public.bwaka_role() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 13. Stockage des images produits
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produits', 'produits', true)
on conflict (id) do nothing;

drop policy if exists "images produits lecture" on storage.objects;
create policy "images produits lecture" on storage.objects for select
  using (bucket_id = 'produits');

drop policy if exists "images produits depot" on storage.objects;
create policy "images produits depot" on storage.objects for insert
  to authenticated with check (bucket_id = 'produits');

-- ---------------------------------------------------------------------------
-- 14. Vue de notation agrégée (facilite le catalogue)
-- ---------------------------------------------------------------------------
create or replace view public.v_produits_notes as
select p.id as product_id,
       coalesce(round(avg(r.note)::numeric, 1), 0) as note_moyenne,
       count(r.id) as nombre_avis
from public.products p
left join public.reviews r on r.product_id = p.id
group by p.id;

grant select on public.v_produits_notes to anon, authenticated;
