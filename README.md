# Not Implemented!

This project utilizes README-driven development (RDD) in addition to BDD.  The library and examples below are not yet implemented.  This notice will be removed when the first usable and 100% unit tested version (0.1.0) of Grap has been developed.

# About

Grap is a library that provides all of the boilerplate a developer needs to crawl and parse web sites, allowing the library user to focus on:

1. Which pages to follow
2. Which elements to parse for data

Under the hood, Grap uses a headless browser with its own persistable cookiespace to retrieve and parse html pages into DOM elements.

# Example

```js
var Job = require('grap').Job;
var job = new Job();
job.pace(1, 0.5); // 1 second in-between requests, with 0.5 second random variation (default)
job.start("http://domaintocrawl.com", function(page) {
  page.follow(/index-page-follow-pattern/, function(indexPage) {
    indexPage.follow(/detail-page-pattern/, function(page) {
      nextPage.each('.element-class', function(element) {
        job.push([element.getAttribute('data-id'), element.innerHTML]);
      });
    });
  });
});
```

# Grap Syntax

Grap can parse a shorthand script for using the Grap library

```grap
pace 3 1
start "http://domaintocrawl.com"
  follow /index-follow-pattern/
    follow /detail-page-pattern/
      each '.element-class'
        push :data-id, html
      each '.element2'
        { // use brackets to escape js
          job.push(element.getAttribute('data-id'), element.getElementsByTagName('span')[2].innerHTML);
        }
```
Use the command line tool to transpile grapl scripts to javascript:

```sh
grapl -c my_crawl_script.gr > my_crawl_script.js
# or run it
grapl -v -r my_crawl_script.gr > crawl_output.tsv
```

# Version History

## 0.0.1

Development framework, README.md, trivial unit test.
