-- psql eruka -q < createdb.sql

drop view if exists in_progress;

drop table if exists login;

create table login
(
	login_id SERIAL,
	name varchar(32) not null,
	sha256 varchar(64) not null,
	connected boolean not null
);

drop table if exists player;

create table player
(
	player_id SERIAL,
	login_id int not null,
	game_id int not null,
	player_num int not null,
	initial_hp int not null,
	initial_x int not null,
	initial_y int not null,
	hp int not null,
	x int not null,
	y int not null
);

drop table if exists game;

create table game
(
	game_id SERIAL,
	creation TIMESTAMP not null,
	turn int not null,
	state int not null,	--	0: not started, 1: in progress, 2: ended
	winner int not null-- -1: no winner
);

drop table if exists action;

create table action
(
	action_id SERIAL,
	player_id int not null,
	direction int not null,	-- 0: up, 1:right, 2:down, 3:left
	firex int not null,
	firey int not null
);

drop table if exists output;

create table output
(
	output_id SERIAL,
	action_id int not null,
	-- sequence_num int,
	type int not null, -- 0: move, 1: fire
	x int not null,
	y int not null,
	damage int null
);

insert into login( name, sha256, connected ) values ( 'zeal', 'fd147152b78f317bc96ec8837d3b53882b0b1785129d22a6891a85237445ddc8', true );
insert into login( name, sha256, connected ) values ( 'baconaro', '', true );
insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( 1, 1, 0, 100, 10, 20, 100, 10, 20 );
insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( 2, 1, 1, 100, 10, 0, 100, 10, 0 );
insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( 1, 2, 0, 100, 10, 20, 100, 10, 10 );
insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( 2, 2, 1, 100, 10, 0, 100, 10, 0 );
insert into game ( creation, state, winner, turn ) values (now(), 0, -1, 0 );
insert into game ( creation, state, winner, turn ) values (now(), 1, -1, 0 );
-- select * from login;
-- select * from player;
-- select * from game;
-- select * from action;
-- select * from output;

-- select login.login_id, name, game_id, player_num, hp, x, y from login, player where login.login_id = player.login_id
-- select login_id, name, game_id, player_num, hp, x, y from login natural join player;


create view in_progress as 
select login_id, name, game_id, player_num, hp, x, y, turn from login natural join player natural join game where state=1;

-- select * from in_progress;
