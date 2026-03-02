-- Create conversions table for tracking file conversions
create table public.conversions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  file_name text not null,
  from_format text not null,
  to_format text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  output_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable row level security on conversions table
alter table public.conversions enable row level security;

-- Create policy for users to view their own conversions
create policy "Users can view own conversions"
  on conversions for select
  using (auth.uid() = user_id);

-- Create policy for users to insert their own conversions
create policy "Users can insert own conversions"
  on conversions for insert
  with check (auth.uid() = user_id);

-- Create policy for users to update their own conversions
create policy "Users can update own conversions"
  on conversions for update
  using (auth.uid() = user_id);

-- Create policy for users to delete their own conversions
create policy "Users can delete own conversions"
  on conversions for delete
  using (auth.uid() = user_id);

-- Create index for better query performance
create index idx_conversions_user_id on public.conversions(user_id);
create index idx_conversions_status on public.conversions(status);
create index idx_conversions_created_at on public.conversions(created_at);

-- Add updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for conversions table
create trigger handle_conversions_updated_at
  before update on public.conversions
  for each row execute procedure handle_updated_at();

-- Update profiles table to add new columns if they don't exist
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists notifications jsonb default '{"email": true, "conversions": true, "updates": false}'::jsonb;

-- Create storage bucket for uploads if it doesn't exist
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Create storage bucket for avatars if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create policies for uploads bucket
create policy "Users can upload to uploads"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.uid() = owner);

create policy "Users can select from uploads"
  on storage.objects for select
  using (bucket_id = 'uploads' and auth.uid() = owner);

create policy "Users can update uploads"
  on storage.objects for update
  using (bucket_id = 'uploads' and auth.uid() = owner);

create policy "Users can delete uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads' and auth.uid() = owner);

-- Create policies for avatars bucket
create policy "Users can upload to avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can select from avatars"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);