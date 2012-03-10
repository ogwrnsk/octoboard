(function (exports) {
  
  var diff = exports.gdbd.diff;
  var issue = exports.gdbd.issue;
  
  var LABEL_CLASS = 'gdbd-cursor';
  
  
  var Alert = function (element) {
    this.element = element;
  };
  
  Alert.prototype = {
    _next: null,
    _nextElement: null,
    _prev: null,
    _prevElement: null,
    _content: null,
    
    next: function (callback) {
      if (this._next) {
        callback(this._next)
        return;
      }
      
      if (!this._nextElement) {
        this._nextElement = this.element.next();
      }
      else {
        this._nextElement = this._nextElement.next();
      }
      
      if (this._nextElement.length === 0) {
        this._nextElement = null;
        callback(null); // no more alert
        return;
      }
      
      var type = this.type(this._nextElement);
      if (type === 'push') {
        this._next = new Alert(this._nextElement);
        this._next._prev = this;
        callback(this._next)
        return;
      }
      else if (type === 'issue') {
        this._next = new Alert(this._nextElement);
        this._next._prev = this;
        callback(this._next)
        return;
      }
      else {
        var _this = this;
        setTimeout(function () {
            _this.next(callback);
        }, 0);
        return;
      }
    },
    
    prev: function (callback) {
      if (this._prev) {
        callback(this._prev)
        return;
      }
      
      if (!this._prevElement) {
        this._prevElement = this.element.prev();
      }
      else {
        this._prevElement = this._prevElement.prev();
      }
      
      if (this._prevElement.length === 0) {
        this._prevElement = null;
        callback(null); // no more alert
        return;
      }
      
      var type = this.type(this._prevElement);
      if (type === 'push') {
        this._prev = new Alert(this._prevElement);
        this._prev._next = this;
        callback(this._prev)
        return;
      }
      else if (type === 'issue') {
        this._prev = new Alert(this._prevElement);
        this._prev._next = this;
        callback(this._prev)
        return;
      }
      else {
        var _this = this;
        setTimeout(function () {
            _this.prev(callback);
        }, 0);
        return;
      }
    },
    
    type: function(element) {
      if (!element) {
        element = this.element;
      }
      
      if (element.hasClass('push')) {
        return 'push';
      }
      else if (element.hasClass('issues_opened')) {
        return 'issue';
      }
      else if (element.hasClass('issues_comment')) {
        var url = $(element.find('.title a').get(1)).attr('href');
        if (url.lastIndexOf('http') === 0 ) { // the case of not relative path
          return 'issue';
        }
      }
      return 'other'; // default
    },
    
    get content() {
      if (this._content) {
        return this._content;
      }
      
      if (this.type() === 'push') {
        var content = this.element.find('.commits ul').children();
        var more = false;
        content.each(function (idx, commit) {
          if ($(commit).hasClass('more')) {
            more = true;
          }
        });
        if (more) {
          content = content.splice(0, content.length-1); // remove 'more'
        }
        this._content = content;
      }
      else if (this.type() === 'issue') {
        var content = this.element.find('.message p');
        if (content.length !== 1) {
          content = this.element.find('.message blockquote');
        }
        this._content = content;
      }
      return this._content;
    }
  };

  var Cursor = function () {
  };
  
  Cursor.prototype = {
    _currentAlert: null,
    _currentContentIndex: -1,
    
    next: function (callback) {
      if (!this._currentAlert) { // first time
        this._currentAlert = new Alert($('.news').children().first());
        if (this._currentAlert.type() === 'other') {
          var _this = this;
          this._currentAlert.next(function (nextAlert) {
            if(!nextAlert) {
              callback(null); // end of alert
              return;
            }
            _this._currentAlert = nextAlert;
            _this.next(callback);
          });
          return;
        }
      }
      
      // check content
      var element = this._currentAlert.content[this._currentContentIndex + 1];
      if (element) {
        this._currentContentIndex++;
        callback($(element));
        return;
      }
      else { // element is undefined (out of index)
        var _this = this;
        this._currentAlert.next(function (nextAlert) {
          if(!nextAlert) {
            callback(null); // end of alert
            return;
          }
          _this._currentContentIndex = -1;
          _this._currentAlert = nextAlert;
          _this.next(callback);
        });
        return;
      }
    },
    
    prev: function (callback) {
      if (!this._currentAlert) { // first time
        callback(null);
        return;
      }
      
      // check content
      var element = this._currentAlert.content[this._currentContentIndex - 1];
      if (element) {
        this._currentContentIndex--;
        callback($(element));
        return;
      }
      else { // element is undefined (out of index)
        var _this = this;
        this._currentAlert.prev(function (prevAlert) {
          if(!prevAlert) {
            callback(null); // end of alert
            return;
          }
          _this._currentAlert = prevAlert;
          _this._currentContentIndex = _this._currentAlert.content.length;
          _this.prev(callback);
        });
        return;
      }
    },
    
    get current() {
      if (this._currentAlert) {
        return $(this._currentAlert.content[this._currentContentIndex]);
      }
      return null;
    },
  };
  
  var cursor = new Cursor();
  
  // next
  KeyboardJS.bind.key('j', function () {
    if (cursor.current) {
      cursor.current.removeClass(LABEL_CLASS);
    }
    cursor.next(function (element) {
      if (!element) {
        cursor.current.addClass(LABEL_CLASS); // end of cursor
        return;
      }
      element.addClass(LABEL_CLASS);
      window.scroll(0, element.offset().top - 50);
      // todo: bind key 't' to toggle
    });
  });
  
  // prev
  KeyboardJS.bind.key('k', function () {
    if (cursor.current) {
      cursor.current.removeClass(LABEL_CLASS);
    }
    cursor.prev(function (element) {
      if (!element) {
        if (cursor.current) {
          cursor.current.addClass(LABEL_CLASS); // end of cursor
        }
        return;
      }
      element.addClass(LABEL_CLASS);
      window.scroll(0, element.offset().top - 50);
      // todo: bind key 't' to toggle
    });
  });
  
  // todo: long desc show diff
  
}(this));
