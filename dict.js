var bot = require('nodemw');
var fs = require('fs');

function Dict(dict) {
  this.format = dict.format;
  this.isBot = false;
  if (dict.config) {
    if (typeof dict.config == 'string') {
      if (fs.existsSync(dict.config)) {
        this.client = new bot(dict.config);
        this.isBot = true;
        console.log('Use config file [ ' + dict.config + ' ]');
      }
    } else if (typeof dict.config == 'object') {
      this.client = new bot(dict.config);
      this.isBot = true;
      console.log('Use config via Object: ');
      console.log(dict.config);
    }
  }
  if (this.isBot == false) {
    this.client = new bot({
      server: 'zh.asoiaf.wikia.com', 
      path: '', 
      debug: true
    });
    console.log('Use temp config');
  }
}

module.exports = Dict;

Dict.prototype.getAll = function() {
  if (this.isBot) {
    if (this.isLogin !== true) {
      var that = this;
      this.client.logIn(function() {
        _getAll(that.client, that.isBot, that.format);
        that.isLogin = true;
      });
    } else {
      _getAll(this.client, this.isBot, this.format);
    }
  } else {
    _getAll(this.client, this.isBot, this.format);
  }
};

Dict.prototype.getCategory = function(categoryName) {
  if (this.isBot) {
    if (this.isLogin !== true) {
      var that = this;
      this.client.logIn(function() {
        _getCategory(categoryName, that.client, that.isBot, that.format);
        that.isLogin = true;
      });
    } else {
      _getCategory(categoryName, this.client, this.isBot, this.format);
    }
  } else {
    _getCategory(categoryName, this.client, this.isBot, this.format);
  }
};

Dict.prototype.push = function(pushTitle) {
  if (fs.existsSync('dict-all.json')) {
    _push(pushTitle, this.client);
  } else {
    _getAll(this.client, this.isBot, this.format, function(res) {
      _push(pushTitle, this.client);
    });
  }
};

var _getAll = function(client, isBot, format, callback) {
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
  
  var callApi = function(allPagrams, apiCallback) {
    client.api.call(allParams, apiCallback);
  };
  var apiCallback = function(info, next, data) {
    if (!data.query) {
      console.log('Error or warning occured, plz check parameters again.');
    } else {
      if (data['query-continue'] != undefined) {
        read(data, res);
        console.log('query-continue');
        allParams.gapfrom = data['query-continue'].allpages.gapfrom;
        callApi(allParams, apiCallback);
      } else {
        read(data, res);
        writeFile(res, 'dict-all', format);
        
        callback(res);
      }
    }    
  };
  callApi(allParams, apiCallback);
};

var _getCategory = function(categoryName, client, isBot, format, callback) {
  var res = {
    'dict': {}, 
    'noen': [], 
    'error': {}
  };  
  // TODO: cmcontinue
  var categoryParams = {
    action: 'query', 
    generator: 'categorymembers', 
    gcmtitle: 'Category:' + categoryName, 
    gcmlimit: (isBot) ? '5000' : '500', 
    prop: 'langlinks', 
    lllimit: (isBot) ? '5000' : '500', 
    format: 'jsonfm'
  };
  
  client.api.call(categoryParams, function(info, next, data) {
    if (!data.query) {
      console.log('Error or warning occured, plz check parameters again.');
    } else {
      read(data, res);
      writeFile(res, 'dict-' + categoryName, format);
      
      callback(res);
    }
  });
};

var _push = function(pushTitle, client) {
  var dict = require('./dict-all.json');
  var content = JSON.stringify(dict);
  client.edit(pushTitle, content, 'sync by zh.asoiaf.Dict.Sync', function(res) {
    console.log(res);
  });
};

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

var writeFile = function(res, filename, format) {
  format = (format) ? format : 'json';
  console.log('Start writing into file...' + format);
  var genTimestamp = function() {
    var addZero = function(num) {
      return (num < 10) ? '0' + num : '' + num;
    }
    var d = new Date();
    return '' + d.getUTCFullYear() + addZero(d.getUTCMonth() + 1) + addZero(d.getUTCDate()) 
      + addZero(d.getUTCHours()) + addZero(d.getUTCMinutes()) + addZero(d.getUTCSeconds());
  };
  if (format == 'simple') {
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
  } else if (format == 'json') {
    var flip = function(o) {
      if (o) {
        var fo = {};
        for (var key in o) {
          fo[o[key]] = key;
        }
        return fo;
      }
    };
    var jsonOutput = function(json, filename) {
      var jsonStr = JSON.stringify(json);
      var out = fs.createWriteStream(filename + '.json');
      /* timestamp */
      out.write('/* generated AT ' + genTimestamp() + ' UTC */');
      out.write(jsonStr);
      out.end(function() {
        console.log('Done.');
      });
    };
    if (res.dict != undefined) {
      // flip dict...
      var fdict = flip(res.dict);
      jsonOutput(fdict, filename);
    }
    if (res.noen.length != 0) {
      jsonOutput(res.noen, filename + '-noen');
    }
    if (res.error != undefined) {
      var ferror = flip(res.error);
      jsonOutput(ferror, filename + '-error');
    }
  }
};