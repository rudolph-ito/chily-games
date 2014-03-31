CoordinateMap = require('lib/coordinate_map')
Layer = require('layer')

class SpaceLayer extends Layer

  constructor: ->
    super
    @coordinate_map = new CoordinateMap

  add: (coordinate) ->
    attrs =
      board: @board
      coordinate: coordinate
      display_type: 'space'
      layer: @layer

    space = new @board.space_constructor(attrs)
    @element.add(space.element)
    @coordinate_map.set(space.coordinate, space)

module.exports = SpaceLayer
