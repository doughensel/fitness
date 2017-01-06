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

	// check is users.json exists -- if not, create it
	if( !fs.existsSync('json/users.json') ){
		let users = { count: 0, user: [] };
		var json = JSON.stringify(users);
		fs.writeFile('json/users.json', json, 'utf8' );
	}
	// load the login page & display it
	fs.readFile('index.html', function( err, data){
        res.writeHead(200, {
            'Content-Type'   : 'text/html',
            'Content-Length' : data.length
        });
		res.write(data);
		res.end();
	});

} // END function displayLogin( res )


function processForms( req, res ){

	let form  = new formidable.IncomingForm(),
		users = [],
		temp  = [];

	// get the submitted form data and save them to a temporary array
	form.on('field', function( field, value ){
		temp[field] = value;
	});

	// when the form has finished processing, jump into the json checking...
	form.on('end', retrieveUsers);

	// lookup and capture the dsata from user.json
	function retrieveUsers(){
		fs.readFile('json/users.json', 'utf8', function( err, data ){
			if( !err ){
				users = JSON.parse(data);
				checkUsers();
			}
		});
	}

	// check if the user exists for registration or login
	function checkUsers(){
		
		// checking for registration...
		// the field name 'regUser' will be passed in the registration
		if( temp['regUser'] ){

			// see if the username already exists in our users.json
			let userAccount = findUser( temp['regUser'] );

			/// if the name does not exist, process and add...
			if( Object.keys(userAccount).length == 0 ){

				// create the data, add it to our temp users object, stringify it, and write the file
				users.count++;
				users.user.push({ id: users.count, username: temp['regUser'], password: temp['regPass'] });
				var json = JSON.stringify( users );
				console.log( `User Created: ${users.count} | ${temp['regUser']}` );
				fs.writeFile('json/users.json', json, 'utf8', dataProcessed );	

			}else{
				// the username already exists. handle error(s) here
				dataProcessed({ err : 'Username already exists' });
			}

		}// END if( temp['regUser'] )

		// checking for login ...
		// the field name 'username' will be passed during the log in
		if( temp['username'] ){

			// see if the username exists
			let userAccount = findUser( temp['username'] );

			// if the username can be found, process
			if( Object.keys(userAccount).length > 0 ){
				// check is the passwords match
				if( userAccount.password === temp['pass'] ){
					dataProcessed({ success : 'SUCCESS!' });
				}else{
					// bad password error(s) handled here
					dataProcessed({ err : 'Incorrect Password' });
				}
			}else{
				// incorrect username error(rs) handled here
				dataProcessed({ err : 'No user with that name' });
			}

		}// END if( temp['username'] )

	}// END function checkUsers()

	// Helper function that runs through the temp users object to find a match
	// and return the record (if a match is found)
	function findUser( name ){
		let userAccount = {}
		users.user.forEach(function(u, index){
			if( u.username === name ){
				userAccount = u;
			}
		});
		return userAccount;
	}// END function findUser( name )

	// End function, after everything is processed...
	// TODO: A lot ;)
	function dataProcessed( msg ){
		fs.readFile('index.html', function( err, data){
	        res.writeHead(200, {
	            'Content-Type'   : 'text/html',
	            'Content-Length' : data.length
	        });
	        if( msg && msg.success ){
	        	console.log( msg.success );
	        }
	        if( msg && msg.err ){
	        	console.log( msg.err );
	        }
			res.write(data);
			res.end();
		});
	} // END function dataProcessed( msg )
	

	form.parse(req);

} // END function processForms( req, res )

server.listen(port);
console.log(`Sever listening on ${port}`);

// code created by following the instructions at:
// https://www.sitepoint.com/creating-and-handling-forms-in-node-js/