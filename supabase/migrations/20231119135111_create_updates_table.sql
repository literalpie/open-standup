create table
  public.updates (
    meeting_instance_id bigint not null,
    person_id bigint not null,
    started_at timestamp with time zone null,
    duration integer null,
    "order" integer null,
    updated_at timestamp with time zone not null default now(),
    constraint updates_pkey primary key (meeting_instance_id, person_id),
    constraint updates_meeting_instance_id_fkey foreign key (meeting_instance_id) references meeting_instances (id) on delete cascade,
    constraint updates_person_id_fkey foreign key (person_id) references people (id) on delete cascade
  ) tablespace pg_default;

create trigger handle_updated_at before
update on updates for each row
execute function moddatetime ('updated_at');

alter publication supabase_realtime add table public.updates;