describe('jquery.scrollwatch', function() {
  it('should exist as a global', function() {
    expect(ScrollWatch).to.exist;
  });

  it('should exist as a jQuery plugin', function() {
    expect($('<div>').scrollWatch()).to.exist;
  });

  describe('jQuery plugin', function() {
    var $el = $('<div>');
    var options = { watchOn: '#scrolly' };
    var sc1, sc2, spy;

    beforeEach(function() {
      spy = sinon.spy(window, 'ScrollWatch');
      $el = $el.clone();
      sc1 = $el.scrollWatch(options);
      sc2 = $el.scrollWatch();
    });

    afterEach(function() {
      spy.restore();
    });

    it('should only keep one scrollWatch instance per element', function() {
      expect(sc1).to.equal(sc2);
      expect(spy).to.have.been.calledOnce;
    });

    it('should store the instance on the element\'s data', function() {
      expect($el.data('scrollWatch')).to.equal(sc1);
    });

    it('should pass through the element and any provided options', function() {
      expect(spy).to.have.calledWithExactly($el, options);
    });
  });

  describe('constructor', function() {
    var $el = $('<div/>');
    var scrollWatch, spy;

    beforeEach(function() {
      $el = $el.clone();
      spy = sinon.spy(jQuery.fn, 'on');
      scrollWatch = new ScrollWatch($el);
    });

    afterEach(function() {
      spy.restore();
    });

    it('should cache the element as a jQuery object', function() {
      // constructor makes a new jQuery object
      // so we have to compare DOM nodes
      expect(scrollWatch.$el[0]).to.have.equal($el[0]);
    });

    it('should cache the raw DOM object', function() {
      expect(scrollWatch).to.have.property('el', $el[0]);
    });

    it('should have window as the watchOn object', function() {
      expect(scrollWatch.options.watchOn).to.equal(window);
      expect(scrollWatch.$watchOn[0]).to.equal(window);
    });

    it('should setup listening to the scroll event', function() {
      expect(spy).to.have.been.calledWithExactly('scroll', scrollWatch.onScroll);
      expect(spy).to.have.been.calledOn(scrollWatch.$watchOn);
    });

    it('should setup listening to resize events on the window', function() {
      expect(spy).to.have.been.calledWithExactly(sinon.match('resize'), scrollWatch.onScroll)
       .and.calledOn(sinon.match(function(actual) { return actual[0] === window; }));
    });

    describe('custom watchOn element', function() {
      var options = { watchOn: '<div id="yolo" />' };

      beforeEach(function() {
        scrollWatch = new ScrollWatch($el, options);
      });

      it('should cache the custom watchOn object', function() {
        expect(scrollWatch.options).to.have.property('watchOn', '<div id="yolo" />');
        expect(scrollWatch.$watchOn).to.have.id('yolo');
      });

      it('should force the watchOn element to be positioned', function() {
        expect(scrollWatch.$watchOn).to.have.css('position', 'relative');
      });

      describe('that\'s already positioned', function() {
        beforeEach(function() {
          scrollWatch.$watchOn.css('position', 'fixed');
          scrollWatch._prepareContainer();
        });

        it('should leave the watchOn element\'s position', function() {
          expect(scrollWatch.$watchOn).to.have.css('position', 'fixed');
        });
      });
    });
  });

  describe('event binding', function() {
    var $el = $('<div>');
    var scrollWatch, spy;

    beforeEach(function() {
      spy = sinon.spy();
      $el = $el.clone();
      scrollWatch = new ScrollWatch($el);
      sinon.spy(scrollWatch.$watchOn, 'scroll');
      scrollWatch.on('scroll', spy);
    });

    afterEach(function() {
      scrollWatch.$watchOn.scroll.restore();
    });

    it('should trigger a scroll event', function() {
      expect(scrollWatch.$watchOn.scroll).to.have.been.calledOnce;
    });

    it('should add the callback to the stack', function() {
      expect(spy).to.have.been.calledOnce
                    .and.calledOn(scrollWatch.$el);
    });

    it('should have an originalEvent that is a jQuery.Event object', function() {
      var event = spy.args[0][0];
      expect(event.originalEvent).to.be.instanceOf(jQuery.Event);
    });

    describe('with a custom thisArg', function() {
      var thisArg = { 'because': 'yolo' };

      beforeEach(function() {
        spy = sinon.spy();
        scrollWatch.on('scrollin', spy, thisArg).trigger('scrollin');
      });

      it('should invoke the callback with the provide context', function() {
        expect(spy).to.have.been.calledOnce.and.calledOn(thisArg);
      });
    });
  });

  describe('isInViewport', function() {
    var $el = $('<div/>');
    var scrollWatch;
    var scrollTop, containerHeight, elTop, elHeight;

    beforeEach(function() {
      $el = $el.clone();
      scrollWatch = new ScrollWatch($el);
      containerHeight = sinon.stub(scrollWatch.$watchOn, 'height').returns(500);
      scrollTop = sinon.stub(scrollWatch.$watchOn, 'scrollTop').returns(2000);
      elTop = sinon.stub(scrollWatch, '_getOffsetTop');
      scrollWatch.el = { offsetHeight: 0 };
    });

    afterEach(function() {
      containerHeight.restore();
      scrollTop.restore();
      elTop.restore();
    });

    describe('with a small element', function() {
      beforeEach(function() {
        scrollWatch.el.offsetHeight = 250;
      });

      describe('below the view', function() {
        beforeEach(function() {
          elTop.returns(4000);
        });

        it('should have zero visibility', function() {
          expect(scrollWatch.isInViewport()).to.equal(0);
        });
      });

      describe('above the view', function() {
        beforeEach(function() {
          elTop.returns(100);
        });

        it('should have zero visibility', function() {
          expect(scrollWatch.isInViewport()).to.equal(0);
        });
      });

      describe('fully in the view', function() {
        beforeEach(function() {
          elTop.returns(2100);
        });

        it('should have full visibility', function() {
          expect(scrollWatch.isInViewport()).to.equal(1);
        });
      });

      describe('bleeding off the top of the view', function() {
        describe('half showing', function() {
          beforeEach(function() {
            elTop.returns(1875);
          });

          it('should have 50% visibility', function() {
            expect(scrollWatch.isInViewport()).to.equal(-0.5);
          });
        });

        describe('more showing', function() {
          beforeEach(function() {
            elTop.returns(1950);
          });

          it('should have 80% visibility', function() {
            expect(scrollWatch.isInViewport()).to.equal(-0.8);
          });
        });
      });
    });
  });

  describe('destroy', function() {
    var $el = $('<div/>'), scrollWatch;

    beforeEach(function() {
      sinon.spy($.fn, 'off');
      $el = $el.clone();
      scrollWatch = $el.scrollWatch();
      scrollWatch.destroy();
    });

    afterEach(function() {
      $.fn.off.restore();
    });

    it('should unbind events', function() {
      expect($.fn.off).to.have.been.calledTwice;
      expect($.fn.off).been.calledWithExactly('scroll', scrollWatch.onScroll)
      .and.been.calledOn(scrollWatch.$watchOn)
      .and.been.calledWithExactly('mousewheel resize', scrollWatch.onScroll);
    });
  });

  describe('bug fixes', function() {
    describe('when scrolling starts from the top (this.lastOffset = 0)', function() {
      var $el = $('<div/>'), scrollWatch;

      beforeEach(function() {
        $el = $el.clone();
        scrollWatch = $el.scrollWatch();
        scrollWatch.lastOffset = 0;
        sinon.stub(scrollWatch.$watchOn, 'scrollTop').returns(25);
        scrollWatch.handleScroll();
      });

      it('should not report the direction as false', function() {
        expect(scrollWatch.direction).to.equal('down');
      });
    });
  });
});