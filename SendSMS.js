let plivo = require('plivo');
let client = new plivo.Client('MAMWU1M2FKMZCXMWUZOG','YjNlZTkzYTMxODE2MTcwNDk4OGRlOWFmMjczMGIy');

client.messages.create(
  '16028062506',
  '15127884684',
  'Hello, world!'
).then(function(message_created) {
  console.log(message_created)
});