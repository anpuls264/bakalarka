const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy for Shelly device RPC calls
  app.use(
    '/rpc',
    createProxyMiddleware({
      target: 'http://192.168.0.144',
      changeOrigin: true,
      pathRewrite: {
        '^/rpc': '/rpc', // Adjust the path as needed
      },
    })
  );
  
  // Proxy for server API calls
  app.use(
    '/device',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    })
  );
  
  // Proxy for server metrics API calls
  app.use(
    '/items',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    })
  );
};
