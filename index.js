var program = require('commander');
program
  .version('0.0.1')
  .option('-c --category [categoryName]', 'category title (without "Category:" prefix)')
  .option('-a --all', 'get all pages')
  .parse(process.argv);

var bot = require('nodemw');
var fs = require('fs');
var client;
if (fs.existsSync('config.js')) {
  client = new bot('config.js');
  console.log('Use config.js');
} else {
  client = new bot({
    server: 'zh.asoiaf.wikia.com', 
    path: '/', 
    debug: true
  });
  console.log('Use temp config');
}

client.logIn(function() {
  if (program.all) {
    
  }
  if (program.category) {
    var categoryParams = {
      action: 'query', 
      generator: 'categorymembers', 
      gcmtitle: 'Category:' + program.category, 
      gcmlimit: '5000', 
      prop: 'langlinks', 
      lllimit: '5000', 
      format: 'jsonfm'
    };
    client.api.call(categoryParams, function(info, next, data) {
      console.log(info);
      console.log(next);
      if (!data.query) {
        console.log('Error or warning occured, plz check parameters again.');
      } else {
        var res = {};
        var pages = data.query.pages;
        for (var pid in pages) {
          var page = pages[pid];
          var title = page.title;
          var langlinks = page.langlinks;
          if (langlinks != undefined) {
            for (var i = 0; i < langlinks.length; ++i) {
              var lang = langlinks[i];
              if (lang.lang == 'en') {
                res[title] = lang['*'];
                break;
              }
            }
          }
        }
        
        var out = fs.createWriteStream('dict-' + program.category + '.txt');
        for (var item in res) {
          var line = res[item] + '#' + item + '\r\n';
          out.write(line);
        }
        out.end(function() {
          console.log('Done.');
        });
      }
    });
  }
});





