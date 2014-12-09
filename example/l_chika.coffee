
GPIO = require '../'

pin = 24

delay = GPIO.util.delay

exit = process.exit.bind process

gpio = null
GPIO.open pin, 'out'
.then (_gpio)->
  console.log 'open', gpio = _gpio
  process.on 'exit', ->
    process.nextTick ->
      gpio.close();
  return gpio.value 1
.then -> delay 3000
.then ->
  console.log 'delay 3000 end'
  gpio.value 0
.then exit
.catch (err)-> console.log 'err', err
