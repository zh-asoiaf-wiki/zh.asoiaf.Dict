var program = require('commander');
program
  .version('0.0.6')
  .option('-a --all', 'get zh-en records for all pages')  
  .option('-c --category <categoryName>', 'get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .option('-p --push [pushTitle]', 'push dict json up to wikia: [pushTitle] => MediaWiki:Common.js/dict by default')
  .option('-f --format [format]', 'set output format: [simple|json], json by default')
  .parse(process.argv);

var Dict = require('./dict.js');
var dict = new Dict({ 
  format: (program.push) 
    ? 'json' 
    : program.format || 'json', 
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

if (program.all) {
  dict.getAll();
}
if (program.category) {
  dict.getCategory(program.category);
}
if (program.push) {
  dict.push(program.push || 'MediaWiki:Common.js/dict');
}
