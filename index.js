/* jshint esnext: true */

var util = require('util'),
	fs = require('fs'),
	crypto = require('crypto'),
	
	Datastore = require('nedb'),
	express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	passport = require('passport'),
	twitchStrategy = require('passport-twitch').Strategy,
	
	app = express(),
	
	config = require('./config/config.json'),
	
	datastoreAlgorithm = 'aes-256-ctr',
	datastorePassword = '',
	users = new Datastore({
			filename: 'db/users.db',
			autoload: true,
			afterSerialization: encryptDatabase,
			beforeDeserialization: decryptDatabase
		});

if(fs.existsSync('./config/randombits.txt'))
	datastorePassword = fs.readFileSync('./config/randombits.txt');
else {
	datastorePassword = crypto.randomBytes(32);
	fs.writeFile('randombits.txt', datastorePassword);
}

function encryptDatabase(data) {
	var cipher = crypto.createCipher(datastoreAlgorithm, datastorePassword),
		encrypted = cipher.update(data, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return encrypted;
}
function decryptDatabase(data) {
	var decipher = crypto.createDecipher(datastoreAlgorithm, datastorePassword),
		decrypted = decipher.update(data, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

users.ensureIndex({
			fieldName: '_id',
			unique: true },
		function(err) {
				if(err) console.log('Could not set users.db index', err);
			});

app.set('views', './views')
	.set('view engine', 'ejs')
	
	.use(bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(cookieSession({ secret: config.session.secret }))
	.use(passport.initialize())
	.use(passport.session())
	.use(express.static('./public'));

passport.use(new twitchStrategy({
			clientID: config.twitch_app.client_id,
			clientSecret: config.twitch_app.client_secret,
			callbackURL: config.twitch_app.callback_URL,
			scope: config.twitch_app.scope },
		function(accessToken, refreshToken, profile, done) {
				
				var user = profile._json;
				user.auth_token = accessToken;
				
				users.findOne({ _id: user._id }, function(err, doc) {
						if(err) done(err, null);
						else if(doc === null) {
							users.insert(user, function(err, newDoc) {
									done(err, newDoc || user);
								});
						}
						else {
							users.update({ _id: user._id },
								user,
								{ upsert: true },
								function(err, numReplaced, newDoc) {
										done(err || null, newDoc || user);
									});
						}
					});
			}
	));

passport.serializeUser(function(user, done) {
		done(null, user._id);
	});
passport.deserializeUser(function(id, done) {
		users.findOne({ _id: id },
				function(err, doc) {
						if(err) done(err, null);
						else done(null, doc);
					});
	});

app
	.get('/', function(req, res) {
			res.render('index', {
					user: req.user || null,
					require });
		})
	.get('/logout', function(req, res) {
			req.logout();
			res.redirect('/');
		})
	/*.get('/logout.json', function(req, res) {
			req.logout();
			res.json({ success: true });
		})*/
	.get('/auth/twitch',
			passport.authenticate('twitch', {
					failureRedirect: '/error'
				}))
	.get('/auth/twitch/callback',
			passport.authenticate('twitch', {
					failureRedirect: '/error'
				}),
			function(req, res) {
					res.redirect('/');
				})
	.get('/error', function(req, res) {
			res.render('index', {
					user: req.user || null,
					require });
		})
	
	.listen(3000);
