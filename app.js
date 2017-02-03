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
  				case '/save.json':
  					processForms( req, res, 'save.json' );
  					break;
  				default: 
  					processForms( req, res, 'index.html' );
  			}
  		}
	  	
	  }),
	  startWeek = new Date( 2017, 1, 5 ); 

function getWeekNum(){
	let currWeek = new Date();
	let weekNum  = (currWeek - startWeek) / 1000 / 60 / 60 / 24 / 7;
	if( weekNum < 0 ){
		weekNum = 0;
	}
	return Math.floor( weekNum );	
}

function checkJSON( filename, obj, callback ){
	// check is users.json exists -- if not, create it
	if( !fs.existsSync(filename) ){
		let json    = JSON.stringify(obj);
		fs.writeFile(filename, json, 'utf8', makeCallback );
	}else{
		makeCallback();
	}
	function makeCallback(){
		if( typeof callback === 'function' ){
			callback();
		}
	}
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
				checkJSON( `json/user${userAccount.id}.json`, {'week' : 0, 'height' : 0}, () => {
					jsonRead( userAccount.id, userRespond );
				});
				break;
			case 'save.json':
				userAccount = users.find( temp['id'] );
				checkJSON( `json/user${userAccount.id}.json`, {'week' : 0, 'height' : 0}, () => {
					jsonRead( userAccount.id, jsonUpdate );
				});
				break;
			default:
				displayPage( req, res, page, {'err': '404: Page not found'});
		}
		function jsonUpdate( accountid, data ){
			if( temp['height'] ){
				if( data.height === 0 ){
					// try to prevent user gaming of the system, they can only set height once
					data.height = temp['height'];
				}
			}
			if( temp['weight'] ){
				var currWeek = parseInt( getWeekNum() );
				// assign original weight if not present
				if( !data.original || typeof data.original != 'object' ){
					data.original = {};
				}
				if( !data.original.weight ){
					data.original = {};
					data.original.weight = temp['weight'];
				}
				if( !data.weights || typeof data.weights != 'object' ){
					data.weights = [];
				}
				
				// create or reset the week's results to reflect the weight submitted
				data.weights[currWeek] = {};
				
				// assign value for current week's weight
				data.weights[currWeek].weight = temp['weight'];
				// reward an entry record
				data.weights[currWeek].entry  = 1;
				// go through previous weights to fill out data where it may be undefined
				for( var x = currWeek; x >= 0; x-- ){
					if( !data.weights[x] || typeof data.weights[x] != 'object' ){
						data.weights[x] = {};
					}
					if( !data.weights[x].weight || data.weights[x].weight === 0 ){
						data.weights[x].weight = data.weights[x + 1].weight;
					}
				}
				// if lost 1.5 or more since last weight, reward a point
				if( data.weights[currWeek - 1 ] ){
					if( data.weights[currWeek - 1].weight - data.weights[currWeek].weight >= 1.5 ){
						data.weights[currWeek].loss = 1;
					}
				}
				// BMI
				if( !data.original.bmi ){
					// Your BMI is equal to your weight in pounds, times 704.7, divided by the square of your height in inches.
					data.original.bmi = (data.original.weight * 704.7) / (data.height * data.height);
					data.original.modBMI = data.original.bmi;
				}
				var currBMI = (data.weights[currWeek].weight * 704.7) / (data.height * data.height);
				if( data.original.modBMI - currBMI >= 1 ){
					data.weights[currWeek].bmi = 1;
					data.original.modBMI = data.original.modBMI - 1;
				}
				// add up entries
				var totalEntries = 0;
				var dwx = undefined;
				for( var x = currWeek; x >= 0; x-- ){
					dwx = data.weights[x];
					if( dwx.entry ){
						totalEntries++;
					}
					if( dwx.loss ){
						totalEntries++;
					}
					if( dwx.bmi ){
						totalEntries++;
					}
				}
				data.totalEntries = totalEntries;
			}
			let json = JSON.stringify( data );
			fs.writeFile(`json/user${accountid}.json`, json, 'utf8', () => {
				userRespond( accountid, data );
			});
		}
		function jsonRead(accountid, callback){
	  		fs.readFile(`json/user${accountid}.json`, 'utf8', function( err, data ){
	  			data = JSON.parse( data );
				if( !err ){
					data.week = getWeekNum();
					callback( accountid, data );
				}else{
					callback( accountid, '{}' );
				}
			});
		}
		function jsonWrite(){
			userRespond( {complete:true} );
		}
		function userRespond( accountid, data = {} ){
			res.writeHead(200, { 'Content-Type': 'application/json' }); 
			res.end( JSON.stringify(data) );
		}
	}// END function evaluateFormData()
}// END processForms()

server.listen(3000);
console.log('Sever listening on 3000');