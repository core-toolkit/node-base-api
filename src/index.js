const express = require('express');

const CreateController = require('./cli/commands/create-controller');
const CreateRoutes = require('./cli/commands/create-routes');
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

  const { start, initAll } = app;

  app.initAll = async () => {
    const { Core: { Cli } } = await app.resolveDependencies(['Core']);
    if (!Cli.list().includes('create:controller')) {
      Cli.register({
        name: 'create:controller',
        args: ['name'],
        describe: 'Create new controller',
        exec: CreateController,
      });
    }
    if (!Cli.list().includes('create:routes')) {
      Cli.register({
        name: 'create:routes',
        args: ['name'],
        describe: 'Create new routes',
        exec: CreateRoutes,
      });
    }

    return initAll();
  };

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
