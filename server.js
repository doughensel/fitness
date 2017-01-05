const http       = require('http'),
	  port       = 8080,
	  fs         = require('fs'),
	  formidable = require('formidable'),
	  util       = require('util'),
	  server     = http.createServer(function( req, res ){

	  		if( req.method.toLowerCase() == 'get' ){
	  			displayLogin(res);
	  		}else if( req.method.toLowerCase() == 'post' ){
	  			processForms(req, res);
	  		}

	  });

function displayLogin( res ){

	if( !fs.existsSync('json/users.json') ){
		let users = { user: [] };
		var json = JSON.stringify(users);
		fs.writeFile('json/users.json', json, 'utf8' );
	}

	fs.readFile('index.html', function( err, data){
        res.writeHead(200, {
            'Content-Type'   : 'text/html',
            'Content-Length' : data.length
        });
		res.write(data);
		res.end();
	});

}

function processForms( req, res){

	let form  = new formidable.IncomingForm(),
		users = [],
		temp  = [];

	form.on('field', function( field, value ){
		temp[field] = value;
	});

	form.on('end', retrieveUsers);

	function retrieveUsers(){
		fs.readFile('json/users.json', 'utf8', function( err, data ){
			if( !err ){
				users = JSON.parse(data);
				checkUsers();
			}
		});
	}

	function checkUsers(){
		
		if( temp['regUser'] ){

			var msg = undefined;

			users.user.forEach(function(u){
				if( u.username === temp['regUser'] ){
					msg = {err: 'Username already in use'};
				}
			});

			if( !msg ){
				users.user.push({ id: users.user.length, username: temp['regUser'], password: temp['regPass'] });
				var json = JSON.stringify( users );
				fs.writeFile('json/users.json', json, 'utf8', dataProcessed );		
			}else{
				dataProcessed(msg);
			}
			
		}
	}

	function dataProcessed( msg ){
		fs.readFile('index.html', function( err, data){
	        res.writeHead(200, {
	            'Content-Type'   : 'text/html',
	            'Content-Length' : data.length
	        });
	        if( msg && msg.err ){
	        	console.log( msg.err );
	        }
			res.write(data);
			res.end();
		});
	}
	

	form.parse(req);

}

server.listen(port);
console.log(`Sever listening on ${port}`);

// code created by following the instructions at:
// https://www.sitepoint.com/creating-and-handling-forms-in-node-js/