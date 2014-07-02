var _ = require('lodash');

var parseRegex = {
  operator: /(.*)\$(attr|html|text):?(.*)/
};

function trim(str) {
  return str
    .replace(/\s\+$/, '')
      .replace(/^\s\+$/, '');
}

var parser = _.memoize(function generateParser(query) {
  var m = query.match(parseRegex.operator);
  var method = 'text';
  var selector;
  var attrName;
  if (m) {
    selector = trim(m[1]);
    method = m[2];
    if (method === 'attr' && !m[3]) {
      throw new Error("$attr requires an argument in the form `$attr:attr-name`");
    }
  }
  return function(el) {
    if (selector) {
      el = el.querySelector(selector);
    }
    switch (method) {
    case 'text':
      return el.textContent || '';
    case 'html':
      return el.innerHtml || '';
    case 'attr':
      return el.getAttribute(attrName) || '';
    }
    return '';
  };
});

/**
 * Return extracted row of data from fields
 * If no data is found, return null.
 *
 * @param {Array} fields List of field queries.
 * @param {Element} element DOM element.
 *
 * @returns {Array|null} Extracted string data.
 */
module.exports = function extract(fields, element) {
  var data = [];
  var empty = true;
  for (var i = 0, l = fields.length; i < l; i++) {
    var parsed = parser(fields[i])(element);
    if (parsed.length > 0) {
      empty = false;
    }
    data.push(parser(fields[i])(element));
  }
  return empty ? null : data;
};