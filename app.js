var express = require('express')
  , routes = require('./routes')
  , http = require('http');
 
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io').listen(server);
 
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});
 
app.configure('development', function(){
  app.use(express.errorHandler());
});


var users = [];

// app.configure(function(){
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
//   app.use(express.static(__dirname + '/public'));
// });

// app.configure('development', function(){
//   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
// });

// app.configure('production', function(){
//   app.use(express.errorHandler());
// });

app.get('/', routes.index);

app.get('/getNext/:socket', function(req, res){

  if (users.length > 1) {
    console.log(req.params.socket);

    // Remove caller from KV (no longer available)
    var userFilter = users.filter(function (user) { return user.socket == req.params.socket });
    users.splice(users.indexOf(userFilter[0]), 1); 

    // Get first available key/jid to call
    // delete user from KV (no longer available)
    var nextUser = users.shift();

    // console.log(nextUser);

    res.send({jid: nextUser.jid});

  } else {
    res.send({jid: false});
  }

});

app.get('/available', function(req, res){
  res.send({available: users.length});
});


// app.listen(process.env.PORT || 3000, function(){
// app.listen(process.env.PORT || 3000, function(){
//   console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
// });

// server.listen(process.env.PORT || 3000);



var io = require('socket.io').listen(server);

io.configure(function() {
  io.enable("browser client minification");
  io.enable("browser client etag");
  io.enable("browser client gzip");
  io.set("destroy upgrade", false);
  io.set("log level", 1);
  io.set("transports", ["websocket", "htmlfile", "xhr-polling", "jsonp-polling"]);
  // return io.set("store", new RedisStore({
  //   redisPub: pub,
  //   redisSub: sub,
  //   redisClient: store
  // }));
});

io.sockets.on("connection", function(socket) {
  socket.on("hello", function(jid) {
    users.push({socket: socket.id.toString(), jid: jid});
    io.sockets.emit("queue", users.length);
  });
  socket.on("disconnect", function() {
    var userFilter = users.filter(function (user) { return user.socket == socket.id.toString() });
    if (userFilter && userFilter.length){
      users.splice(users.indexOf(userFilter[0]), 1);      
      io.sockets.emit("queue", users.length);
    }
    // console.log("disconnected: " + socket.id.toString());
    // console.log(users);
  });
});

