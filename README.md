![version](https://img.shields.io/npm/v/redux-load-api.svg) ![license](https://img.shields.io/npm/l/redux-load-api.svg) ![installs](https://img.shields.io/npm/dt/redux-load-api.svg) ![build](https://img.shields.io/travis/Download/redux-load-api.svg) ![mind BLOWN](https://img.shields.io/badge/mind-BLOWN-ff69b4.svg)

# redux-load-api <sup><sub>v2.0.1</sub></sup>

**Load api for use with [redux-apis](https://github.com/download/redux-apis)**

## Installation

```sh
npm install --save redux-load-api
```

<sub>*NOTE* When using redux-load-api on older versions of Node, or older browsers that
don't support `Promise`s, make sure to install a Promise polyfill as well.
This library is tested on Node JS 0.10, as can be seen in the [.travis.yml](.travis.yml)
config file, using [babel-polyfill](https://babeljs.io/docs/usage/polyfill/).</sub>


## Dependencies and imports

redux-load-api has no dependencies, but is designed to work well with
[redux-apis](https://npmjs.org/package/redux-apis) v2.x.

```js
import { onload, load } from 'redux-load-api';
```

Or, using ES5 / `require`:

```js
var onload = require('redux-load-api').onload;
var load = require('redux-load-api').load;
```

## Usage

Use `@onload(callback)` (or `onload(callback)(Component)`) to associate loader functions
with (React) components. Somehow collect the components that need to be rendered on the
server (or have their data pre-loaded for some other reason) and pass them to `load`,
along with the parameters to make available to the load functions. Then wait for the
promise returned by `load` to fullfil. Once it does, your redux store will be initialized
and you can render the app fully hydrated.


### @onload(fn/*(params)*/ )

Often, we want to load some data into our redux-store before rendering our React
component. With the `@onload` [decorator](https://github.com/wycats/javascript-decorators),
we can associate a loader function with our component. This function will recieve
a `params` object as a parameter, containing the URL parameters it may need:

```js
class AppApi extends Api {someFunc(someParam){}}
const app = new AppApi({someState:'some state'});

@onload(params => app.someFunc(params.someParam))
class App extends React.Component {
    // ...
  }
}
```

The associated loader function will be collected and called later, by `load`.

<sub>*NOTE:* The spec for ES decorators in still in flux. Due to this,
Babel 6 has temporarily removed support from their core presets. For this
reason, if you are using Babel 6, you should install the Babel plugin
[babel-plugin-transform-decorators-legacy](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy)
which restores the functionality from Babel 5 until the spec is finalized
and we (maybe) have to change our code to match it (although I doubt it
will change for our use case, which is very simple).</sub>


### load(components, params)

The function we passed to `@onload` is not called by itself.
Instead, we cause it to be executed explicitly by calling `load`:

```js
// assuming App component from previous example...
const components = [App];
load(components, {someParam: 'Some parameter'});
```

`load` can easily be used in combination with React Router:

```js
match({ routes, location:req.url }, (err, redirect, renderProps) => {
  load(renderProps.components, renderProps.params);

  // at this point, the `load` function has been called on
  // those components matched by `match` that were decorated with `onload`
});
```

To support async loading (e.g. fetching from DB or remote server), you
use redux with async behavior in the same way you normally do (e.g. with
[redux-thunk](https://github.com/gaearon/redux-thunk)), making sure your
loader function returns a `Promise`. `load` will collect these promises
and return a promise of it's own that only fulfills when all promises
returned by the loader functions have completed.
We can wait for it to fulfill using it's `then`:

```js
match({ routes, location:req.url }, (err, redirect, renderProps) => {
  load(renderProps.components, renderProps.params).then(() => {
    // at this point, the loader functions have been called on
    // those components matched by `match` that were decorated
    // with `onload` and any returned promises have been fulfilled.
  });
});
```

For an example of server-side rendering with redux, redux-thunk, react,
react-router, redux-react and redux-apis, refer to the unit tests.


## See also

If you don't like to keep adding async state flags to all your Apis,
have a look at [redux-async-api](https://github.com/download/redux-async-api)
which offers an out-of-the-box Api ready to extend from or compose into
your own Apis.


## Feedback, suggestions, questions, bugs

Please visit the [issue tracker](https://github.com/download/redux-async-api/issues)
for any of the above. Don't be afraid about being off-topc.
Constructive feedback most appreciated!


## Copyright

© 2016, [Stijn de Witt](http://StijnDeWitt.com). Some rights reserved.


## License

[Creative Commons Attribution 4.0 (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)

