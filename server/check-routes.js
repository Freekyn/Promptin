const app = require('./server.js');

console.log('Available API routes:\n');

app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`)
  } else if (r.name === 'router') {
    r.handle.stack.forEach(function(route) {
      if (route.route) {
        const methods = Object.keys(route.route.methods).join(', ').toUpperCase();
        console.log(`${methods} /api${route.route.path}`);
      }
    });
  }
});