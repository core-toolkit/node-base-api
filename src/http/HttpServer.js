module.exports = (http, express, Router, ApiMiddleware) => ({ Core: { Config }, Controller, Service, Log }) => {
  const router = Router(express, ApiMiddleware(Log));
  const app = express().use(router);
  const server = http.createServer(app);

  if ('AuthService' in Service) {
    router.use(Service.AuthService.getUserTokenMiddleware());
  }

  return {
    server,
    applyRoutes: (applyFn) => applyFn(router, Controller),
    start: () => server.listen(Config.api.port, () => Log.info(`Listening on port ${Config.api.port}`)),
    stop: () => server.close(),
  };
};

