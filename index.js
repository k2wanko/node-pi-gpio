
var fs = require('fs'),
    path = require('path'),
    Promise = require('es6-promise').Promise,
    promisify = require('es6-promisify'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var pfs = {};
['stat', 'writeFile', 'readFile']
  .forEach(function(method) {
    pfs[method] = promisify(fs[method])
  });

var gpioPath = '/sys/class/gpio/';

function makePath(pin) {
  return path.join(gpioPath, 'gpio' + pin);
}

var GPIO = module.exports = (function() {

  var _pin = null;
  var _direction = null;

  function GPIO(pin, direction) {

    if (!(this instanceof GPIO)) {
      return new GPIO(pin, direction);
    }

    // super
    EventEmitter.call(this);

    var self = this;
    var done = function(err) {
      if (err) {
        return self.emit('error', err);
      }

      self.emit('open', self);
    };

    if (!pin) {
      return done(new Error('Invalid option: pin'));
    }

    if (!direction) {
      return done(new Error('Invalid option: direction'));
    }
    
    _pin = pin;
    _direction = direction = direction || 'in';

    GPIO.export(pin)
      .then(function() {
        return GPIO.setDirection(pin, direction)
      })
      .then(done)
      .catch(done);
  }

  util.inherits(GPIO, EventEmitter);

  GPIO.prototype.value = function(val) {
    if (isNaN(Number(val))) {
      return GPIO.read(_pin)
    }

    return GPIO.write(_pin, val);
  };
  
  GPIO.prototype.direction = function(val) {
    if(!val) {
      return GPIO.getDirection(_pin);
    }

    return GPIO.setDirection(_pin, val);

  };
  
  GPIO.prototype.close = function() {};
  
  return GPIO;
  
})();


GPIO.open = function(pin, direction) {
  return new Promise(function(resolve, reject) {
    var gpio = new GPIO(pin, direction);

    gpio.once('error', reject);
    
    gpio.once('open', function() {
      resolve(gpio);
    });

  });
};

GPIO.isExport = function(pin) {
  var path = makePath(pin);
  return new Promise(function(resolve, reject){
    pfs.stat(path)
      .then(function(stats) {
        resolve(stats.isDirectory());
      })
      .catch(function(err) {
        if(!(err.code === 'ENOENT')) {
          return reject(err);
        }
        resolve(false);
      });
  });
};

GPIO.export = function(pin) {
  return GPIO.isExport(pin)
    .then(function(isExport) {
      if (isExport) {
        return null;
      }
      
      var _path = path.join(gpioPath, 'export');
      return pfs.writeFile(_path, pin);
    });
};

GPIO.unexport = function(pin) {
  return GPIO.isExport(pin)
    .then(function(isExport) {
      if (!isExport) {
        return null;
      }
      
      var _path = path.join(gpioPath, 'unexport');
      return pfs.writeFile(_path, pin)
    });
};

GPIO.getDirection = function(pin) {
  var dir = makePath(pin);
  return pfs.readFile(path.join(dir, 'direction'));
};

GPIO.setDirection = function(pin, direction) {
  var dir = makePath(pin);
  return pfs.writeFile(path.join(dir, 'direction'), direction);
};

GPIO.write = function(pin, val) {
  var dir = makePath(pin);
  return pfs.writeFile(path.join(dir, 'value'), val);
};

GPIO.read = function(pin, val) {
  var dir = makePath(pin);
  return pfs.readFile(path.join(dir, 'value'));
};

GPIO.util = {
  makePath: makePath,
  delay: function(time, val) {
    return new Promise(function(resolve, reject) {
      setInterval(resolve.bind(null, val), time);
    });
  }
};
