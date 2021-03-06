/**
 * Module dependencies.
 */

var EVENT_TYPE_LINK = 'link';

var dataFile = require('./data/data_lite.js');

//require('./server/schema.js'); not working

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), mongoose = require('mongoose'), extend = require('mongoose-schema-extend'), passport = require("passport"), LocalStrategy = require('passport-local').Strategy,
// FacebookStrategy = require('passport-facebook').Strategy,
// TwitterStrategy = require('passport-twitter').Strategy,
hash = require("./pass").hash, flash = require("connect-flash"), ObjectID = require("./node_modules/mongoose/node_modules/mongodb").ObjectID;

var app = express();

require('./config/environment.js');
//(app, express);  working?!

app.configure(function() {
	app.set('port', process.env.PORT || 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	//  app.use(require('connect').bodyParser());
	app.use(express.methodOverride());

	app.use('/images', express.static(path.join(__dirname, 'public/images')));
	app.use('/js', express.static(path.join(__dirname, 'public/javascripts')));
	app.use('/css', express.static(path.join(__dirname, 'public/stylesheets')));
	//app.enable("jsonp callback");

	// authenticate
	app.use(express.static(path.join(__dirname, 'public')));

	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({
		secret : 'keyboard cat'
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());

	app.use(app.router);

});

//app.engine('html', require('jade').__express);
// for enabling raw html rendering
app.engine('html', require('ejs').renderFile);

app.configure('development', function() {
	app.use(express.errorHandler());
});

//app.get('/', routes.index);

/*
app.get('/', function(req, res) {

res.render('index.html');
});
*/
//   var mongodb_url = 'mongodb://heroku_app15571931:t0ac8164lheeds7i8io9ijept0@ds027308.mongolab.com:27308/heroku_app1557193';

//    var mongodb_url ='mongodb://127.0.0.1:27017/vidtest2';

//process.env.MONGOLAB_URI= 'mongodb://sepans:sepans@ds027308.mongolab.com:27308/heroku_app1557193';
process.env.MONGOLAB_URI = 'mongodb://sepans:sepans@alex.mongohq.com:10058/app15571931';
//'mongodb://heroku:29c490d2588c7ffdc4a8945f069597ca@alex.mongohq.com:10058/app15571931';

//process.env.MONGOLAB_URI = 'mongodb://127.0.0.1:27017/vidtest2';
//'mongodb://heroku:29c490d2588c7ffdc4a8945f069597ca@alex.mongohq.com:10058/app15571931';

var mongodb_url = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL;
// ||
//'mongodb://127.0.0.1:27017/vidtest2';

console.log(mongodb_url);

mongoose.connect(mongodb_url, {
	db : {
		safe : true
	}
});

// mongoose.createConnection(mongodb_url, { server: { poolSize: 4 },db: { safe: true }});

var Schema = mongoose.Schema, ObjectId = Schema.ObjectID;

var LocalUserSchema = new mongoose.Schema({
	name : String,
	email : String,
	username : String,
	salt : String,
	hash : String
});

var Users = mongoose.model('userauths', LocalUserSchema);

var VideoSchema = new Schema({
	_id : {
		type : Schema.ObjectId
	},
	title : {
		type : String,
		required : true,
		trim : true
	},
	m : {
		type : String,
		trim : true
	},
	url : {
		type : String,
		trim : true
	},
	thumbnail : {
		type : String
	},
	_owner : {
		type : Schema.ObjectId,
		ref : 'Users'
	},
	events : [{
		timestamp : Number,
		duration : Number,
		_creator : {
			type : Schema.ObjectId,
			ref : 'Users'
		},
		related_objects : [{
			_type : {
				type : String,
				required : true,
				trim : true
			},
			text : {
				type : String,
				trim : true
			},
			tags : [String]

			// for video
			,
			_related_video : {
				type : Schema.ObjectId,
				ref : 'Video'
			},
			temp_rel_video : String, // temporary for data.js files. will be removed and use _related_video
			link_entry_point : Number,
			link_relevance_value : Number

			/*
			 * evnetData['link-entry-point'] = $('entry-point').val();
			 eventData['link-relevance-value'] = $('relevance-value').val();
			 eventData['link-relevant-video']=$('#link-select .ui-selected').attr('id');
			 */

		}]
	}]
}, {
	versionKey : false,
	safe : true
});

/*
 var EventSchema = new Schema({
 timestamp   : Number
 , duration    : Number
 , related_objects : [RelatedObject]

 });
 */

/*
 var RelatedObjectSchema = new Schema({
 tags: [String]

 }, {discriminatorKey : '_type' });

 var TranscriptSchema = RelatedObjectSchema.extend({
 text:   {type: String, trim: true}
 });

 var RelatedVideoSchema = RelatedObjectSchema.extend({
 video_id:   {type: String, trim: true}
 , seek_point : Number
 , relatedness: Number
 });

 */

var Video = mongoose.model('Video', VideoSchema);

//authentication

/*
 var Event = mongoose.model('Event', VideoSchema);
 */

/*
 var RelatedObject = mongoose.model('RelatedObject', RelatedObjectSchema);
 var Transcript = mongoose.model('Transcript', TranscriptSchema);
 var RelatedVideo = mongoose.model('RelatedVideo', RelatedVideoSchema);

 */

passport.use(new LocalStrategy(function(username, password, done) {
	Users.findOne({
		username : username
	}, function(err, user) {
		if (err) {
			return done(err);
		}
		if (!user) {
			return done(null, false, {
				message : 'Incorrect username.'
			});
		}

		hash(password, user.salt, function(err, hash) {
			if (err) {
				return done(err);
			}
			if (hash == user.hash)
				return done(null, user);
			done(null, false, {
				message : 'Incorrect password.'
			});
		});
	});
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {

	Users.findById(id, function(err, user) {
		if (err)
			done(err);
		done(null, user);
	});

});

/*
 * authenticate Helpers
 */
function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect("/login");
	}
}

function userExist(req, res, next) {
	Users.count({
		username : req.body.username
	}, function(err, count) {
		if (count === 0) {
			next();
		} else {
			res.redirect("/singup");
		}
	});
}

app.get('/', isAuthenticated, function(req, res) {
	/* Video.find({}, function(error, data){
	res.json(data);
	});

	*/
	// res.render('index.html');
	res.render('index');
});
/*
 app.get('/getAllVideoInfo', function(req,res){
 Video.find({}, function(error, data){
 res.json(data);
 });
 });
 */

app.get('/getAllVideoInfo', function(req, res) {
	Video.find({}, function(error, data) {
		var jsonp = {
			'videoInfo' : data
		};
		res.json(jsonp);
	});
});

/*
 app.get('/addvideo/:title/:url', function(req, res) {
 var video_data = {
 title : req.params.title,
 url : req.params.vimeo_url
 };

 var video = new Video(video_data);

 video.save(function(error, data) {
 if (error) {
 res.json(error);
 } else {
 res.json(data);
 }
 });
 });

 */

app.get('/addallvideos', function(req, res) {

	console.log('before for');
	for (videoId in dataFile.videoInfo) {
		var videoData = dataFile.videoInfo[videoId];
		//var video = new Video(videoData);
		var video = new Video({
			title : videoData.title,
			url : videoData.url,
			//	vimeo_url : videoData.vimeo_url,
			thumbnail : videoData.thumbnail
		});
		//console.log(video);
		video.save(function(error, data) {
			if (error) {
				// res.json(error);
				console.log('error');
				console.log(error);
			} else {
				// res.json(data);
				console.log('saved');
				console.log(data);

			}
		});
	}// for(vidoId

	console.log('#### all videos loaded');

	setTimeout(function() {

		Video.findOne({
			title : 'Jean-Daniel Nicoud'
		}, function(error, video1) {
			if (error)
				console.log(error);
			console.log('--- video 1 ');
			console.log(video1);

			Video.findOne({
				title : 'Minoru Asada'
			}, function(error, video2) {
				if (error)
					console.log(error);
				console.log('--- video 2 ');
				console.log(video2);
				var event = {
					timestamp : 2,
					duration : 20,
					related_objects : [{
						text : 'a related video',
						_type : 'video',
						seek_point : 50,
						relatedness : 0.8,
						_related_video : video2
					}]
				};
				console.log('--- event ');
				console.log(event);

				video1.events.push(event);

				console.log('---- vid with new event ');
				console.log(video1);

				video1.save(function(error, data) {
					if (error) {
						console.log('error ' + error);
					} else {
						console.log('---- data ');
						console.log(data);
						res.json(data);
					}
				});
			});
		});
	}, 1000);

});

app.post('/addcomment', function(req, res) {

	var ObjectId = mongoose.Schema.Types.ObjectId;
	var iid = req.body['vid_id'];
	console.log('_id ' + iid);

	var vid_title = req.body['vid_title'];

	//Video.findOne({ '_id' : new ObjectId(iid)}, function(error, video){
	Video.findOne({
		'_id' : iid
	}, function(error, video) {
		//Video.findById(new ObjectId(iid), function(error, video){

		// searching by title for now because none of the above worked !!!!!!!

		console.log('title ' + vid_title);

		//     Video.findOne({ title : vid_title}, function(error, video){

		if (error) {
			console.log('error ' + error);
			return handleError(error);
		}
		//var video = videos[0];

		console.log('--- vid ');
		console.log(video);
		/*
		 *
		 * 	var eventData = {
		 'vid_id' : _ui_state.history[_ui_state.step - 1]._id,
		 'vid_title' : _ui_state.history[_ui_state.step - 1].title,
		 'start-time' : $('#start-time').val(),
		 'end-time' : $('#end-time').val(), //$('#text-comments').val(),
		 'event-type' : $('#event-type').val(),
		 'tags' : $('#tags').val(),
		 'text' : text_content
		 };

		 switch(eventData['event-type']) {

		 case 'link':
		 eventData['link-entry-point'] = $('#entry-point').val();
		 eventData['link-relevance-value'] = $('#relevance-value').text().replace('%','');
		 eventData['link-relevant-video']=$('#link-select .ui-selected').attr('id').replace('video_','');
		 break;
		 }
		 */

		var event = {
			timestamp : req.body['start-time'],
			duration : req.body['end-time'] - req.body['start-time'],
			_creator : req.user,
			related_objects : [{
				text : req.body['text'],
				tags : req.body['tags'],
				_type : req.body['event-type']
			}]
		};
		//console.log(event['_type'] + ' '+event['_type']==EVENT_TYPE_LINK)
		if (req.body['event-type'] == EVENT_TYPE_LINK) {
			console.log('link');
			var rel_obj = event.related_objects[0];
			rel_obj['link_relevance_value'] = req.body['link-relevance-value'];
			rel_obj['link_entry_point'] = req.body['link-entry-point'];
			Video.findOne({
				'_id' : req.body['link-relevant-video']
			}, function(error, rel_video) {
				console.log('related video from db:');
				console.log(video);
				rel_obj['_related_video'] = rel_video;

				console.log('--- event ');
				console.log(event);

				//done inline

				video.events.push(event);

				console.log('---- vid with new event ');
				//console.log(video);

				video.save(function(error, data) {
					if (error) {
						console.log('error ' + error);
						res.json(error);
					} else {
						//	console.log('---- data ');
						//	console.log(data);
						res.json(data);
					}
				});

			});

		} else {

			console.log('--- event ');
			console.log(event);

			//done inline

			video.events.push(event);

			console.log('---- vid with new event ');
			//console.log(video);

			video.save(function(error, data) {
				if (error) {
					console.log('error ' + error);
					res.json(error);
				} else {
					//	console.log('---- data ');
					//	console.log(data);
					res.json(data);
				}
			});

		}
	});

	/*   var person_data = {

	 first_name: req.params.first
	 , last_name: req.params.last
	 , username: req.params.username
	 };

	 var person = new Person(person_data);

	 person.save( function(error, data){
	 if(error){
	 res.json(error);
	 }
	 else{
	 res.json(data);
	 }
	 });
	 */
});

app.get("/login", function(req, res) {
	res.render("Login");
});

app.post("/login", passport.authenticate('local', {
	successRedirect : "/",
	failureRedirect : "/login",
}));

app.get("/signup", function(req, res) {
	res.render("signup");
});

app.post("/signup", userExist, function(req, res, next) {
	var user = new Users();
	hash(req.body.password, function(err, salt, hash) {
		if (err)
			throw err;
		var user = new Users({
			username : req.body.username,
			name : req.body.name,
			email : req.body.email,
			salt : salt,
			hash : hash,
			_id : new ObjectID
		}).save(function(err, newUser) {
			if (err)
				throw err;
			req.login(newUser, function(err) {
				if (err) {
					return next(err);
				}
				return res.redirect('/');
			});
		});
	});
});

app.post("/addVideo", function(req, res, next) {
	var video = new Video({
		title : req.body.title,
		url : req.body.url,
		//vimeo_url : req.body.url,
		thumbnail : req.body.thumbnail,
		media_type : req.body.type,
		_id : new ObjectID
	}).save(function(err, newVideo) {
		if (err) {
			throw err;
		}
		res.json(newVideo);

	});
});

app.get("/profile", isAuthenticated, function(req, res) {
	res.render("profile", {
		user : req.user
	});
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});
