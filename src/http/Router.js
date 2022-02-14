const { METHODS } = require('http');
const methods = METHODS.map(method => method.toLowerCase()).concat('all');

const Errors = require('./Errors');

const AuthMiddleware = require('../middleware/AuthMiddleware');
const Middleware = {
  AuthMiddleware,
};

const wrap = (handler, apiMiddleware) => async (...args) => {
  args[1].Errors = Errors;

  try {
    const data = await handler(...args);
    apiMiddleware({ data }, ...args);
  } catch (error) {
    apiMiddleware({ error }, ...args);
  }
};

const Router = (express, apiMiddleware, useFallback = true) => {
  const rootRouter = express.Router();
  const routesRouter = express.Router();

  rootRouter.use(express.json());
  rootRouter.use(routesRouter);
  routesRouter.Middleware = Middleware;

  if (useFallback) {
    rootRouter
      .use((req, res, next) => next(new Errors.NotFound()))
      .use((error, req, res, next) => apiMiddleware({ error }, req, res, next));
  }

  return new Proxy(rootRouter, {
    get(_, prop, proxy) {
      if (prop === 'sub') {
        return (path) => {
          const sub = Router(express, apiMiddleware, false);
          routesRouter.use(path, sub);
          return sub;
        };
      }

      if (!methods.includes(prop)) {
        return routesRouter[prop];
      }

      return (path, ...middleware) => {
        const lastIndex = middleware.length - 1;
        if (typeof middleware[lastIndex] === 'function' && middleware[lastIndex].length < 4) {
          middleware[lastIndex] = wrap(middleware[lastIndex], apiMiddleware);
        }

        routesRouter[prop](path, ...middleware);
        return proxy;
      };
    },
  });
};

module.exports = Router;
