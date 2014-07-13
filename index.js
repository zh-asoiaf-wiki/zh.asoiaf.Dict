var Dict = require('./dict.js');
var init = function() {
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
  return dict;
};
var dict = {};
var program = require('commander');
program
  .command('all')
  .description('get zh-en records for all pages')
  .action(function() {
    dict = init();
    dict.getAll(function() {
      console.log('[getAll] FINISH.');
    });
  });
program
  .command('category <categoryName>')
  .description('get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .action(function(categoryName) {
    dict = init();
    dict.getCategory(categoryName, function() {
      console.log('[getCategory] FINISH.');
    });
  });
program
  .command('push [pushTitle]')
  .description('push dict json up to wiki: MediaWiki/Common.js/dict by default')
  .action(function(pushTitle) {
    dict = init();
    pushTitle = pushTitle || 'MediaWiki/Common.js/dict';
    dict.push(pushTitle, function() {
      console.log('[push] FINISH.');
    });
  });
program
  .version('0.0.9')
  .parse(process.argv);
