(function($) {
  $.fn.fn = function() {
    var self = this;
    var extension = arguments[0], name = arguments[0];
    if (typeof name == "string") {
      return apply(self, name, $.makeArray(arguments).slice(1, arguments.length));
    } else {
      $.each(extension, function(key, value) {
        define(self, key, value);
      });
      return self;
    }
  }
  function define(self, name, fn) {
    self.data(namespacedName(name), fn);
  };
  function apply(self, name, args) {
    var result;
    self.each(function(i, item) {
      var fn = $(item).data(namespacedName(name));
      if (fn) result = fn.apply(item, args)
      else throw(name + " is not defined");
    });
    return result;
  };
  function namespacedName(name) {
    return 'fn.' + name;
  }
})(jQuery);
(function($) {

  function print_array(obj, opts) {
    var result = [];
    for (var i = 0; i < Math.min(opts.max_array, obj.length); i++)
      result.push($.print(obj[i], $.extend({}, opts, { max_array: 3, max_string: 40 })));

    if (obj.length > opts.max_array)
      result.push((obj.length - opts.max_array) + ' more...');
    if (result.length == 0) return "[]"
      return "[ " + result.join(", ") + " ]";
  }

  function print_element(obj) {
    if (obj.nodeType == 1) {
      var result = [];
      var properties = [ 'className', 'id' ];
      var extra = {
        'input': ['type', 'name', 'value'],
        'a': ['href', 'target'],
        'form': ['method', 'action']
      };
      $.each(properties.concat(extra[obj.tagName.toLowerCase()] || []), function() {
        if (obj[this]) 
          result.push(' ' + this.replace('className', 'class') + "=" + $.print(obj[this]))
      });
      return "<" + obj.tagName.toLowerCase()
              + result.join('') + ">";
    }
  }

  function print_object(obj, opts) {
    var seen = opts.seen || [];

    var result = [], key, value;
    for (var k in obj) {
      if (obj.hasOwnProperty(k) && $.inArray(obj[k], seen) < 0) {
        seen.push(obj[k]);
        value = $.print(obj[k], $.extend({}, opts, { max_array: 6, max_string: 40, seen: seen }));
      } else
        value = "...";
      result.push(k + ": " + value);
    }
    if (result.length == 0) return "{}";
    return "{ " + result.join(", ") + " }";
  }

  function print_jquery(obj) {
  }

  function print_string(value, opts) {
    var character_substitutions = {
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"' : '\\"',
      '\\': '\\\\'
    };
    var r = /["\\\x00-\x1f\x7f-\x9f]/g;
    
    var str = r.test(value)
      ? '"' + value.replace(r, function (a) {
          var c = character_substitutions[a];
          if (c) return c;
          c = a.charCodeAt();
          return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
        }) + '"'
      : '"' + value + '"';
    if (str.length > opts.max_string)
      return str.slice(0, opts.max_string + 1) + '..."';
    else
      return str;
  }

  $.print = function(obj, options) {
    var opts = $.extend({}, { max_array: 10, max_string: 100 }, options);

    if (typeof obj == 'undefined')
      return "undefined";
    else if (typeof obj == 'boolean')
      return obj.toString();
    else if (!obj && typeof obj == 'number')
      return 'NaN';
    else if (!obj)
      return "null";
    else if (typeof obj == 'string')
      return print_string(obj, opts);
    else if (obj instanceof RegExp)
      return obj.toString();
    else if (typeof obj == 'function' || obj instanceof Function)
      return obj.toString().match(/^([^)]*\))/)[1];
    else if (obj instanceof Array)
      return print_array(obj, opts);
    else if (obj.nodeType)
      return print_element(obj);
    else if (obj instanceof jQuery)
      return "$(" + $.print(obj.get()) + ")";
    else if (obj instanceof Error)
      return print_object(obj, $.extend({}, options, { max_string: 200 }));
    else if (obj instanceof Object)
      return print_object(obj, opts);
    else
      return obj.toString().replace(/\n\s*/g, '');
  }
  
})(jQuery);
var Screw = (function($) {
  var screw = {
    Unit: function(fn) {
      var contents = fn.toString().match(/^[^\{]*{((.*\n*)*)}/m)[1];
      var fn = new Function("matchers", "specifications",
        "with (specifications) { with (matchers) { " + contents + " } }"
      );

      $(Screw).queue(function() {
        Screw.Specifications.context.push($('body > .describe'));
        fn.call(this, Screw.Matchers, Screw.Specifications);
        Screw.Specifications.context.pop();
        $(this).dequeue();
      });
    },

    Specifications: {
      context: [],

      describe: function(name, fn) {
        var describe = $('<li class="describe">')
          .append($('<h1>').text(name))
          .append('<ol class="befores">')
          .append('<ul class="its">')
          .append('<ul class="describes">')
          .append('<ol class="afters">');

        this.context.push(describe);
        fn.call();
        this.context.pop();

        this.context[this.context.length-1]
          .children('.describes')
            .append(describe);
      },

      it: function(name, fn) {
        var it = $('<li class="it">')
          .append($('<h2>').text(name))
          .data('screwunit.run', fn);

        this.context[this.context.length-1]
          .children('.its')
            .append(it);
      },

      before: function(fn) {
        var before = $('<li class="before">')
          .data('screwunit.run', fn);

        this.context[this.context.length-1]
          .children('.befores')
            .append(before);
      },

      after: function(fn) {
        var after = $('<li class="after">')
          .data('screwunit.run', fn);

        this.context[this.context.length-1]
          .children('.afters')
            .append(after);
      }
    }
  };

  $(screw).queue(function() { $(screw).trigger('loading') });
  $(function() {
    $('<div class="describe">')
      .append('<h3 class="status">')
      .append('<ol class="befores">')
      .append('<ul class="describes">')
      .append('<ol class="afters">')
      .appendTo('body');

    $(screw).dequeue();
    $(screw).trigger('loaded');
  });
  return screw;
})(jQuery);
Screw.Matchers = (function($) {
  return matchers = {
    expect: function(actual) {
      return {
        to: function(matcher, expected, not) {
          var matched = matcher.match(expected, actual);
          if (not ? matched : !matched) {
            throw(matcher.failure_message(expected, actual, not));
          }
        },
        
        to_not: function(matcher, expected) {
          this.to(matcher, expected, true);
        }
      }
    },
    
    equal: {
      match: function(expected, actual) {
        if (expected instanceof Array) {
          for (var i = 0; i < actual.length; i++)
            if (!Screw.Matchers.equal.match(expected[i], actual[i])) return false;
          return actual.length == expected.length;
        } else if (expected instanceof Object) {
          for (var key in expected)
            if (expected[key] != actual[key]) return false;
          for (var key in actual)
            if (actual[key] != expected[key]) return false;
          return true;
        } else {
          return expected == actual;
        }
      },
      
      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not equal ' : ' to equal ') + $.print(expected);
      }
    },
    
    match: {
      match: function(expected, actual) {
        if (expected.constructor == RegExp)
          return expected.exec(actual.toString());
        else
          return actual.indexOf(expected) > -1;
      },
      
      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not match ' : ' to match ') + $.print(expected);
      }
    },
    
    be_empty: {
      match: function(expected, actual) {
        if (actual.length == undefined) throw(actual.toString() + " does not respond to length");
        
        return actual.length == 0;
      },
      
      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not be empty' : ' to be empty');
      }
    },

    have_length: {
      match: function(expected, actual) {
        if (actual.length == undefined) throw(actual.toString() + " does not respond to length");

        return actual.length == expected;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not' : ' to') + ' have length ' + expected;
      }
    },

    be_null: {
      match: function(expected, actual) {
        return actual == null;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not be null' : ' to be null');
      }
    },

    be_undefined: {
      match: function(expected, actual) {
        return actual == undefined;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not be undefined' : ' to be undefined');
      }
    },

    be_true: {
      match: function(expected, actual) {
        return actual;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not be true' : ' to be true');
      }
    },

    be_false: {
      match: function(expected, actual) {
        return !actual;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not be false' : ' to be false');
      }
    },

    match_selector: {
      match: function(expected, actual) {
        if (!(actual instanceof jQuery)) {
          throw expected.toString() + " must be an instance of jQuery to match against a selector"
        }

        return actual.is(expected);
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not match selector ' : ' to match selector ') + expected;
      }
    },

    contain_selector: {
      match: function(expected, actual) {
        if (!(actual instanceof jQuery)) {
          throw expected.toString() + " must be an instance of jQuery to match against a selector"
        }

        return actual.find(expected).length > 0;
      },

      failure_message: function(expected, actual, not) {
        return 'expected ' + $.print(actual) + (not ? ' to not contain selector ' : ' to contain selector ') + expected;
      }
    }
  }
})(jQuery);
(function($) {
  $(Screw)
    .bind('loaded', function() {    
      $('.describe, .it')
        .click(function() {
          document.location = location.href.split('?')[0] + '?' + $(this).fn('selector');
          return false;
        })
        .focus(function() {
          return $(this).addClass('focused');
        })
        .bind('scroll', function() {
          document.body.scrollTop = $(this).offset().top;
        });

      $('.it')
        .bind('enqueued', function() {
          $(this).addClass('enqueued');
        })
        .bind('running', function() {
          $(this).addClass('running');
        })
        .bind('passed', function() {
          $(this).addClass('passed');
        })
        .bind('failed', function(e, reason) {
          $(this)
            .addClass('failed')
            .append($('<p class="error">').text(reason.toString()));
          if (reason.fileName || reason.lineNumber) {
            $(this)
              .append($('<p class="error">').text(reason.fileName + " : " + reason.lineNumber));
          }
        })
    })
    .bind('before', function() {
      $('.status').text('Running...');
    })
    .bind('after', function() {
      $('.status').fn('display')
    })
})(jQuery);
(function($) {
  $(Screw).bind('loaded', function() {
    $('.status').fn({
      display: function() {
        $(this).text(
          $('.passed').length + $('.failed').length + ' test(s), ' + $('.failed').length + ' failure(s)'
        );
      }
    });

    $('.describe').fn({
      parent: function() {
        return $(this).parent('.describes').parent('.describe');
      },
      
      run_befores: function() {
        $(this).fn('parent').fn('run_befores');
        $(this).children('.befores').children('.before').fn('run');
      },
      
      run_afters: function() {
        $(this).fn('parent').fn('run_afters');
        $(this).children('.afters').children('.after').fn('run');
      },
      
      enqueue: function() {
        $(this).children('.its').children('.it').fn('enqueue');
        $(this).children('.describes').children('.describe').fn('enqueue');
      },
      
      selector: function() {
        return $(this).fn('parent').fn('selector')
          + ' > .describes > .describe:eq(' + $(this).parent('.describes').children('.describe').index(this) + ')';
      }
    });
  
    $('body > .describe').fn({
      selector: function() { return 'body > .describe' }
    });
    
    $('.it').fn({
      parent: function() {
        return $(this).parent('.its').parent('.describe');
      },
      
      run: function() {
        try {
          try {
            $(this).fn('parent').fn('run_befores');
            $(this).data('screwunit.run')();
          } finally {
            $(this).fn('parent').fn('run_afters');
          }
          $(this).trigger('passed');
        } catch(e) {
          $(this).trigger('failed', [e]);
        }
      },
      
      enqueue: function() {
        var self = $(this).trigger('enqueued');
        $(Screw)
          .queue(function() {
            self.fn('run');
            setTimeout(function() { $(Screw).dequeue() }, 0);
          });
      },
      
      selector: function() {
        return $(this).fn('parent').fn('selector')
          + ' > .its > .it:eq(' + $(this).parent('.its').children('.it').index(this) + ')';
      }
    });
    
    $('.before').fn({
      run: function() { $(this).data('screwunit.run')() }
    }); 
  
    $('.after').fn({
      run: function() { $(this).data('screwunit.run')() }
    });

    $(Screw).trigger('before');
    var to_run = unescape(location.search.slice(1)) || 'body > .describe > .describes > .describe';
    $(to_run)
      .focus()
      .eq(0).trigger('scroll').end()
      .fn('enqueue');
    $(Screw).queue(function() { $(Screw).trigger('after') });
  })
})(jQuery);
