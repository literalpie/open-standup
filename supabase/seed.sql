insert into
meetings (title)
values
('Test Meeting');

insert into
meeting_instances ( meeting_id)
values
(1);

insert into
people (meeting_id, name)
values
(1, 'Ben'),
(1, 'Chaz'),
(1, 'Zack'),
(1, 'Jerry'),
(1, 'Jason'),
(1, 'Juana'),
(1, 'Luke');

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
