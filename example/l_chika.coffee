
GPIO = require '../'

pin = 24

delay = GPIO.util.delay

GPIO.open pin, 'out'
.then (gpio)->
  console.log 'open', gpio
  process.on 'exit', ->
    process.nextTick ->
      gpio.close();
  return gpio
.then (gpio)->
  console.log 'set value start'
  gpio.value 1
.then (gpio)-> delay 3000, gpio
.then (gpio)->
  console.log 'delay 3000 end'
  gpio.value 0
.then process.exit
.catch (err)-> console.log 'err', err
  
