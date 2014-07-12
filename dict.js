module.exports = (function() {
  var bot = require('nodemw');
  var fs = require('fs');
  
  var dict = function(options) {
    this.isBot = false;
    this.format = options.format;
    this.config = config = options.config; // api config
    if (config) {
      if (typeof config == 'string') { // use config file
        if (fs.existsSync(config)) {
          this.client = new bot(config);
          this.isBot = true; // assume bot account is always provided in config file
          console.log('Use config file [ ' + config + ' ]');
        }
      } else if (typeof config == 'object') { // use config obj
        this.client = new bot(config);
        this.isBot = true; // assume bot
        console.log('Use config via Object: ');
        console.log(config);
      }
    }
    if (this.isBot == false) { // if no config provided (no bot account)
      this.client = new bot({
        server: 'zh.asoiaf.wikia.com', 
        path: '', 
        debug: true
      });
      console.log('Use temp config');
    }
  };
    
  dict.prototype = {
    getAll: function(callback) {
      if (this.isBot) {
        if (this.isLogin !== true) {
          var that = this;
          this.client.logIn(function() {
            _getAll(that.client, that.isBot, that.format, callback);
            that.isLogin = true;
          });
          return;
        }
      }
      _getAll(this.client, this.isBot, this.format, callback);
    }, 
    getCategory: function(categoryName, callback) {
      if (this.isBot) {
        if (this.isLogin !== true) {
          var that = this;
          this.client.logIn(function() {
            _getCategory(categoryName, that.client, that.isBot, that.format, callback);
            that.isLogin = true;
          });
          return;
        }
      }
      _getCategory(categoryName, this.client, this.isBot, this.format, callback);
    }, 
    push: function(pushTitle) {
      if (fs.existsSync('dict-all.json')) {
        _push(pushTitle, this.client);
      } else {
        _getAll(this.client, this.isBot, this.format, function(res) {
          _push(pushTitle, this.client);
        });
      }
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
      lllimit: (isBot) ? '5000' : '500'
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
          if (callback) {
            callback(res);
          }
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
      lllimit: (isBot) ? '5000' : '500'
    };
    
    client.api.call(categoryParams, function(info, next, data) {
      if (!data.query) {
        console.log('Error or warning occured, plz check parameters again.');
      } else {
        read(data, res);
        writeFile(res, 'dict-' + categoryName, format);
        if (callback) {
          callback(res);
        }
      }
    });
  };

  var _push = function(pushTitle, client) {
    var content = fs.readFileSync('./dict-all.json', { encoding: 'utf-8' });
    client.edit(pushTitle, content, 'sync by zh.asoiaf.Dict.Sync', function(res) {
      console.log(res);
    });
  };
  /*
   * data: raw data get from api
   * res: dict object
   */ 
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
  /*
   * res: dict object
   */
  var writeFile = function(res, filename, format) {
    format = format || 'json';
    console.log('Start writing into file...' + format);
    var genTimestamp = function() {
      var addZero = function(num) {
        return (num < 10) ? '0' + num : '' + num;
      }
      var d = new Date();
      return '' + d.getUTCFullYear() + addZero(d.getUTCMonth() + 1) + addZero(d.getUTCDate()) 
        + addZero(d.getUTCHours()) + addZero(d.getUTCMinutes()) + addZero(d.getUTCSeconds());
    };
    var writeSimple = function() {
      var crlf = '\r\n';
      if (res.dict) {
        var content = '';
        for (var item in res.dict) {
          var line = res.dict[item] + '#' + item + crlf;
          content += line;
        }
        fs.writeFileSync(filename + '.txt', content);
        console.log(filename + '.txt, DONE.');
      }
      if (res.noen.length != 0) {
        var content = '';
        for (var i = 0; i < res.noen.length; ++i) {
          content += res.noen[i] + crlf;
        }
        fs.writeFileSync(filename + '-noen.txt', content);
        console.log(filename + '-noen.txt, DONE.');
      }          
      if (res.error) {
        var content = '';
        for (var item in res.error) {
          var line = res.error[item] + '#' + item + crlf;
          content += line;
        }
        fs.writeFileSync(filename + '-error.txt', content);
        console.log(filename + '-error.txt, DONE.');
      }
    };
    var writeJson = function() {
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
        json['__TIMESTAMP__'] = genTimestamp();
        var jsonStr = JSON.stringify(json);
        fs.writeFileSync(filename + '.json', jsonStr);
        console.log(filename + '.json DONE.');
      };
      if (res.dict) {
        var fdict = flip(res.dict); // flip dict...
        jsonOutput(fdict, filename);
      }
      if (res.noen.length != 0) {
        jsonOutput(res.noen, filename + '-noen');
      }
      if (res.error) {
        var ferror = flip(res.error);
        jsonOutput(ferror, filename + '-error');
      }        
    };
    if (format == 'simple') {
      writeSimple();
    } else if (format == 'json') {
      writeJson();
    }
  };
  
  return dict;  
}());
