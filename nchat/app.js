var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    server;
 
server = http.createServer(function(req, res){
    // your normal server code
    var path = url.parse(req.url).pathname;
    switch (path){
    case '/':
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Hello! Try the <a href="/index.html">Socket.io Test</a></h1>');
        res.end();
        break;
    case '/index.html':
        fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
        res.write(data, 'utf8');
        res.end();
        });
        break;
    default: send404(res);
    }
}),
 
send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
};
 
server.listen(8080);
var sockets = {};
var users = [];
var action = {audios:[]};


var usersJoin = function(user){
	var had = false;
	for(var i=0;i<users.length;i++){
		if(user.id == users[i].id){
			users[i] = user;
			had = true;
		}
	}
	if(!had)
		users.push(user);
	
};
var usersLeft = function(socketid){
	for(var i=0;i<users.length;i++){
		if(socketid == users[i].id){
			users.splice(i,1);
			delete socket[socketid];
		}
	}
};

var usersSocket = function(userid){
	for(var i=0;i<users.length;i++){
		if(userid == users[i].id){
			return sockets[users[i].socketid];
		}
	}
	return undefined;
};


var io = require('socket.io').listen(server);


var musicPlay = function(){
	var message = {type:"audio-play"};
	if(action.audio!=undefined){
		message.type = "audio-add";
		message.data = action.audios[action.audios.length-1];
	}else{
		if(action.audios.length>0){
			action.audio = action.audios.shift();
			message.data = action.audio;
			action.audioTimeout = setTimeout(function(){
				delete action.audio;
				musicPlay();
			},(action.audio.duration+1000));
		}
	}
	if(message.data)
		io.emit("message",JSON.stringify(message));
	
	io.emit("message",JSON.stringify({type:"audio-list",data:action.audios}));
};


 

io.sockets.on('connection', function(socket){
	//sockets[socket.id] = socket;
	//console.log(socket);
	//io.emit("message",socket.id+" get in!");
    console.log("Connection " + socket.id + " accepted.");
    socket.on('message', function(message){
        console.log("Received message: " + message + " - from client " + socket.id);
		var mess = JSON.parse(message);
		switch(mess.type){
			case "user-login":
				var user = mess.data;
				user.socketid = socket.id;
				sockets[socket.id] = socket;
				usersJoin(user);
				if(action.audio!=undefined){
					var music = {type:"audio-play",data:action.audio};
					socket.emit("message",JSON.stringify(music));
				}
				var data = {type:"user-get",data:users};
				io.emit("message",JSON.stringify(data));
				
				
			break;
			case "user-get":
				var skt = sockets[socket.id];
				if(skt!=undefined){
					var data = {type:"user-get",data:users};
					skt.emit("message",JSON.stringify(data));
				}
			break;
			case "chat-all":
				io.emit("message",message);
			break;
			case "chat-to":
				var skt = usersSocket(mess.toid);
				if(skt!=undefined){
					skt.emit("message",message);
				}
			break;
			case "audio-play":
				var exits = false;
				for(var i=0;i<action.audios.length;i++){
					if(mess.data.uid == action.audios[i].uid){
						exits = true;
					}
				}
				if(!exits){
					action.audios.push(mess.data);
					musicPlay();
				}
			break;
			
			
		}
    });
	//socket.emit('message','hello world');
    socket.on('disconnect', function(){
		usersLeft(socket.id);
        console.log("Connection " + socket.id + " terminated.");
    });
});