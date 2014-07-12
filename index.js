var Dict = require('./dict.js');
var dict = new Dict({ 
  format: 'json', // and json only, ready to deprecate 'simple'
  /* either not set, */
  /* or */
  /* config: 'config.js' */
  /* or */
  config: {
    "server": "zh.asoiaf.wikia.com", 
    "path": "", 
    "username": process.env.BOT_USERNAME, 
    "password": process.env.BOT_PASSWORD, 
    "userAgent": "zh.asoiaf.Dict", 
    "debug": true
  }
});

var program = require('commander');
program
  .command('all')
  .description('get zh-en records for all pages')
  .action(function() {
    dict.getAll(function() {
      console.log('getAll, FINISH.');
    });
  });
program
  .command('category <categoryName>')
  .description('get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .action(function(categoryName) {
    dict.getCategory(categoryName, function() {
      console.log('getCategory, FINISH.');
    });
  });
program
  .command('push [pushTitle]')
  .description('push dict json up to wiki: 冰与火之歌:Dict by default')
  .action(function(pushTitle) {
    pushTitle = pushTitle || '冰与火之歌:Dict';
    dict.push(pushTitle);
  });
program
  .version('0.0.8')
  .parse(process.argv);
