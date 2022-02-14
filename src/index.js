const express = require('express');

const Router = require('./http/Router');
const ApiMiddleware = require('./middleware/ApiMiddleware');

module.exports = (app) => {
  // Defer applying routes until all controllers are ready
  const routes = [];
  app.applyRoutes = (applyFn) => void(routes.push(applyFn));

  app.registerType('Controller', 'Util', 'Core', 'UseCase');

  // Register routes as a distinct type so that they can be created through the CLI
  // but prevent actually registering them as app components
  app.registerType('Routes');
  app.addTypeMiddleware('Routes', () => {
    throw new Error('Routes cannot be registered with `app.register()`, use `app.applyRoutes(routeFn)` instead');
  });

  const { start } = app;
  app.start = async () => {
    await start();

    const {
      Core: {
        Config,
        Logger: { HttpServer: Log },
      },
      Service,
      Controller,
    } = await app.resolveDependencies(['Core', 'Service', 'Controller']);

    const router = Router(express, ApiMiddleware(Log));

    if ('AuthService' in Service) {
      router.use(Service.AuthService.getUserTokenMiddleware());
    }

    // Replace the deferred implementation with an immediate one
    app.applyRoutes = (applyFn) => applyFn(router, Controller);

    // Actually apply routes
    routes.forEach(app.applyRoutes);

    const api = express().use(router);
    api.listen(Config.api.port, () => Log.info(`Listening on port ${Config.api.port}`));
  };

  return app;
};
