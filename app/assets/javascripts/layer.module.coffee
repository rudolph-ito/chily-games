CoordinateMap = require('lib/coordinate_map')

class Layer

  constructor: (@board) ->
    @coordinate_map = new CoordinateMap
    @element = new Kinetic.Layer()
    @board.add_layer(@element)


  # Helpers


  clear: ({draw} = {}) ->
    @coordinate_map.clear()
    @element.removeChildren()
    @draw() if draw ? true


  draw: ->
    @element.draw()


  hide: ->
    @element.hide()


  show: ->
    @element.show()


  update: ({draw} = {}) ->
    child.update() for child in @coordinate_map.values()
    @draw() if draw ? true


module.exports = Layer
