
GPIO = require '../'
Promise = require('es6-promise').Promise


led_pin = 24
button_pin = 25

Promise.all [GPIO.open(led_pin, 'out'), GPIO.open(button_pin, 'in')]
.then (res)->
  console.log 'open'
  [led, button] = res
  
  process.on 'SIGINT', ->
    led.value 0
    Promise.all [led.close(), button.close()]
    .then ->
      process.exit()

  button.on 'change', (val)->
    console.log 'change', val
    led.value val
.catch (err)->
    console.log 'err', err.stack

