-- Profiles table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'student' check (role in ('student', 'admin')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tests
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  time_limit_minutes int,
  is_public boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tests enable row level security;

create policy "Anyone can read public tests"
  on public.tests for select
  using (is_public = true);

create policy "Admins can do everything with tests"
  on public.tests for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Sections
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sections enable row level security;

create policy "Sections visible with test"
  on public.sections for select
  using (
    exists (
      select 1 from public.tests
      where tests.id = sections.test_id
        and (tests.is_public = true or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'admin'
        ))
    )
  );

create policy "Admins can manage sections"
  on public.sections for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Questions
create type public.question_type as enum (
  'multiple_choice', 'true_false', 'short_answer', 'essay'
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  question_type public.question_type not null,
  content text not null,
  explanation text,
  points int not null default 1,
  sort_order int not null default 0,
  accepted_answers text[], -- for short_answer type
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "Questions visible with section"
  on public.questions for select
  using (
    exists (
      select 1 from public.sections
      join public.tests on tests.id = sections.test_id
      where sections.id = questions.section_id
        and (tests.is_public = true or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'admin'
        ))
    )
  );

create policy "Admins can manage questions"
  on public.questions for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Answer options (for MC and TF)
create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  content text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

alter table public.answer_options enable row level security;

create policy "Options visible with question"
  on public.answer_options for select
  using (
    exists (
      select 1 from public.questions
      join public.sections on sections.id = questions.section_id
      join public.tests on tests.id = sections.test_id
      where questions.id = answer_options.question_id
        and (tests.is_public = true or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'admin'
        ))
    )
  );

create policy "Admins can manage options"
  on public.answer_options for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Attempts
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric,
  max_score numeric,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'graded'))
);

alter table public.attempts enable row level security;

create policy "Students see own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "Students can create attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create policy "Students can update own in-progress attempts"
  on public.attempts for update
  using (auth.uid() = user_id and status = 'in_progress');

create policy "Admins can see all attempts"
  on public.attempts for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update attempts"
  on public.attempts for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Responses
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text,
  selected_option_id uuid references public.answer_options(id),
  is_correct boolean,
  points_awarded numeric,
  graded_by uuid references public.profiles(id),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

alter table public.responses enable row level security;

create policy "Students see own responses"
  on public.responses for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = responses.attempt_id
        and attempts.user_id = auth.uid()
    )
  );

create policy "Students can insert own responses"
  on public.responses for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = responses.attempt_id
        and attempts.user_id = auth.uid()
        and attempts.status = 'in_progress'
    )
  );

create policy "Students can update own in-progress responses"
  on public.responses for update
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = responses.attempt_id
        and attempts.user_id = auth.uid()
        and attempts.status = 'in_progress'
    )
  );

create policy "Admins can see all responses"
  on public.responses for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update responses (grading)"
  on public.responses for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
