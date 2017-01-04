const http   = require('http'),
	  fs     = require('fs'),
	  server = http.createServer(function( req, res ){
	  		displayForm(res);
	  });

function displayForm( res ){
	fs.readFile('index.html', function( err, data){
		res.writeHead(200, 
			'Content-Type' : 'text/html',
			'Content-Length' : data.length
		);
		res.write(data);
		res.end();
	});
}

server.listen(8080);
console.log("Sever listening on 8080");

// code created by following the instructions at:
// https://www.sitepoint.com/creating-and-handling-forms-in-node-js/