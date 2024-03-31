insert into
meetings (title)
values
('Test Meeting');

insert into
meeting_instances (id, meeting_id)
values
(1, 1);

insert into
people (meeting_id, id, name)
values
(1, 1, 'Ben'),
(1, 2, 'Chaz'),
(1, 3, 'Zack'),
(1, 4, 'Jerry'),
(1, 5, 'Jason'),
(1, 6, 'Juana'),
(1, 7, 'Luke');

insert into
updates (person_id, meeting_instance_id)
values
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1);
