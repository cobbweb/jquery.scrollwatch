# jquery.scrollWatch

 > Triggers events on various page elements as they are scrolled in to and out of view.

[![Build Status](https://travis-ci.org/cobbweb/jquery.scrollwatch.png?branch=master)](https://travis-ci.org/cobbweb/jquery.scrollwatch)

## Usage

Bind events using the `.on()` method:

    // Pseudo-JavaScript
    $('#element').scrollWatch(options).on(eventName, callback, thisArg);

    // Example
    $('#element').scrollWatch().on('scroll', function(event) {
        console.log(event.visibility)
    });

### Methods

* `on(eventName, callback, [thisArg])` - Binds an event

### Events

 * `scrollin` (event) — Triggered once, when the element is *fully* visible in the viewport.
 * `scrollout` (event) — Triggered once, when the none of the element is visible. Only triggers if `scrollin` has been called on the element.
 * `scroll` (event) — Triggered many times, every scroll event when the element is partially *or* fully visible.

#### Event object

##### `event.direction`

A string that is either `'up'` or `'down'` indicating which direction the user is scrolling.

##### `event.originalEvent`

The original [jQuery Event object](http://api.jquery.com/category/events/event-object/).

##### `event.visibility`

A percent of the element that is visible, only useful for the `scroll` event. 

 * Between `0` and `-1` when the *top* of the element is bleeding out of view. 
 * Between `0` and `1` when the *bottom* of the element is bleeding out of view.
 * Is `1` on the `scrollin` event
 * Is `0` on the `scrollout` event

*NOTE:* Elements that are taller than the viewport would technically never have 100% visibility. However, `visibility` will *jump* to `1` when both the top and bottom of the element are bleeding off the screen (effectively the element is taking up the entire vertical viewport space).

### Options

`$('#element').scrollWatch(options)`

* `watchOn` - The scrollable element to watch on. Can be a selector, DOM node or jQuery object. When using a custom element, it should have `overflow: scroll`. Defaults to `window`.
