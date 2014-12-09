
GPIO = require '../'

pin = 24

GPIO.isExport pin
.then (isExport)->
  console.log isExport
