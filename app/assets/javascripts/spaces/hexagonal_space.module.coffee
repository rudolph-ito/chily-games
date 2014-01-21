Space = require('space')

class HexagonalSpace extends Space

  constructor: ->
    super
    @radius = @board.space_radius

  draw: ->
    @space = new Kinetic.RegularPolygon
      x: @x
      y: @y
      radius: @radius
      sides: 6
      fill: @color
      stroke: 'black'
      strokeWidth: 1
      coordinate: @coordinate

    @board.space_layer.add(@space)

module.exports = HexagonalSpace
