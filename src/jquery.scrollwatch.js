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
    this.callbacks = { "scrollin": $.Callbacks(), "scrollout": $.Callbacks(), "scroll": $.Callbacks() };
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
      $window.scroll();
      return this;
    },

    _createDelayedCallback: function(event, cb, options) {
        return function() {
          var args = arguments;
          _.delay(function() {
                cb.apply(null, args)
            }, options.delay);
        };
    },

    handleScroll: function() {
      if (!this.callbacks) { return; }

      var lastVisibility = this.visibility;
      var visibility = this.isInViewport();
      var currentOffset = $window.scrollTop();

      if (!this.lastOffset) {
        this.direction = false;
      } else {
        this.direction = (currentOffset > this.lastOffset) ? 'down' : 'up';
      }

      this.lastOffset = currentOffset;

      if (!this.inViewport && visibility > 0.9) {
        this.inViewport = true;
        this.trigger('scrollin');
      } else if (this.inViewport && !visibility) {
        this.inViewport = false;

        if (this.dfd) {
          this.dfd.done(_.bind(this.trigger, this, 'scrollout'))
        } else {
          this.trigger('scrollout');
        }
      }

      if (visibility !== lastVisibility) {
        this.visibility = visibility;
        this.trigger('scroll');        
      }

      return this;
    },

    trigger: function(event) {
      if (event !== 'scroll' && event === this.lastTriggered) {
        return false;
      } else {
        this.lastTriggered = event;
      }

      this.callbacks[event].fire({ direction: this.direction, visibility: this.visibility });
    },

    isInViewport: function() {
      var scrollTop = $window.scrollTop();
      var windowHeight = $window.height();
      var scrollBottom = scrollTop + windowHeight;

      var elTop = this.$el.offset().top;
      var elHeight = this.$el.outerHeight();
      var elBottom = elTop + elHeight;

      // element bigger than viewport size and off screen
      if (elHeight > windowHeight && scrollTop > elTop && scrollBottom < elBottom) {
        return 1;
      }

      // element small then viewport fully in view
      if (elHeight < windowHeight && elTop > scrollTop && elBottom < scrollBottom) {
        return 1;
      }

      // element bleeding off the bottom of the viewport
      if (elTop > scrollTop && elTop < scrollBottom) {
        return (scrollBottom - elTop) / elHeight;
      }

      // element bleeding off the top of the viewport
      if (elBottom > scrollTop && elBottom < scrollBottom) {
        return (scrollTop - elBottom) / elHeight;
      }

      return 0;
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
