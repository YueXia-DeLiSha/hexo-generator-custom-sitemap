# Third-Party Notices

This package is released under the MIT License (see [LICENSE](LICENSE)).

## Runtime dependencies

None. `hexo-generator-custom-sitemap` has no third-party npm dependencies.
The only module it imports is the Node.js built-in `url` module, which is
provided by the runtime and is not bundled in this package.

## Development / design references

The following projects are not bundled with this package. They are listed
because this plugin's configuration schema and runtime integration were
informed by them.

### Node.js (`url` module)

- License: MIT
- Copyright: Node.js contributors
- Usage: built-in `URL` parser used by `lib/generator.js`; not redistributed.
- License text: https://github.com/nodejs/node/blob/main/LICENSE

### Hexo

- License: MIT
- Copyright: Hexo contributors
- Usage: peer runtime that loads this plugin; not bundled.
- License text: https://github.com/hexojs/hexo/blob/master/LICENSE

### hexo-generator-sitemap

- License: MIT
- Copyright (c) 2014 Tommy Chen
- Usage: configuration keys (`path`, `rel`, `tags`, `categories`) and the
  general sitemap generator approach were used as a design reference.
  No source code from this project is copied into this package.
- Full license text: [LICENSES/hexo-generator-sitemap.LICENSE](LICENSES/hexo-generator-sitemap.LICENSE)
