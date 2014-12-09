
var fs = require('fs'),
    path = require('path'),
    Promise = require('es6-promise').Promise,
    promisify = require('es6-promisify'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var pfs = {};
['stat', 'writeFile']
  .forEach(function(method) {
    pfs[method] = promisify(fs[method])
  });

var gpioPath = '/sys/class/gpio/';

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
    _direction = direction;

    GPIO.export(pin)
      .then(done)
      .catch(done);
  }

  util.inherits(GPIO, EventEmitter);

  GPIO.prototype.value = function(val) {
    var self = this;
    return new Promise(function(resolve, reject) {
      console.log('val', val);
      resolve(self);
    });
  };
  
  GPIO.prototype.direction = function(val) {
    if(!val) {
      return _direction;
    }

    //ToDo: write

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
  var path = GPIO.util.makePath(pin);
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
  return new Promise(function(resolve, reject) {
    GPIO.isExport(pin)
      .then(function(isExport) {
        if (isExport) {
          return resolve();
        }

        var _path = path.join(gpioPath, 'export');
        return pfs.writeFile(_path, pin).then(resolve)
      })
      .catch(reject);
  });
};

GPIO.unexport = function(pin) {
  return new Promise(function(resolve, reject) {
    GPIO.isExport(pin)
      .then(function(isExport) {
        if (!isExport) {
          return resolve();
        }

        var _path = path.join(gpioPath, 'unexport');
        return pfs.writeFile(_path, pin).then(resolve)
      })
      .catch(reject);
  });
};

GPIO.write = function(pin, val) {
  var dir = makePath(pin);
  pfs.writeFile(path.join(dir, 'value'), val);
};

GPIO.util = {
  makePath: function(pin) {
    return path.join(gpioPath, 'gpio' + pin);
  },
  delay: function(time, val) {
    return new Promise(function(resolve, reject) {
      setTimeout(resolve(val), time);
    });
  }
};
