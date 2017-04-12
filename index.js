'use strict';

const App = require('./client');
const browserify = require('browserify');
const { databaseURL } = require('./firebaseConfig');
const fs = require('fs');
const { h } = require('preact');
const http = require('http');
const { render } = require('preact-render-to-string');
const superagent = require('superagent');

let js = '';

const server = http.createServer((req, res) => {
  if (req.url === '/client.js') {
    return res.end(js);
  }
  if (req.url === '/style.css') {
    return res.end(fs.readFileSync('./style.css', 'utf8'))
  }

  const getData = Promise.all([
    superagent.get(`${databaseURL}/people.json`),
    superagent.get(`${databaseURL}/timeline.json`)
  ]);

  getData.then(result => {
    let [people, timeline] = result.map(res => res.body);
    timeline = Object.keys(timeline || {}).map(key => timeline[key]);
    const html = render(h(App, { people, timeline }));
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pushups.js</title>
          <link rel="stylesheet" href="/style.css" />
        </head>
        <body>
          <div id="container">${html}</div>
          <script src="/client.js"></script>
        </body>
      </html>
    `);
  }).catch(error => res.end(error.stack))
});

require('child_process').execSync('npm run build');

browserify('./client.js').bundle((error, res) => {
  if (error) {
    throw error;
  }
  js = res;
  server.listen(3000);
  console.log('Server started on port 3000');
});
