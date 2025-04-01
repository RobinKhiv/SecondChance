const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      ws: true,
      onError: (err, req, res) => {
        console.log('Proxy Error:', err);
      }
    })
  );
}; 