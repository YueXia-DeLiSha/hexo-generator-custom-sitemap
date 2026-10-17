'use strict';

var register = require('./lib/generator');

if (typeof hexo !== 'undefined') {
  register(hexo);
} else {
  module.exports = register;
}
