
var fs = require('fs'),
    path = require('path'),
    Promise = require('es6-promise').Promise;

var gpioPath = '/sys/class/gpio/';

var GPIO = module.exports = (function(){
  
  var direction = null;

  function isExport(pin) {
  }
  
  function GPIO() {
  }

  GPIO.prototype.write = function(){};
  GPIO.prototype.read = function(){};
  GPIO.prototype.direction = function(val){};
  return GPIO;
  
});


GPIO.open = function(pin) {
  return new Promise(function(resolve, reject){
  });
};

GPIO.isExport = function(pin){
  var _path = path.join(gpioPath, 'gpio' + pin);
  return new Promise(function(resolve, reject){
    fs.stat(_path, function(err, stats){
      if (err) {
        if(!(err.code === 'ENOENT')) {
          return reject(err);
        }
        return resolve(false);
      }
      resolve(stats.isDirectory());
    });
  });
}
