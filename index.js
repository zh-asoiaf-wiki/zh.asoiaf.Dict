var program = require('commander');
program
  .version('0.0.2')
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

client.logIn(function() {
  if (program.all) {
    var res = {
      'dict': {}, 
      'noen': [], 
      'error': {}
    };
    var allParams = {
      action: 'query', 
      generator: 'allpages', 
      gaplimit: '1000', 
      prop: 'langlinks', 
      lllimit: '5000', 
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
      gcmlimit: '5000', 
      prop: 'langlinks', 
      lllimit: '5000', 
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
});
