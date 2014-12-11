

# [node-pi-gpio](https://www.npmjs.com/package/node-pi-gpio)

GPIO wrapper for Raspberry Pi

# Install

```
$ npm install -S node-pi-gpio
```

# Usage

L chika

```
GPIO = require 'node-pi-gpio'

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
```

button

```
GPIO = require 'node-pi-gpio'

Promise = require('es6-promise').Promise

led_pin = 24
button_pin = 25

Promise.all [GPIO.open(led_pin, 'out'), GPIO.open(button_pin, 'in')]
.then (res)->
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
```
