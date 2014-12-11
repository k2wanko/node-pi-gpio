
GPIO = require '../'

pin = 24

time = 500

_loop = (gpio, val)->
  gpio.value val
  setTimeout _loop, time, gpio, (unless val then 1 else 0)

GPIO.open pin, 'out'
.then (gpio)->
  process.on 'SIGINT', ->
    gpio.value 0
    gpio.close()
    .then ->
      process.exit()
  _loop(gpio, 1)
  return
.catch (err)->
  console.log 'err', err.stack
