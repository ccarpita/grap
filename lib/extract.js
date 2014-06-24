
var _ = require('lodash');

var parseRegex = {
  operator: /\s*\$(attr|html|text):?(.*)/
};

var parser = _.memoize(function generateParser(query) {
  var m = parseRegex.operator.match(query);
  var method = 'text';
  var selector;
  var attrName;
  if (m) {
    method = m[1];
    if (method === 'attr' && !m[2]) {
      throw new Error("$attr requires an argument in the form `$attr:attr-name`");
    }
  }
  return function(el) {
    if (selector) {
      el = el.querySelector(selector);
    }
    switch (method) {
    case 'text':
      return el.innerText; // TODO: check validity
    case 'html':
      return el.innerHtml;
    case 'attr':
      return el.getAttribute(attrName);
    }
    return '';
  }
});

module.exports = function extract(fields, element) {
  var data = [];
  for (var i = 0, l = fields.length; i < l; i++) {
    data.push(parser(fields[i])(element));
  }
  return data;
};