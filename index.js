const compose = require('koa-compose');
const os = require('os');
const path = require('path');
const appRootPath = require('app-root-path');
const package_json = require(appRootPath + path.sep +'package.json');

const HEALTH_PATH = '/health';
const ENV_PATH = '/env';
const INFO_PATH = '/info';
const SECURE_PROP_NAMES = ['admin', 'user', 'password', 'pass', 'pwd', 'login', 'username'];

/**
 * Writes {status: 'UP'} to response body if request path is /health
 */
async function health(ctx, next) {
  if (HEALTH_PATH == ctx.path)
    ctx.body = {status: 'UP'};
  else
    await next();
}

/**
 * Exposes environment properties. Secure variables (such as 'user', 'password', 'pass' etc are) values will be hidden.
 */
async function env(ctx, next) {
  if (ENV_PATH == ctx.path) {
    const envCopy = JSON.parse(JSON.stringify(process.env)); //deep copy
    Object
      .keys(envCopy)
      .filter(property => {
        const propLowerCase = property.toLowerCase();
        for(let i in SECURE_PROP_NAMES) {
          if (propLowerCase.includes(SECURE_PROP_NAMES[i]))
            return true;
        }
        return false;
      })
      .forEach(property => {envCopy[property] = '*******'}); //hide secure details
    ctx.body = envCopy;
  } else {
    await next();
  }
}

/**
 * Exposes application and resources information. E.g. name, version, memory and CPU usage
 */
async function info(ctx, next) {
  if (INFO_PATH == ctx.path) {
    ctx.body = {
      timestamp: Date.now(),
      uptime: process.uptime(),

      application: {
        name: package_json.name,
        version: package_json.version,
        pid: process.pid,
        title: process.title,
        argv: process.argv,
        node_env: process.env.NODE_ENV
      },

      resources: {
        memory: process.memoryUsage(),
        loadavg: os.loadavg(),
        cpu: JSON.stringify(os.cpus()),
        nics: JSON.stringify(os.networkInterfaces())
      }
    };
  } else {
    await next();
  }
}

module.exports = compose([health, env, info]);