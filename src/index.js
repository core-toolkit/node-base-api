const http = require('http');
const express = require('express');

const CreateController = require('./cli/commands/create-controller');
const CreateRoutes = require('./cli/commands/create-routes');
const MakeHttpServer = require('./http/HttpServer');
const Router = require('./http/Router');
const ApiMiddleware = require('./middleware/ApiMiddleware');

module.exports = (app) => {

  app.registerType('Controller', 'Util', 'Core', 'UseCase');
  app.registerType('HttpServer', 'Util', 'Core', 'Controller', 'Service');
  app.registerType('Routes', 'HttpServer');

  app.addTypeMiddleware('Routes', (makeFn) => ({ HttpServer }) => HttpServer.HttpServer.applyRoutes(makeFn));

  app.register('HttpServer', 'HttpServer', MakeHttpServer(http, express, Router, ApiMiddleware));

  app.afterInit(({ Core: { Cli, Project } }) => {
    Cli.register([
      {
        name: 'create:controller',
        args: ['name'],
        description: 'Create new controller',
        exec: CreateController,
      },
      {
        name: 'create:routes',
        args: ['name'],
        description: 'Create new routes',
        exec: CreateRoutes,
      },
    ], true);

    if (!('node-base-api-ws' in Project.nodeBase.packages)) {
      Cli.register({
        name: 'enable:api-ws',
        async exec(args, { addBasePackage }) { await addBasePackage('api-ws', false, args); },
        description: 'Setup a WebSocket server',
      }, true);
    }
  });

  app.afterStart(({ HttpServer: { HttpServer } }) => HttpServer.start());
  app.beforeStop(({ HttpServer: { HttpServer } }) => HttpServer.stop());

  return app;
};
