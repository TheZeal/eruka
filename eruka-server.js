//	curl -d opp=1 localhost:8080/game

var crypto = require('crypto');
var http = require( 'http' );
var passport = require( 'passport' );
var pg = require("pg");
var connect = require( 'connect' );
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var express = require( 'express' );
var app = express()
	.use( '/eruka', serveStatic( 'public' ) );
app.use(bodyParser.urlencoded( { extended: true } ));
app.use(passport.initialize());

var current_login = 1;

var conString = "pg://localhost:5432/eruka";
var client = new pg.Client(conString);
client.connect();

var passport_http = require('passport-http');

passport.use(new passport_http.BasicStrategy( check_user ));

var game_url = function( id )
{
	return "/game/"+id;
}

var login_url = function( id )
{
	return "/login/"+id;
}

//	We want an auth for all pages
app.all('*', passport.authenticate('basic', { session: false }) );

//	------------------------------------------------------------------------------------
//	Login
//	------------------------------------------------------------------------------------

// app.post('/login', passport.authenticate('local', { successRedirect: '/',
//                                                     failureRedirect: '/login' }));
app.get('/login',
  function(req, res) {
    // res.json({ id: req.user.id, username: req.user.username });
		res.redirect( "/eruka/eruka.html" );
  }
);

//	------------------------------------------------------------------------------------
//	Games
//	------------------------------------------------------------------------------------

// Creation of a new game
//	POST /game WITH opp=<opp_id>
//	=> { "game_id": <game_id> }
app.post( '/game', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	createGame(req.body["opp"], function( game_id ) {
		res.end( JSON.stringify( { "game": game_url( game_id ) } ));
	} );
});

//	GET /game/<game_id>
//	=> full game description
app.get( '/game/:game_id', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var game_id = req.params["game_id"];

	fetch_game( game_id, function( game )
	{
		res.end( JSON.stringify( game ));
	} );
} );

//	Lists current games for a named player [#### ugly]
//	GET /game?name=zeal
app.get( '/game', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var games = [];

	var query = client.query('select game_id from in_progress where name=$1', [req.query.name] );
	query.on("row", function (row, result)
	{
		games.push( { "game_id": row.game_id, "game": game_url( row.game_id ) } );
	});

	query.on("end", function (result)
	{
		res.end( JSON.stringify( games ) );
	});
});

//	------------------------------------------------------------------------------------
//	Logins
//	------------------------------------------------------------------------------------

//	GET /login/<login_id>
//	=> full login description
app.get( '/login/:login_id', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var login_id = req.params["login_id"];

	fetch_login( login_id, function( login )
	{
		res.end( JSON.stringify( login ));
	} );
} );



/*
app.get( '/allPlayer', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var player = [];

	var query = client.query('select * from player' );
	query.on("row", function (row, result)
	{
		player.push( row );
	});

	query.on("end", function (result)
	{
		res.end( JSON.stringify( player ) );
	});
});

app.get( '/allGame', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var game = [];

	var query = client.query('select * from game' );
	query.on("row", function (row, result)
	{
		game.push( row );
	});

	query.on("end", function (result)
	{
		res.end( JSON.stringify( game ) );
	});
});
*/
app.get( '/change', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	changeGameState( req.query.id );

	res.end( '{}' );

});

function changeGameState(game)
{
	var query = client.query('update game set state=1 where game_id=$1', [ game ]);
}

function createGame(opp, callback)
{
	var query = client.query('insert into game ( creation, state, winner, turn ) values (now(), 1, -1, 0 ) returning game_id')
	var game_id = -1;
	query.on( "row", function (row, result) { game_id = row["game_id"]; } );
	query.on( "end", function (result)
	{
		var query = client.query('insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( $1, $2, 0, 100, 10, 20, 100, 0, 0 )', [current_login, game_id]);
		query.on( "end", function() 
		{
			var query = client.query('insert into player ( login_id, game_id, player_num, initial_hp, initial_x, initial_y, hp, x, y ) values ( $1, $2, 1, 100, 10, 20, 100, 0, 0 )', [opp, game_id]);
			query.on( "end", function()
			{
				callback( game_id );
			} );
		} );
	} );
}

/*
	{
		game_id : 42,
		players: [ { login_id:23, hp:24, x:3, y:2 }, { login_id:24, hp:82, x:3, y:5 } ],
		actions: [ { } ]
	}
*/
function fetch_game( game_id, callback )
{
	fetch_players( game_id, function(players) {
		var game = {game: game_url(game_id), players: players};
		
		//	We have nothing else, for now
		callback( game );
	})
}

function fetch_players( game_id, callback )
{
	var players = []
	var query = client.query("select x,y,hp,login_id from player where game_id=$1 order by player_num",[game_id])
	query.on( "row", function (row, result)
	{
		player = {}
		player.login = login_url( row["login_id"] );
		player.x = row["x"];
		player.y = row["y"];
		player.hp = row["hp"];
		players.push(player);
	} );
	query.on( "end", function (result)
	{
		console.log(players)
		callback(players)
	});
}

//function fetch_actions( game_id,callback)

function fetch_login( login_id, callback )
{
	var login = {};
	var query = client.query("select login_id, name from login where login_id=$1",[login_id])
	query.on( "row", function (row, result)
	{
		login.login = login_url( row["login_id"] );
		login.name = row["name"];
	} );
	query.on( "end", function (result)
	{
		callback(login)
	});
}

function password_hash( password )
{
	var salt = "Eruka";
	return crypto.createHash( 'sha256' ).update( password ).update( salt ).digest( 'hex' );
}

function check_user( login_name, password, callback )
{
	// console.log( "check_user "+login_name+"/"+password );
	var found = false;
	var query = client.query("select sha256 from login where name=$1",[login_name])
	query.on( "row", function (row, result)
	{
		password_hash1 = row["sha256"];
		password_hash2 = password_hash( password );
		console.log( "HASH : ", password_hash1, password_hash2 );
		if (password_hash1===password_hash2)
			callback( null, {} );
		else
			callback( "ERROR" );
		found = true;
	} );
	query.on( "end", function (result)
	{
		if (!found)
			callback( "ERROR" );
	});
}

app.listen( 8080 );
