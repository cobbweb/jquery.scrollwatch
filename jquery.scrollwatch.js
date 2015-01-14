(function($, window) {
  'use strict';

  var POSITIONED = ['fixed', 'relative', 'absolute'];
  var WINDOW_EVENTS = 'mousewheel resize';

  var $window = $(window);

  var ScrollWatch = function(el, options) {
    _.bindAll(this, 'handleScroll', 'onScroll');

    this.$el = $(el);
    this.el = this.$el[0];

    this.options = _.defaults(options || {}, {
      watchOn: window
    });

    this.$watchOn = $(this.options.watchOn);
    this._prepareContainer();
    this.inViewport = false;
    this.callbacks = { "scrollin": $.Callbacks(), "scrollout": $.Callbacks(), "scroll": $.Callbacks() };
    this.listen();
  };

  ScrollWatch.prototype = {

    _prepareContainer: function() {
      if (this.$watchOn[0] === window) {
        return; // no prep needed for window
      }

      var positioning = this.$watchOn.css('position');
      var isPositioned = _.contains(POSITIONED, positioning);

      if (!isPositioned) {
        this.$watchOn.css('position', 'relative');
      }
    },

    listen: function() {
      this.$watchOn.on('scroll', this.onScroll);
      $window.on(WINDOW_EVENTS, this.onScroll);
    },

    destroy: function() {
      this.$watchOn.off('scroll', this.onScroll);
      $window.off(WINDOW_EVENTS, this.onScroll);
      this.$el.data('scrollWatch', null);
    },

    on: function(event, options, callback, thisArg) {
      if (_.isFunction(options)) {
        thisArg = callback;
        callback = options;
        options = {};
      }

      options = _.extend({}, this.options, options);
      callback = _.bind(callback, thisArg || this.$el);

      // delay handler
      if (options.delay) {
        callback = this._createDelayedCallback(event, callback, options);
      }

      this.callbacks[event].add(callback);
      this.$watchOn.scroll();
      return this;
    },

    _createDelayedCallback: function(event, cb, options) {
      return function() {
        var args = arguments;
        _.delay(function() {
          cb.apply(this, args);
        }, options.delay);
      };
    },

    // Force=true circumvents our logic that prevents multiple `scroll` events
    // when the visibility is the same
    handleScroll: function(force) {
      var lastVisibility = this.visibility;
      var visibility = this.isInViewport();
      var currentOffset = this.$watchOn.scrollTop();

      if (this.lastOffset === false) {
        this.direction = false;
      } else {
        this.direction = (currentOffset > this.lastOffset) ? 'down' : 'up';
      }

      this.lastOffset = currentOffset;
      this.visibility = visibility;

      if (!this.inViewport && visibility === 1) {
        this.inViewport = true;
        this.trigger('scrollin');
      } else if (this.inViewport && visibility === 0) {
        this.inViewport = false;

        if (this.dfd) {
          this.dfd.done(_.bind(this.trigger, this, 'scrollout'));
        } else {
          this.trigger('scrollout');
        }
      }

      // prevent firing multiple `scroll` events when the visibility is the same
      if (visibility !== lastVisibility || force) {
        this.trigger('scroll');
      }

      return this;
    },

    onScroll: function(event) {
      if (this.running) {
        return;
      }

      this.running = true;
      this.originalEvent = event;
      this.handleScroll();
      this.running = false;
    },

    trigger: function(event) {
      if (event !== 'scroll' && event === this.lastTriggered) {
        return false;
      }

      this.lastTriggered = event;
      this.callbacks[event].fire({ direction: this.direction, visibility: this.visibility, originalEvent: this.originalEvent });
    },

    _getOffsetTop: function() {
      if (this.$watchOn[0] === window) {
        return this.$el.offset().top;
      }

      var el = this.el;
      var offset = 0;

      do {
        offset += el.offsetTop;
        el = el.offsetParent;
      } while (el && el !== this.$watchOn[0]);

      return offset;
    },

    isInViewport: function() {
      var scrollTop = this.$watchOn.scrollTop();
      var containerHeight = this.$watchOn.height();
      var scrollBottom = scrollTop + containerHeight;

      var elTop = this._getOffsetTop();
      var elHeight = this.el.offsetHeight;
      var elBottom = elTop + elHeight;

      var elementIsBiggerThanContainer = elHeight >= containerHeight;

      // element bigger than viewport size and off screen
      if (elementIsBiggerThanContainer && scrollTop >= elTop && scrollBottom <= elBottom) {
        return 1;
      }

      // element smaller than viewport and fully in view
      if (!elementIsBiggerThanContainer && elTop >= scrollTop && elBottom <= scrollBottom) {
        return 1;
      }

      // element bleeding off the bottom of the viewport
      if (elTop > scrollTop && elTop < scrollBottom && elBottom > scrollBottom) {
        return (scrollBottom - elTop) / elHeight;
      }

      // element bleeding off the top of the viewport
      if (elBottom > scrollTop && elBottom < scrollBottom) {
        return (scrollTop - elBottom) / elHeight;
      }

      // return zero visibility because nothing above matched
      return 0;
    }

  };

  window.ScrollWatch = ScrollWatch;

  $.fn.scrollWatch = function(options) {
    var $this = $(this),
        data = $this.data('scrollWatch');

    if (!data) {
      $this.data('scrollWatch', (data = new window.ScrollWatch(this, options)));
    }

    return data;
  };

}(jQuery, window));