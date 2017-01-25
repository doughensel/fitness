const http       = require('http'),
	  fs         = require('fs'),
	  formidable = require('formidable'),
	  users      = {
	  	count  : 0,
	  	user   : [ /* id, username, password */ ],
	  	add    : function( username, password ){
	  		this.count++;
	  		let userAccount = {
	  			id       : this.count,
	  			username : username,
	  			password : password
	  		};
	  		this.user.push( userAccount );
	  		console.log( `User Added: ${this.count} | ${username}` );
	  		this.save();
	  	},
	  	remove : function(){},
	  	find   : function( id ){
	  		let userAccount = {}
			this.user.forEach(function(u, index){
				if( u.username === id || u.id === id ){
					userAccount = u;
				}
			});
			return userAccount;
	  	},
	  	read   : function( callback ){
	  		let that = this;
	  		fs.readFile('json/users.json', 'utf8', function( err, data ){
				if( !err ){
					let json   = JSON.parse(data);
					that.user  = json.user;
					that.count = json.count;
				}
				if( typeof callback === 'function' ){
					callback();
				}
			});
	  	},
	  	save   : function( callback ){
	  		let json = JSON.stringify( { count : this.count, user : this.user } );
			fs.writeFile('json/users.json', json, 'utf8', callback );	
	  	}
	  }, // END users object
	  server     = http.createServer(function( req, res ){
		checkJSON( 'json/users.json', {count: users.count, user: users.user}, () => { users.read(); });
		if( req.method.toLowerCase() == 'get' ){
  			switch( req.url.toLowerCase() ){
  				case '/register.html':
  					displayPage( req, res, 'register.html' );
  					break;
  				default: 
  					displayPage( req, res, 'index.html' );
  			}
  		}else if( req.method.toLowerCase() == 'post' ){
  			switch( req.url.toLowerCase() ){
  				case '/register.html':
  					processForms( req, res, 'register.html' );
  					break;
  				case '/user.json':
  					processForms( req, res, 'user.json' );
  					break;
  				case '/save':
  					processForms( req, res, 'save' );
  					break;
  				default: 
  					processForms( req, res, 'index.html' );
  			}
  		}
	  	
	  }); // END server

function checkJSON( filename, obj, callback ){
	// check is users.json exists -- if not, create it
	if( !fs.existsSync(filename) ){
		let json    = JSON.stringify(obj);
		fs.writeFile(filename, json, 'utf8' );
	}/*else{
		users.read( () => { console.log( users ); } );
	}*/
	callback();
}

function displayPage( req, res, page, msg = { 'err' : '', 'success' : '' } ){
	if( !msg.err ){
		msg.err = '';
	}
	if( !msg.success ){
		msg.success = '';
	}
	fs.readFile( page, function( err, data ){
		let html = data;
		updatePage( html );
	});
	function updatePage( html ){
		html = html.toString();
		for( let key in msg ){
			let target = new RegExp( '\\${' + key.toUpperCase() + '}', 'g');
			html = html.replace( target, msg[key] );
		}
		writePage( html );
	}
	function writePage( html ){
		res.writeHead( 200, {
			'Content-Type'   : 'text/html',
			'Content-Length' : html.length
		});
		res.write( html );
		res.end();
	}
}// END displayPage()

function processForms( req, res, page ){
	let form  = new formidable.IncomingForm(),
		temp  = [];
		// get the submitted form data and save them to a temporary array
	form.on('field', function( field, value ){
		temp[field] = value;
	});
	form.on('end', evaluateFormData);
	form.on('error',( error )=>{
		console.log( `FORM ERROR: ${error}` );
	});
	form.parse(req);

	function evaluateFormData(){
		let userAccount = {};
		switch( page ){
			case 'index.html':
				userAccount = users.find( temp['username'] );
				if( Object.keys(userAccount).length > 0 ){
					if( userAccount.password === temp['password'] ){
						displayPage( req, res, 'user.html', {'success': 'Login Succesful', 'username' : temp['username'] })
					}else{
						displayPage( req, res, page, {'err': 'Incorrect password'});
					}
				}else{
					displayPage( req, res, page, {'err' : 'No user with that name'});
				}
				break;
			case 'register.html':
				userAccount = users.find( temp['regUser'] );
				if( Object.keys(userAccount).length == 0 ){
					users.add( temp['regUser'], temp['regPass'] );
					displayPage( req, res, 'user.html', {'success': 'User account created!', 'username': temp['regUser'] });
				}else{
					displayPage( req, res, page, {'err': 'Username already exists'});
				}
				break;
			case 'user.json':
				userAccount = users.find( temp['id'] );
				checkJSON( `json/user${userAccount.id}.json`, { height: '', weights: {}, entries: {} }, jsonRead );
				function jsonRead(){
			  		fs.readFile(`json/user${userAccount.id}.json`, 'utf8', function( err, data ){
						if( !err ){
							userRespond( data );
						}else{
							userRespond( '{}' );
						}
					});
				}
				function userRespond( data = {} ){
					res.writeHead(200, { 'Content-Type': 'application/json' }); 
					res.end( JSON.stringify(data) );
				}
				break;
			case 'save':

				function saveRespond( data = {} ){
					res.writeHead(200, { 'Content-Type': 'application/json' }); 
					res.end( JSON.stringify({complete: true}) );
				}
				break;
			default:
				displayPage( req, res, page, {'err': '404: Page not found'});
		}
	}// END function evaluateFormData()
}// END processForms()

server.listen(8080);
console.log('Sever listening on 8080');