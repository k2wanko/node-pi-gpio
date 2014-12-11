
GPIO = require '../'

{delay, exit} = require './util'

pin = 24

gpio = null
GPIO.open pin, 'out'
.then (_gpio)->
  gpio = _gpio
  process.on 'exit', gpio.close
  
  return gpio.value 1
.then -> delay 3000
.then ->
  gpio.value 0
.then exit
.catch (err)->
  console.log 'err', err.stack
