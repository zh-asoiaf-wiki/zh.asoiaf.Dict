var program = require('commander');
program
  .version('0.0.5')
  .option('-c --category <categoryName>', 'get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .option('-a --all', 'get zh-en records for all pages')
  .option('-f --format [format]', 'set output format: [simple|json]', 'json')
  .parse(process.argv);

var Dict = require('./dict.js');
var dict = new Dict({ format: program.format, config: 'config.js'});

if (program.all) {
  dict.getAll();
} else if (program.category) {
  dict.getCategory(program.category);
} else {
}
