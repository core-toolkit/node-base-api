module.exports = (express, Router, ApiMiddleware) => ({ Core: { Config }, Controller, Service, Log }) => {
  const router = Router(express, ApiMiddleware(Log));
  const server = express().use(router);

  if ('AuthService' in Service) {
    router.use(Service.AuthService.getUserTokenMiddleware());
  }

  return {
    applyRoutes: (applyFn) => applyFn(router, Controller),
    start: () => server.listen(Config.api.port, () => Log.info(`Listening on port ${Config.api.port}`)),
    stop: () => server.close(),
  };
};

