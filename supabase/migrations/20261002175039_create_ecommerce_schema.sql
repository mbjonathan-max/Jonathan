/*
# Create E-Commerce Schema for Computer Hardware Store

## Overview
This migration creates a complete e-commerce database for a computer hardware store ("TechStore").
It includes customer accounts, product catalog with categories, shopping cart (via orders),
order management, payments, and invoice generation tracking.

## New Tables

### 1. profiles
Extends Supabase auth.users with customer information:
- id (uuid, FK to auth.users, PK)
- full_name (text) — customer's full name
- phone (text) — phone number
- address (text) — delivery address
- is_admin (boolean, default false) — admin flag
- created_at (timestamp)

### 2. categories
Product categories (laptops, desktops, monitors, etc.):
- id (uuid, PK)
- name (text, unique)
- slug (text, unique)
- icon (text) — lucide icon name
- created_at (timestamp)

### 3. products
Catalog of computer hardware products:
- id (uuid, PK)
- name (text)
- description (text)
- price (numeric) — price in FCFA
- stock (integer) — available quantity
- image_url (text) — product photo URL
- brand (text)
- reference (text, unique) — SKU
- specs (text) — technical specifications
- category_id (uuid, FK to categories)
- created_at (timestamp)

### 4. orders
Customer orders:
- id (uuid, PK)
- order_number (text, unique) — e.g. CMD-2026-000125
- user_id (uuid, FK to auth.users)
- total (numeric) — total amount in FCFA
- status (text) — pending/paid/preparing/shipped/delivered
- payment_method (text)
- delivery_address (text)
- created_at (timestamp)

### 5. order_items
Line items for each order:
- id (uuid, PK)
- order_id (uuid, FK to orders)
- product_id (uuid, FK to products)
- quantity (integer)
- unit_price (numeric) — price at time of purchase
- created_at (timestamp)

### 6. invoices
Invoice records for PDF generation:
- id (uuid, PK)
- invoice_number (text, unique) — e.g. FAC-2026-000125
- order_id (uuid, FK to orders)
- created_at (timestamp)

## Security (RLS)

### Profiles
- Users can read and update only their own profile.
- Admins can read all profiles.

### Categories & Products
- Public read (anon + authenticated) — catalog is browsable without login.
- Only admins can create/update/delete.

### Orders
- Users can read/create only their own orders.
- Admins can read and update all orders.

### Order Items
- Users can read items for their own orders (via parent order ownership).
- Users can create items for their own orders.
- Admins can read all order items.

### Invoices
- Users can read invoices for their own orders.
- Admins can read all invoices.

## Important Notes
1. Admin detection uses raw_app_meta_data ->> 'is_admin' via a SECURITY DEFINER function.
2. An admin user must be created via Supabase auth, then their app_metadata must set is_admin=true.
3. Order numbers are generated as CMD-YYYY-NNNNNN using a sequence.
4. Invoice numbers are generated as FAC-YYYY-NNNNNN using a sequence.
*/

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================
-- Checks if the current authenticated user is an admin by reading
-- raw_app_meta_data (user-immutable, set server-side).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- ============================================================
-- SEQUENCES for order and invoice numbers
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Monitor',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin"
ON public.categories FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin"
ON public.categories FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  reference text NOT NULL UNIQUE,
  specs text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
ON public.products FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
ON public.products FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT '',
  delivery_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_delete_own" ON public.orders;
CREATE POLICY "orders_delete_own"
ON public.orders FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

-- ============================================================
-- TABLE: invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own_or_admin" ON public.invoices;
CREATE POLICY "invoices_select_own_or_admin"
ON public.invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = invoices.order_id AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
CREATE POLICY "invoices_insert_admin"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = invoices.order_id AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);

-- ============================================================
-- SEED DATA: Categories
-- ============================================================
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Ordinateurs Portables', 'laptops', 'Laptop'),
  ('Ordinateurs de Bureau', 'desktops', 'Monitor'),
  ('Écrans', 'monitors', 'Monitor'),
  ('Claviers', 'keyboards', 'Keyboard'),
  ('Souris', 'mice', 'Mouse'),
  ('Imprimantes', 'printers', 'Printer'),
  ('Stockage', 'storage', 'HardDrive'),
  ('Mémoire RAM', 'ram', 'MemoryStick'),
  ('Cartes Graphiques', 'graphics-cards', 'Cpu'),
  ('Processeurs', 'processors', 'Cpu'),
  ('Accessoires', 'accessories', 'Cable')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: Products
-- ============================================================
INSERT INTO public.products (name, description, price, stock, image_url, brand, reference, specs, category_id) VALUES
  -- Laptops
  ('Dell XPS 15', 'Ordinateur portable 15.6 pouces, écran OLED 3.5K, ultra-fin et performant.', 850000, 12, '', 'Dell', 'REF-LT-001', 'Intel Core i7-13700H, 16GB RAM, 512GB SSD, NVIDIA RTX 4060', (SELECT id FROM public.categories WHERE slug = 'laptops')),
  ('HP Pavilion 14', 'Portable polyvalent 14 pouces pour étudiant et bureautique.', 420000, 25, '', 'HP', 'REF-LT-002', 'AMD Ryzen 5 5500U, 8GB RAM, 256GB SSD, écran IPS', (SELECT id FROM public.categories WHERE slug = 'laptops')),
  ('Lenovo ThinkPad X1 Carbon', 'Ultrabook professionnel, léger et robuste.', 1100000, 8, '', 'Lenovo', 'REF-LT-003', 'Intel Core i7-1365U, 32GB RAM, 1TB SSD, écran 14" 2.8K', (SELECT id FROM public.categories WHERE slug = 'laptops')),
  ('ASUS ROG Strix G16', 'Laptop gaming haute performance avec écran 165Hz.', 1300000, 6, '', 'ASUS', 'REF-LT-004', 'Intel Core i9-13980HX, 32GB RAM, 1TB SSD, RTX 4070', (SELECT id FROM public.categories WHERE slug = 'laptops')),

  -- Desktops
  ('PC Bureau HP ProDesk', 'Ordinateur de bureau compact pour entreprise.', 350000, 15, '', 'HP', 'REF-DT-001', 'Intel Core i5-13400, 16GB RAM, 512GB SSD', (SELECT id FROM public.categories WHERE slug = 'desktops')),
  ('Tour Lenovo IdeaCentre', 'Ordinateur de bureau familial performant.', 280000, 20, '', 'Lenovo', 'REF-DT-002', 'AMD Ryzen 5 5600G, 8GB RAM, 1TB HDD', (SELECT id FROM public.categories WHERE slug = 'desktops')),
  ('Apple iMac 24"', 'Tout-en-un avec écran Retina 4.5K, puce M3.', 1450000, 5, '', 'Apple', 'REF-DT-003', 'Apple M3, 16GB RAM, 512GB SSD, écran 24" Retina', (SELECT id FROM public.categories WHERE slug = 'desktops')),

  -- Monitors
  ('Samsung 27" 4K UHD', 'Écran 27 pouces 4K UHD, IPS, HDR10.', 220000, 18, '', 'Samsung', 'REF-MN-001', '27" 4K UHD, 60Hz, IPS, HDMI+DP, HDR10', (SELECT id FROM public.categories WHERE slug = 'monitors')),
  ('LG UltraGear 32" 165Hz', 'Écran gaming 32 pouces QHD 165Hz.', 380000, 10, '', 'LG', 'REF-MN-002', '32" QHD, 165Hz, 1ms, G-Sync, IPS', (SELECT id FROM public.categories WHERE slug = 'monitors')),
  ('Dell 24" Full HD', 'Écran professionnel 24 pouces Full HD.', 130000, 30, '', 'Dell', 'REF-MN-003', '24" Full HD, 75Hz, IPS, ajustable', (SELECT id FROM public.categories WHERE slug = 'monitors')),

  -- Keyboards
  ('Logitech MX Keys S', 'Clavier sans fil rétroéclairé, multi-appareils.', 75000, 40, '', 'Logitech', 'REF-KB-001', 'Sans fil, rétroéclairé, Bluetooth+USB, tactile', (SELECT id FROM public.categories WHERE slug = 'keyboards')),
  ('Corsair K70 RGB', 'Clavier mécanique gaming RGB.', 120000, 22, '', 'Corsair', 'REF-KB-002', 'Mécanique Cherry MX Red, RGB, USB passthrough', (SELECT id FROM public.categories WHERE slug = 'keyboards')),
  ('Keychron K2', 'Clavier mécanique sans fil 75%.', 85000, 15, '', 'Keychron', 'REF-KB-003', 'Mécanique sans fil, Bluetooth, Gateron Brown, RGB', (SELECT id FROM public.categories WHERE slug = 'keyboards')),

  -- Mice
  ('Logitech MX Master 3S', 'Souris ergonomique sans fil premium.', 65000, 35, '', 'Logitech', 'REF-MS-001', 'Sans fil, 8000 DPI, multi-appareils, silencieux', (SELECT id FROM public.categories WHERE slug = 'mice')),
  ('Razer DeathAdder V3', 'Souris gaming ergonomique haute précision.', 55000, 28, '', 'Razer', 'REF-MS-002', 'Filaire, 30000 DPI, 650 IPS, 1ms', (SELECT id FROM public.categories WHERE slug = 'mice')),
  ('Logitech G Pro X Superlight', 'Souris gaming sans fil ultra-légère.', 80000, 12, '', 'Logitech', 'REF-MS-003', 'Sans fil, 63g, 25K DPI, Hero sensor', (SELECT id FROM public.categories WHERE slug = 'mice')),

  -- Printers
  ('HP LaserJet Pro M404', 'Imprimante laser monochrome rapide.', 180000, 8, '', 'HP', 'REF-PR-001', 'Laser mono, 38 ppm, recto-verso, USB+Ethernet', (SELECT id FROM public.categories WHERE slug = 'printers')),
  ('Canon PIXMA G3420', 'Imprimante multifonction couleur à réservoir d''encre.', 130000, 14, '', 'Canon', 'REF-PR-002', 'Multifonction, couleur, réservoir, WiFi', (SELECT id FROM public.categories WHERE slug = 'printers')),
  ('Epson EcoTank ET-2850', 'Imprimante écologique multifonction.', 145000, 10, '', 'Epson', 'REF-PR-003', 'Multifonction, couleur, réservoir, WiFi, recto-verso', (SELECT id FROM public.categories WHERE slug = 'printers')),

  -- Storage
  ('Samsung 870 EVO 1TB SSD', 'SSD SATA 2.5" 1TB haute performance.', 90000, 50, '', 'Samsung', 'REF-ST-001', 'SATA 2.5", 1TB, 560 MB/s lecture, 530 MB/s écriture', (SELECT id FROM public.categories WHERE slug = 'storage')),
  ('WD Blue 2TB HDD', 'Disque dur 2TB 7200rpm.', 75000, 45, '', 'Western Digital', 'REF-ST-002', 'HDD 3.5", 2TB, 7200rpm, SATA 6Gb/s', (SELECT id FROM public.categories WHERE slug = 'storage')),
  ('Crucial NVMe 2TB', 'SSD NVMe PCIe 4.0 2TB ultra-rapide.', 165000, 20, '', 'Crucial', 'REF-ST-003', 'NVMe PCIe 4.0, 2TB, 7000 MB/s lecture', (SELECT id FROM public.categories WHERE slug = 'storage')),

  -- RAM
  ('Corsair Vengeance 16GB DDR4', 'Mémoire RAM 16GB (2x8GB) DDR4 3200MHz.', 45000, 35, '', 'Corsair', 'REF-RM-001', '16GB (2x8GB), DDR4, 3200MHz, CL16, RGB', (SELECT id FROM public.categories WHERE slug = 'ram')),
  ('Kingston Fury 32GB DDR5', 'Mémoire RAM 32GB (2x16GB) DDR5 5600MHz.', 95000, 18, '', 'Kingston', 'REF-RM-002', '32GB (2x16GB), DDR5, 5600MHz, CL40', (SELECT id FROM public.categories WHERE slug = 'ram')),
  ('G.Skill Trident Z 64GB DDR4', 'Mémoire RAM 64GB (2x32GB) DDR4 3600MHz.', 185000, 8, '', 'G.Skill', 'REF-RM-003', '64GB (2x32GB), DDR4, 3600MHz, CL18, RGB', (SELECT id FROM public.categories WHERE slug = 'ram')),

  -- Graphics Cards
  ('NVIDIA RTX 4060 8GB', 'Carte graphique NVIDIA RTX 4060 8GB GDDR6.', 380000, 10, '', 'NVIDIA', 'REF-GC-001', '8GB GDDR6, 3072 CUDA, 1830MHz boost, DLSS 3', (SELECT id FROM public.categories WHERE slug = 'graphics-cards')),
  ('AMD Radeon RX 7800 XT', 'Carte graphique AMD RX 7800 XT 16GB.', 520000, 7, '', 'AMD', 'REF-GC-002', '16GB GDDR6, 3840 Stream, 2430MHz boost, FSR 3', (SELECT id FROM public.categories WHERE slug = 'graphics-cards')),
  ('NVIDIA RTX 4090 24GB', 'Carte graphique NVIDIA RTX 4090 24GB GDDR6X.', 1600000, 3, '', 'NVIDIA', 'REF-GC-003', '24GB GDDR6X, 16384 CUDA, 2520MHz boost, DLSS 3', (SELECT id FROM public.categories WHERE slug = 'graphics-cards')),

  -- Processors
  ('Intel Core i5-13600K', 'Processeur Intel Core i5 13ème gen.', 250000, 15, '', 'Intel', 'REF-CPU-001', '14 coeurs (6P+8E), 20 threads, 3.5GHz, 5.1GHz boost', (SELECT id FROM public.categories WHERE slug = 'processors')),
  ('AMD Ryzen 7 7800X3D', 'Processeur AMD Ryzen 7 avec cache 3D V-Cache.', 380000, 12, '', 'AMD', 'REF-CPU-002', '8 coeurs, 16 threads, 4.2GHz, 5.0GHz boost, 96MB L3', (SELECT id FROM public.categories WHERE slug = 'processors')),
  ('Intel Core i9-13900K', 'Processeur Intel Core i9 13ème gen haut de gamme.', 520000, 6, '', 'Intel', 'REF-CPU-003', '24 coeurs (8P+16E), 32 threads, 3.0GHz, 5.8GHz boost', (SELECT id FROM public.categories WHERE slug = 'processors')),

  -- Accessories
  ('Support Écran Réglable', 'Support d''écran de bureau réglable en hauteur.', 18000, 40, '', 'Generic', 'REF-AC-001', 'Support métal, réglable 13-32", jusqu''à 8kg', (SELECT id FROM public.categories WHERE slug = 'accessories')),
  ('Tapis de Souris XL', 'Tapis de souris gaming grand format.', 12000, 60, '', 'Generic', 'REF-AC-002', '90x40cm, surface antidérapante, bord surpiqué', (SELECT id FROM public.categories WHERE slug = 'accessories')),
  ('Hub USB-C 7-en-1', 'Hub USB-C multiport avec HDMI, USB 3.0, SD card.', 35000, 25, '', 'Anker', 'REF-AC-003', 'USB-C, HDMI 4K, 3x USB 3.0, SD/microSD, PD 100W', (SELECT id FROM public.categories WHERE slug = 'accessories')),
  ('Webcam Logitech C920', 'Webcam HD 1080p pour visioconférence.', 45000, 20, '', 'Logitech', 'REF-AC-004', '1080p 30fps, autofocus, stereo mic, USB', (SELECT id FROM public.categories WHERE slug = 'accessories')),
  ('Casque Razer BlackShark', 'Casque gaming surround 7.1.', 75000, 15, '', 'Razer', 'REF-AC-005', 'Surround 7.1, son surround, micro cardioïde, USB+3.5mm', (SELECT id FROM public.categories WHERE slug = 'accessories'))
ON CONFLICT (reference) DO NOTHING;
