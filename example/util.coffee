

GPIO = require '../'

module.exports=
  exit: process.exit.bind process
  delay: GPIO.util.delay
