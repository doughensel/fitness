const http       = require('http'),
	  fs         = require('fs'),
	  formidable = require('formidable'),
	  users      = {
	  	count  : 0,
	  	user   : {
	  		// id | username | password
	  	},
	  	add    : function( username, password ){
	  		this.count++;
	  		let userAccount = {
	  			id       : this.count,
	  			username : username,
	  			password : password
	  		};
	  		this.user.push( userAccount );
	  		console.log( `User Added: ${this.count} | ${password}` );
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
				callback();
			});
	  	},
	  	save   : function( callback ){
	  		let json = JSON.stringify( { count : this.count, user : this.user } );
			fs.writeFile('json/users.json', json, 'utf8', callback );	
	  	}
	  },
	  server     = http.createServer(function( req, res ){
	  	// check is users.json exists -- if not, create it
		if( !fs.existsSync('json/users.json') ){
			let json    = JSON.stringify(users);
			fs.writeFile('json/users.json', json, 'utf8' );
		}else{
			users.read( () => { console.log( users ); } );
		}
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
	  	
	  });

function displayPage( req, res, page, msg = { 'err' : '', 'success' : '' } ){
	fs.readFile( page, function( err, data ){
		res.writeHead( 200, {
			'Content-Type'   : 'text/html',
			'Content-Length' : data.length
		});
		let html = data.toString().replace( '${ERROR}', msg.err ).replace( '${SUCCESS}', msg.success );
		res.write( data );
		res.end();
	});
}// END displayPage()

server.listen(8080);
console.log('Sever listening on 8080');