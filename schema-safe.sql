-- ============================================================
-- GANHOS BRUTAIS — Schema SEGURO (pode rodar mesmo se já existir)
-- Cole no Supabase SQL Editor e clique Run
-- ============================================================

-- Enable extension
create extension if not exists "uuid-ossp";

-- ── TABLES ───────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  gender      text check (gender in ('male','female','')),
  weight      numeric(5,2),
  height      numeric(5,1),
  goal        text,
  accent_color text default '#3B82F6',
  last_gym_id  uuid,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists body_measurements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  date        date not null,
  weight      numeric(5,2),
  notes       text,
  created_at  timestamptz default now()
);

create table if not exists diet_goals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade unique,
  calories    integer default 2800,
  protein     integer default 180,
  carbs       integer default 350,
  fat         integer default 80,
  updated_at  timestamptz default now()
);

create table if not exists foods (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  name        text not null,
  calories    numeric(7,2) not null default 0,
  protein     numeric(6,2) not null default 0,
  carbs       numeric(6,2) not null default 0,
  fat         numeric(6,2) not null default 0,
  default_unit text not null default 'g',
  is_custom   boolean default true,
  created_at  timestamptz default now()
);

create table if not exists meal_plans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null default 'Minha Dieta',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists meals (
  id          uuid primary key default uuid_generate_v4(),
  plan_id     uuid not null references meal_plans(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  icon        text default '🍽️',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table if not exists meal_items (
  id            uuid primary key default uuid_generate_v4(),
  meal_id       uuid not null references meals(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  food_name     text not null,
  amount        numeric(8,2) not null default 100,
  unit          text not null default 'g',
  calories      numeric(7,2) default 0,
  protein       numeric(6,2) default 0,
  carbs         numeric(6,2) default 0,
  fat           numeric(6,2) default 0,
  sort_order    integer default 0,
  sub_group     text,
  sub_option    text,
  sub_name      text,
  sub_icon      text,
  created_at    timestamptz default now()
);

create table if not exists gyms (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  icon        text default '🏋️',
  color       text default '#3B82F6',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table if not exists workouts (
  id          uuid primary key default uuid_generate_v4(),
  gym_id      uuid not null references gyms(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  display_name text,
  day_label   text,
  color       text default '#3B82F6',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table if not exists exercises (
  id          uuid primary key default uuid_generate_v4(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  valid_sets  integer default 3,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table if not exists exercise_logs (
  id            uuid primary key default uuid_generate_v4(),
  exercise_id   uuid not null references exercises(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  log_date      date not null,
  observation   text,
  created_at    timestamptz default now(),
  unique (exercise_id, log_date)
);

create table if not exists exercise_sets (
  id          uuid primary key default uuid_generate_v4(),
  log_id      uuid not null references exercise_logs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  set_number  integer not null,
  weight      numeric(6,2),
  reps        text,
  is_pr       boolean default false,
  created_at  timestamptz default now()
);

-- Cardio: referência fixa criada por treino (igual a um exercício), com
-- posição antes/depois; cardio_logs guarda o que foi feito em cada data.
create table if not exists cardio_configs (
  id            uuid primary key default uuid_generate_v4(),
  workout_id    uuid not null references workouts(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  type          text not null default 'Personalizado',
  duration_min  integer,
  intensity     text,
  distance_km   numeric(6,2),
  calories      integer,
  notes         text,
  position      text not null default 'depois' check (position in ('antes','depois')),
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

create table if not exists cardio_logs (
  id                uuid primary key default uuid_generate_v4(),
  cardio_config_id  uuid not null references cardio_configs(id) on delete cascade,
  user_id           uuid not null references profiles(id) on delete cascade,
  log_date          date not null,
  type              text,
  duration_min      integer,
  intensity         text,
  distance_km       numeric(6,2),
  calories          integer,
  notes             text,
  created_at        timestamptz default now()
);

-- ── INDEXES ───────────────────────────────────────────────────

create index if not exists idx_body_measurements_user_date  on body_measurements(user_id, date desc);
create index if not exists idx_foods_user                   on foods(user_id);
create index if not exists idx_foods_name                   on foods(name);
create index if not exists idx_meal_plans_user              on meal_plans(user_id);
create index if not exists idx_meals_plan                   on meals(plan_id, sort_order);
create index if not exists idx_meals_user                   on meals(user_id);
create index if not exists idx_meal_items_meal              on meal_items(meal_id, sort_order);
create index if not exists idx_meal_items_user              on meal_items(user_id);
create index if not exists idx_gyms_user                    on gyms(user_id, sort_order);
create index if not exists idx_workouts_gym                 on workouts(gym_id, sort_order);
create index if not exists idx_workouts_user                on workouts(user_id);
create index if not exists idx_exercises_workout            on exercises(workout_id, sort_order);
create index if not exists idx_exercises_user               on exercises(user_id);
create index if not exists idx_exercise_logs_exercise_date  on exercise_logs(exercise_id, log_date desc);
create index if not exists idx_exercise_logs_user_date      on exercise_logs(user_id, log_date desc);
create index if not exists idx_exercise_sets_log            on exercise_sets(log_id, set_number);
create index if not exists idx_exercise_sets_user           on exercise_sets(user_id);
create index if not exists idx_cardio_configs_workout       on cardio_configs(workout_id, position, sort_order);
create index if not exists idx_cardio_configs_user          on cardio_configs(user_id);
create index if not exists idx_cardio_logs_config_date      on cardio_logs(cardio_config_id, log_date desc);
create index if not exists idx_cardio_logs_user_date        on cardio_logs(user_id, log_date desc);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table profiles           enable row level security;
alter table body_measurements  enable row level security;
alter table diet_goals         enable row level security;
alter table foods              enable row level security;
alter table meal_plans         enable row level security;
alter table meals              enable row level security;
alter table meal_items         enable row level security;
alter table gyms               enable row level security;
alter table workouts           enable row level security;
alter table exercises          enable row level security;
alter table exercise_logs      enable row level security;
alter table exercise_sets      enable row level security;
alter table cardio_configs     enable row level security;
alter table cardio_logs        enable row level security;

-- ── POLICIES (drop first to avoid "already exists" error) ────

-- profiles
drop policy if exists "Users can view own profile"   on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- body_measurements
drop policy if exists "Own measurements" on body_measurements;
create policy "Own measurements" on body_measurements for all using (auth.uid() = user_id);

-- diet_goals
drop policy if exists "Own diet goals" on diet_goals;
create policy "Own diet goals" on diet_goals for all using (auth.uid() = user_id);

-- foods
drop policy if exists "Global foods read" on foods;
drop policy if exists "Own foods write"   on foods;
drop policy if exists "Own foods update"  on foods;
drop policy if exists "Own foods delete"  on foods;
create policy "Global foods read" on foods for select using (user_id is null or auth.uid() = user_id);
create policy "Own foods write"   on foods for insert with check (auth.uid() = user_id);
create policy "Own foods update"  on foods for update using (auth.uid() = user_id);
create policy "Own foods delete"  on foods for delete using (auth.uid() = user_id);

-- meal_plans
drop policy if exists "Own meal plans" on meal_plans;
create policy "Own meal plans" on meal_plans for all using (auth.uid() = user_id);

-- meals
drop policy if exists "Own meals" on meals;
create policy "Own meals" on meals for all using (auth.uid() = user_id);

-- meal_items
drop policy if exists "Own meal items" on meal_items;
create policy "Own meal items" on meal_items for all using (auth.uid() = user_id);

-- gyms
drop policy if exists "Own gyms" on gyms;
create policy "Own gyms" on gyms for all using (auth.uid() = user_id);

-- workouts
drop policy if exists "Own workouts" on workouts;
create policy "Own workouts" on workouts for all using (auth.uid() = user_id);

-- exercises
drop policy if exists "Own exercises" on exercises;
create policy "Own exercises" on exercises for all using (auth.uid() = user_id);

-- exercise_logs
drop policy if exists "Own exercise logs" on exercise_logs;
create policy "Own exercise logs" on exercise_logs for all using (auth.uid() = user_id);

-- exercise_sets
drop policy if exists "Own exercise sets" on exercise_sets;
create policy "Own exercise sets" on exercise_sets for all using (auth.uid() = user_id);

-- cardio_configs
drop policy if exists "Own cardio configs" on cardio_configs;
create policy "Own cardio configs" on cardio_configs for all using (auth.uid() = user_id);

-- cardio_logs
drop policy if exists "Own cardio logs" on cardio_logs;
create policy "Own cardio logs" on cardio_logs for all using (auth.uid() = user_id);

-- ── FUNCTIONS & TRIGGERS ─────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at   on profiles;
drop trigger if exists meal_plans_updated_at on meal_plans;
create trigger profiles_updated_at   before update on profiles    for each row execute procedure update_updated_at();
create trigger meal_plans_updated_at before update on meal_plans  for each row execute procedure update_updated_at();

-- ── last_gym_id foreign key (add if not exists) ───────────────
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='profiles' and column_name='last_gym_id'
  ) then
    alter table profiles add column last_gym_id uuid references gyms(id) on delete set null;
  end if;
end $$;
