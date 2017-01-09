const http       = require('http'),
	  port       = 8080,
	  fs         = require('fs'),
	  formidable = require('formidable'),
	  util       = require('util'),
	  express    = require('express');
	  app        = express();

app.get('/', function (req, res) {
  	// check is users.json exists -- if not, create it
	if( !fs.existsSync('json/users.json') ){
		let users = { count: 0, user: [] };
		var json = JSON.stringify(users);
		fs.writeFile('json/users.json', json, 'utf8' );
	}

	res.locals.user = 'Doug';

	// load the login page & display it
	fs.readFile('index.html', function( err, data){
        res.writeHead(200, {
            'Content-Type'   : 'text/html',
            'Content-Length' : data.length
        });
		res.write(data);
		res.end();
	});
});

app.listen(port, function () {
  console.log(`Fitness app listening on port ${port}!`);
});