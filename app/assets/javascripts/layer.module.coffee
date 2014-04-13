CoordinateMap = require('lib/coordinate_map')

class Layer

  constructor: (@board) ->
    @element = new Kinetic.Layer()
    @board.add_layer(@element)

    @coordinate_map = new CoordinateMap

  draw: ->
    @element.draw()

  update: ->
    child.update() for child in @coordinate_map.values()
    @element.draw()

  clear: ->
    @coordinate_map.clear()

    @element.removeChildren()
    @element.draw()

module.exports = Layer
