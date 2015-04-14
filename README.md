# Not Fully Implemented!

This project utilizes README-driven development (RDD).  Yes, I just made that up.

The library and examples below are not fully implemented and tested.  This notice will be removed when the first usable and 100% unit tested version (0.1.0) of Sandworm has been released.

# Sandworm [![Build Status](https://travis-ci.org/ccarpita/sandworm.svg?branch=master)](https://travis-ci.org/ccarpita/sandworm) [![Dependency Status](https://gemnasium.com/ccarpita/sandworm.svg)](https://gemnasium.com/ccarpita/sandworm) [![Coverage Status](https://coveralls.io/repos/ccarpita/sandworm/badge.png?branch=master)](https://coveralls.io/r/ccarpita/sandworm?branch=master)


Sandworm is a library that provides all of the boilerplate a developer needs to crawl and parse web sites, allowing the library user to focus on:

1. Where to start, and which pages to analyze (follow patterns)
2. Which elements on the page to parse for data
3. Mapping of the data into usable inputs

Under the hood, Sandworm uses jsdom or phantomjs (configurable) with its own persistable cookiespace to retrieve and parse html pages into DOM elements.

# Why another crawling library?

The author felt like many of the existing crawl libraries were overly reliant on templating and didn't offer the flexibility of logical flows that web data extraction may demand.

The design of Sandworm seeks a pattern that resembles declarative syntax for basic use cases, with the option to expand decision points into complex logic where necessary.

# Examples

## Simple

```js
require('sandworm')('http://www.domain.com')
.follow(/page-pattern/)
  .each('.content tr td')
    .extract('span $text', '$attr:href')
```

## More Complex

```js
require('sandworm')('http://www.domain.com')
.pace(1.0, 0.5)
.browser('phantom')
.follow(/directory-page-pattern/)
  .follow(/item-page-pattern/)
    .each('tr[data-type=val] td')
      .extract('$attr: data-id', '$text')
.top()
.follow(/directory-pattern-2/)
  .each('a.title')
    .extract('$html')
.top()
.follow(/follow-pattern-3/)
  .each('div.content')
  (function(el) {
    this.push(el.id, el.getElementsByTagName('span')[2].textContent)
  });

// Extraction Training. This is a stretch goal ;)
crawl('http://www.wikipedia.org/List_of_Fruit')
.train(url1, ['Apples'])
.train(url2, ['Bananas'], /masking-regex/)
.follow(/regex/)
  .depth(3)
```

# SandScript

Sandworm can parse a semi-declarative script for using library methods

```sandscript
format tsv
pace 1.0 0.5
crawl 'http://domaintocrawl.com'
  header ID Content HTML
  follow /index-follow-pattern/
  follow /detail-page-pattern/
  each '.element-class'
  push :data-id, html
  each '.element2'
  { // Use brackets to escape raw JS. this = page, $ = jQuery, element = native DOMElement
    push(attr('data-id'), element.getElementsByTagName('span')[2].innerHTML);
  }
```
Use the command line tool to compile sandscripts to js:

```sh
sandworm -c my_crawl_script.sand > my_crawl_script.js
# or run it
sandworm my_crawl_script.sand > crawl_output.tsv
```

# Version History

## 0.0.1

Development framework, README.md, trivial unit test.
