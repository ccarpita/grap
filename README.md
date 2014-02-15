# Not Implemented!

This project utilizes README-driven development (RDD) in addition to BDD.  The library and examples below are not yet implemented.  This notice will be removed when the first usable and 100% unit tested version (0.1.0) of Sandworm has been released.

# About

Sandworm is a library that provides all of the boilerplate a developer needs to crawl and parse web sites, allowing the library user to focus on:

1. Which pages to analyze.
2. Which elements on the page to parse for data
3. Mapping of the data into usable inputs

Under the hood, Sandworm uses jsdom or phantomjs (configurable) with its own persistable cookiespace to retrieve and parse html pages into DOM elements.

# Why Another Crawling Library?

The author felt like the existing template libraries were overly focused on templating and didn't offer the flexibility of logical flows that crawling a website may demand.

# Example

```js
var sw = require('sandworm');
// set default attributes
sw.format('tsv')
  .pace(0.1)
  .browser('phantomjs');
// start a job
sw.crawl('http://www.domain.com', function() {
  // set job attributes
  this.header('id', 'content')
    .follow(/follow-pattern/)
    .pace(1.0, 0.5)
    .handler(function($) {
      this.each('tr[attr=alt] td', function(el) {
        this.push({
          id: $(el).attr('data-id'),
          content: $(el).text()
        });
      });
    });
});
```

# SandScript

Sandworm can parse a semi-declarative script for using library methods

```sandscript
format TSV
pace 1.0
crawl 'http://domaintocrawl.com'
  header ID, 'Content, HTML'
  follow /index-follow-pattern/
    follow /detail-page-pattern/
      each '.element-class'
        push :data-id, html
      each '.element2'
        { // escape js. this = page, $ = jQuery, element = native DOMElement
          this.push(element.getAttribute('data-id'), element.getElementsByTagName('span')[2].innerHTML);
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
