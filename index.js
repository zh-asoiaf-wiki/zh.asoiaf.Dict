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
} else {
  client = new bot({
    server: 'zh.asoiaf.wikia.com', 
    path: '/', 
    debug: true
  });
}

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
            }
          }
        }
      }
      console.log(res);
    }
  });
}




