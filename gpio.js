
var fs = require('fs'),
    path = require('path'),
    Promise = require('es6-promise').Promise,
    promisify = require('es6-promisify'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    debug = require('debug')('node-pi-gpio');

var pfs = {};
['stat', 'writeFile', 'readFile']
  .forEach(function(method) {
    pfs[method] = promisify(fs[method])
  });

var gpioPath = '/sys/class/gpio/';

function makePath(pin) {
  return path.join(gpioPath, 'gpio' + pin);
}

var Watcher = (function() {

  function Watcher(pin, options, listener) {

    this.pin = pin;
    this.options = options || {
      interval: 107
    };
    this.listener = listener;

    Watchers[pin] = this;
  }

  Watcher.prototype.start = function() {
    debug('Watcher', 'start', this.timer, !Watchers[this.pin]);
    if (this.timer) {
      return;
    }

    if(!Watchers[this.pin]) {
      return;
    }

    var self = this;
    var interval = this.options.interval;
    var value;
    this.timer = setInterval(function() {
      GPIO.read(self.pin)
        .then(function(val) {
          if (value !== val) {
            self.listener.call(null, val);
            value = val;
          }
        });
    }, interval);
    return this;
  };

  Watcher.prototype.close = function() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
    return this;
  };

  return Watcher;
  
})();

var Watchers = {};

var GPIO = module.exports = (function() {

  var _pin = null;
  var _direction = null;

  function GPIO(pin, direction) {

    debug('init', 'pin', pin, 'direction', direction);
    
    if (!(this instanceof GPIO)) {
      return new GPIO(pin, direction);
    }

    // super
    EventEmitter.call(this);

    var self = this;
    var done = function(err) {
      if (err) {
        debug('done', 'err', err.stack);
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
    
    _pin = this._pin = pin;
    _direction = this._direction = direction;

    GPIO.export(pin)
      .then(this.direction(direction))
      .then(function() {

        if (direction !== GPIO.IN) return null;
        
        GPIO.watch(pin, function(val) {
          debug('watch', 'val', val);
          self.emit('change', val);
        });
        return null;
      })
      .then(function() { done(); })
      .catch(done);
  }

  util.inherits(GPIO, EventEmitter);

  GPIO.prototype.value = function(val) {
    debug('value', 'pin', this._pin, 'val', val);
    if (isNaN(Number(val))) {
      return GPIO.read(this._pin)
    }

    return GPIO.write(this._pin, val);
  };
  
  GPIO.prototype.direction = function(val) {
    debug('direction', 'pin', this._pin, 'val', val);
    
    if(!val) {
      return GPIO.getDirection(this._pin);
    }

    return GPIO.setDirection(this._pin, val);

  };
  
  GPIO.prototype.close = function() {
    debug('close', 'pin', this._pin);
    
    return GPIO.unexport(_pin);
  };
  
  return GPIO;
  
})();

GPIO.IN = 'in';
GPIO.OUT = 'out';

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
    })
    .then(function(){
      
      return null;
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
  return pfs.readFile(path.join(dir, 'value')).then(function(res) {return res.toString('utf8')});
};

GPIO.watch = function(pin, listener) {
  var dir = makePath(pin);
  var options = {
    interval: 10
  };
  var _path = path.join(dir, 'value');
  debug('GPIO.watch', 'start', 'filename', _path);
  new Watcher(pin, options, function(val) {
    debug('GPIO.watch', 'change', val);
    listener(val);
  }).start();
};

GPIO.util = {
  makePath: makePath,
  delay: function(time, val) {
    return new Promise(function(resolve, reject) {
      setTimeout(resolve.bind(null, val), time);
    });
  }
};
