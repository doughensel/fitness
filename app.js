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
	  	// check is users.json exists -- if not, create it
		if( !fs.existsSync('json/users.json') ){
			let json    = JSON.stringify(users);
			fs.writeFile('json/users.json', json, 'utf8' );
		}/*else{
			users.read( () => { console.log( users ); } );
		}*/
		users.read();
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
  				default: 
  					processForms( req, res, 'index.html' );
  			}
  		}
	  	
	  }); // END server

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
	form.parse(req);

	function evaluateFormData(){
		let userAccount = {};
		switch( page ){
			case 'index.html':
				userAccount = users.find( temp['username'] );
				if( Object.keys(userAccount).length > 0 ){
					if( userAccount.password === temp['password'] ){
						displayPage( req, res, 'user.html', {'err': '', 'success': 'Login Succesful', 'username' : temp['username'] })
					}else{
						displayPage( req, res, page, {'err': 'Incorrect password', 'success': ''})
					}
				}else{
					displayPage( req, res, page, {'err' : 'No user with that name', 'success' : ''});
				}
				break;
			case 'register.html':
				userAccount = users.find( temp['regUser'] );
				if( Object.keys(userAccount).length == 0 ){
					users.add( temp['regUser'], temp['regPass'] );
					displayPage( req, res, 'user.html', {'err': '', 'success': 'User account created!', 'username': temp['regUser'] });
				}else{
					displayPage( req, res, page, {'err': 'Username already exists', 'success' : ''});
				}
				break;
			default:
				displayPage( req, res, page, {'err': '404: Page not found', 'success' : ''});
		}
	}// END function evaluateFormData()
}// END processForms()

server.listen(8080);
console.log('Sever listening on 8080');