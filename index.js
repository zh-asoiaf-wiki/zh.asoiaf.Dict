var program = require('commander');
program
  .version('0.0.3')
  .option('-c --category <categoryName>', 'get zh-en records for pages of <categoryName> (without "Category:" prefix)')
  .option('-a --all', 'get zh-en records for all pages')
  .option('-f --format [format]', 'set output format: [simple|json]')
  .parse(process.argv);

var bot = require('nodemw');
var fs = require('fs');
var client;

var read = function(data, res) {
  var pages = data.query.pages;
  for (var pid in pages) {
    var page = pages[pid];
    var title = page.title;
    var langlinks = page.langlinks;
    if (langlinks != undefined) {
      for (var i = 0; i < langlinks.length; ++i) {
        var lang = langlinks[i];
        if (lang.lang == 'en') {
          // TODO: check ERROR 
          res.dict[title] = lang['*'];
          break;
        }
      }
      if (res.dict[title] == undefined) {
        res.noen.push(title);
      }
    } else {
      res.noen.push(title);
    }
  }
  return res;
};

var writeFile = function(res, filename) {
  console.log('Start writing into file...');
  var lineBreak = '\r\n'; // TODO: take care of line break
  if (res.dict != undefined) {
    var out = fs.createWriteStream(filename + '.txt');
    for (var item in res.dict) {
      var line = res.dict[item] + '#' + item + lineBreak;
      out.write(line);
    }
    out.end(function() {
      console.log('Done.');
    });
  }
  if (res.noen.length != 0) {
    var out = fs.createWriteStream(filename + '-noen.txt');
    for (var i = 0; i < res.noen.length; ++i) {
      out.write(res.noen[i] + lineBreak);
    }
    out.end(function() {
      console.log('Done.');
    });
  }
  if (res.error != undefined) {
    var out = fs.createWriteStream(filename + '-error.txt');
    for (var item in res.error) {
      var line = res.error[item] + '#' + item + lineBreak;
      out.write(line);
    }
    out.end(function() {
      console.log('Done.');
    });  
  }
};

var op = function(isBot) {
  if (program.all) {
    var res = {
      'dict': {}, 
      'noen': [], 
      'error': {}
    };
    var allParams = {
      action: 'query', 
      generator: 'allpages', 
      gaplimit: (isBot) ? '1000' : '100', 
      prop: 'langlinks', 
      lllimit: (isBot) ? '5000' : '500', 
      format: 'jsonfm'
    };
    
    var callApi = function(allPagrams, callback) {
      client.api.call(allParams, callback);
    };
    var callback = function(info, next, data) {
      if (!data.query) {
        console.log('Error or warning occured, plz check parameters again.');
      } else {
        if (data['query-continue'] != undefined) {
          read(data, res);
          console.log('query-continue');
          allParams.gapfrom = data['query-continue'].allpages.gapfrom;
          callApi(allParams, callback);
        } else {
          read(data, res);
          writeFile(res, 'dict-all');
        }
      }    
    };
    callApi(allParams, callback);
  }
  if (program.category) {
    var res = {
      'dict': {}, 
      'noen': [], 
      'error': {}
    };  
    // TODO: cmcontinue
    var categoryParams = {
      action: 'query', 
      generator: 'categorymembers', 
      gcmtitle: 'Category:' + program.category, 
      gcmlimit: (isBot) ? '5000' : '500', 
      prop: 'langlinks', 
      lllimit: (isBot) ? '5000' : '500', 
      format: 'jsonfm'
    };
    
    client.api.call(categoryParams, function(info, next, data) {
      if (!data.query) {
        console.log('Error or warning occured, plz check parameters again.');
      } else {
        var dict = read(data, res);
        writeFile(dict, 'dict-' + program.category);
      }
    });
  }
};

if (fs.existsSync('config.js')) {
  client = new bot('config.js');
  isBot = true;
  console.log('Use config.js');
  
  client.logIn(function() {
    op(true);
  });
} else {
  client = new bot({
    server: 'zh.asoiaf.wikia.com', 
    path: '/', 
    debug: true
  });
  console.log('Use temp config');
  
  op(false);
}
