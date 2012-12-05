(function($) {
  'use strict';

  // cache window as jQuery object
  var $window = $(window);

  var ScrollWatch = function(el, options) {
    _.bindAll(this, 'handleScroll');

    this.el = el;
    this.$el = $(el);

    this.options = _.defaults(options || {}, {
      throttle: 100
    });

    this.inViewport = false;
    this.callbacks = { "scrollin": $.Callbacks(), "scrollout": $.Callbacks() };
    this.setupEvents();
  };

  ScrollWatch.prototype = {

    setupEvents: function() {
      this._handleScroll = _.throttle(this.handleScroll, this.options.throttle);
      $window.on('scroll', this._handleScroll)
    },

    on: function(event, options, callback, thisArg) {
      if (_.isFunction(options)) {
        callback = options;
        thisArg = callback;
        options = {};
      }

      options = _.extend({}, this.options, options);
      callback = _.bind(callback, thisArg || this.$el);

      // delay handler
      if (options.delay) {
        callback = this._createDelayedCallback(event, callback, options);
      }

      this.callbacks[event].add(callback);
      return this;
    },

    _createDelayedCallback: function(event, cb, options) {
        // bail out if the element doesn't remain in the viewport after the delay
        if (options.onlyDelayInViewport) {
          var _cb = cb;

          cb = _.bind(function() {
            if (this.isInViewport()) {
              _cb();
            }
          }, this);
        }

        if (event === "scrollin" && options.deferOutUntilIn) {
          cb = this._createDeferredCallback(cb);
        }

        return function() {
          _.delay(cb, options.delay);
        };
    },

    _createDeferredCallback: function(cb)
    {
      var dfd = this.dfd = new $.Deferred();
      return function() {
        cb();
        dfd.resolve();
      };
    },

    handleScroll: function() {
      if (!this.callbacks) { return; }

      var inViewport = this.isInViewport();

      if (!this.inViewport && inViewport) {
        this.inViewport = true;
        this.trigger('scrollin');
      } else if (this.inViewport && !inViewport) {
        this.inViewport = false;

        if (this.dfd) {
          this.dfd.done(_.bind(this.trigger, this, 'scrollout'))
        } else {
          this.trigger('scrollout');
        }
      }
    },

    trigger: function(event)
    {
      this.callbacks[event].fire();
    },

    isInViewport: function() {
      return $.inViewport(this.el) === 1;
    },

    off: function() {
      $window.off('scroll', this._handleScroll);
    }

  };

  window.ScrollWatch = ScrollWatch;

  $.fn.scrollWatch = function(options) {
    var $this = $(this),
        data = $this.data('scrollWatch');

    if (!data) {
      $this.data('scrollWatch', (data = new ScrollWatch(this, options)));
    }

    return data;
  };

}(jQuery));
