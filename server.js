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
		var json = JSON.stringify({ users: [] });
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
	let form = new formidable.IncomingForm(),
		users;
	fs.readFile('json/users.json', 'utf8', function( err, data ){
		if( err ){
			console.log( err );
		}else{
			users = JSON.parse(data);
		}
	});

	console.log( users );

	form.parse( req, function( err, fields, files ){
		// Store the data from the fields in your data store.  The data could be a file
		// or database or any other store based on the application.
		res.writeHead(200, {
			'Content-Type' : 'text/plain'
		});
		res.write('received the data: \n\n');
		res.end(util.inspect({
			fields: fields,
			files : files
		}));

	});

}

server.listen(port);
console.log(`Sever listening on ${port}`);

// code created by following the instructions at:
// https://www.sitepoint.com/creating-and-handling-forms-in-node-js/