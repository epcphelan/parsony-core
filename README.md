#parsony
## An API engine for the Parsony Rapid Development Framework.

Parsony helps develops quickly develop services that
expose both JSON/RPC and RESTful API Endpoints.

1. Self-documenting with searchable API documentation.
2. Provides tiered, multi-layered request validation and authorization.
3. SHA256 encrypted request Signing.
4. Interface and Handler based endpoint definition and implementation.
4. Built-in support for:
    * Scheduled processes using cron.
    * Transactional emails
    * SMS via Twilio

Parsony Framework also includes a CLI Tool and Web App Starter Kit including React/Redux along with Semantic UI.

### Installation
```
$ npm install --save
```

### Usage
```js
const path = require('path');

global.base = __dirname + path.sep;
global.parsony = require('parsony');


const settings = {
  files:{
    configs:      path.join(__dirname, 'config.json'),
    _404:         path.join(__dirname, 'static','404.html')
  },
  directories:{
    models:       path.join(__dirname, 'models'),
    services:     path.join(__dirname, 'services'),
    scheduled:    path.join(__dirname, 'scheduled'),
    www:          path.join(__dirname, 'static'),
    templates:    path.join(__dirname, 'templates')
  }
};

try{
  parsony.init(settings);
  parsony.start()
    .then(app =>{})
    .catch(e => {
      console.error(e.message);
      process.exit();
    });
}
catch(e){
  console.error(e.message);
  process.exit();
}
```

### Documentation
Documentation on the use of Parsony-Core can be found at [Parsony WebServices](https://github.com/epcphelan/parsony-services-starter)