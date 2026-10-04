const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
console.log("ROOT is: " + ROOT);
console.log("index.html exists: " + fs.existsSync(path.join(ROOT,'index.html')));
http.createServer((req, res) => {
  const fp = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  console.log("Request: " + req.url + " -> " + fp);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, {'Content-Type':'text/html'});
    fs.createReadStream(fp).pipe(res);
  } else {
    res.writeHead(404); res.end("Not found: " + fp);
  }
}).listen(3000, '0.0.0.0', () => console.log("DEBUG server running on :3000"));