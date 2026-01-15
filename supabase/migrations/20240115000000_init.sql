-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  tier text default 'free'
);

create table income_settings (
  user_id uuid references profiles(id) on delete cascade not null primary key,
  monthly_amount numeric not null,
  currency text default 'GBP'
);

create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  balance numeric not null,
  include_in_available boolean default true
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  merchant_name text not null,
  date timestamptz not null
);

create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  category text not null,
  next_billing_date date not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table income_settings enable row level security;
alter table accounts enable row level security;
alter table expenses enable row level security;
alter table subscriptions enable row level security;

-- Create Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own income settings" on income_settings for select using (auth.uid() = user_id);
create policy "Users can insert own income settings" on income_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own income settings" on income_settings for update using (auth.uid() = user_id);

create policy "Users can view own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts for delete using (auth.uid() = user_id);

create policy "Users can view own expenses" on expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on expenses for delete using (auth.uid() = user_id);

create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on subscriptions for delete using (auth.uid() = user_id);
