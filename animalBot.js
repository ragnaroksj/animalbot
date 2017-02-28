var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var request = require('request');
var API500px = require('500px');
app.use(bodyParser.json());

// flint options
var config = {
  webhookUrl: 'https://animal-bot.herokuapp.com/flint',
  token: 'YTdlYTc2YzUtZDdhNi00NDc4LWI2MmEtMWZhNjkxMWUzZDUzMWQ2ZTFhZjItMjY3',
  port: process.env.PORT,
  removeWebhooksOnStart: false,
  maxConcurrent: 5,
  minTime: 50
};

var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ZDI2NmViYmQtMjM1ZS00NDJmLTlmZTctYjU0N2E1YWViOWY4ZDBhNjU5NDYtMGFi'
};

var botHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YTdlYTc2YzUtZDdhNi00NDc4LWI2MmEtMWZhNjkxMWUzZDUzMWQ2ZTFhZjItMjY3'
}


var options = {
   url: 'https://api.ciscospark.com/v1/messages',
   method: 'POST',
   headers: headers,
   form: {}
}

var pxAuthorization = {
  consumer_key: '0l6tKuYJiLIhmU4AANWkdMTtmglw6JGlQa5gFCij'
}


// init flint
var flint = new Flint(config);
flint.start();
flint.messageFormat = 'markdown';

var api500px = new API500px(pxAuthorization.consumer_key);
var imagesCollection = [];
var imagesCollectionTitle = [];
var imagesCollectionDescription = [];

flint.hears(/^animal/i, function(bot, trigger) {
  api500px.photos.getPopular({'sort': 'rating', 'rpp': '50', 'image_size': 4, 'only': 'Animals'}, function(error, result) {
    if (error) {
      return;
    }
    
    result.photos.map(function(photo) {
      imagesCollection.push({
        photoTitle: photo.name,
        photoDescription: photo.description,
        photoUrl: photo.image_url
      });
    });
    
    var rId = Math.floor(Math.random()*49);
    
    var text = (imagesCollection[rId].photoDescription !== null) ?
      imagesCollection[rId].photoTitle + '\n' + imagesCollection[rId].photoDescription :
      imagesCollection[rId].photoTitle 
    
    var form = {
      roomId: trigger.roomId,
      text: text,
      files: imagesCollection[rId].photoUrl 
    };
    
    request({
      url: options.url,
      method: 'POST',
      headers: botHeaders,
      form: form
    }, function(err,res, body){
      if (err) {
        console.log(err);
      }
    });
  });
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
  flint.debug('Flint listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});