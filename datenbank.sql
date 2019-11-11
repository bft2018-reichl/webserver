create table benutzer (
  id  serial primary key,
  name  varchar(20),
  passwort  text
);

alter table benutzer add constraint eindeutigerName unique (name);

create table chatroom (
  id serial primary key,
  name text,
  privat boolean
)

create table ChatRoomAdmin (
  benutzer integer references benutzer(id),
  chatroom integer references chatroom(id),
  primary key(benutzer, chatroom)
);

create table ZuletztGelesen (
  benutzer integer references benutzer(id),
  chatroom integer references chatroom(id),
  letzterZugriff timestamp,
  primary key(benutzer, chatroom)
);

create table nachrichten (
  id bigserial primary key,
  text text,
  zeit timestamp,
  chatroom integer references chatroom(id)
);

alter table nachrichten add column absender integer references benutzer(id);
