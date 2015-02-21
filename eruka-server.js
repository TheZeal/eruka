//	curl -d opp=1 localhost:8080/game

var http = require( 'http' );
var pg = require("pg");
var connect = require( 'connect' );
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var express = require( 'express' );
var app = express()
	.use( '/eruka', serveStatic( 'public' ) );
app.use(bodyParser.urlencoded( { extended: true } ));

var current_login = 1;

var conString = "pg://localhost:5432/eruka";
var client = new pg.Client(conString);
client.connect();



// Creation of a new game
//	arg: opp=<opp_id>
app.post( '/game', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	createGame(req.body["opp"], function( game_id ) {
		res.end( JSON.stringify( { game_id: game_id } ));
	} );
});

//	Return a game
app.get( '/game/:game_id', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var game_id = req.params["game_id"];

	fetch_game( game_id, function( game )
	{
		res.end( JSON.stringify( game ));
	} );
} );


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

app.get( '/change', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	changeGameState( req.query.id );

	res.end( '{}' );

});

app.get( '/aGame', function( req, res )
{
	res.writeHead( 200, { 'Content-Type': 'application/json' } );

	var games = [];

	var query = client.query('select * from in_progress where game_id=$1', [req.query.number] );
	query.on("row", function (row, result)
	{
		games.push( row );
	});

	query.on("end", function (result)
	{
		res.end( JSON.stringify( games ) );
	});
});

app.listen( 8080 );

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
		var game = {game_id: game_id, players: players};
		callback( game );
	})
}

function fetch_players( game_id,callback )
{
	var players = []
	var query = client.query("select x,y,hp,login_id from player where game_id=$1 order by player_num",[game_id])
	query.on( "row", function (row, result)
	{
		player = {}
		player.login_id = row["login_id"];
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

function fetch_actions( game_id,callback)

