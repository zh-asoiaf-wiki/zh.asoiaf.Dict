var program = require('commander');
program
  .version('0.0.6')
  .option('-c --category <categoryName>', 'get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .option('-a --all', 'get zh-en records for all pages')
  .option('-f --format [format]', 'set output format: [simple|json]', 'json')
  .parse(process.argv);

var Dict = require('./dict.js');
var dict = new Dict({ 
  format: program.format, 
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
} else if (program.category) {
  dict.getCategory(program.category);
} else {
}
