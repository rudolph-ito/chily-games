Space = require('space')

class HexagonalSpace extends Space

  constructor: ->
    super
    @radius = @board.space_radius

  draw: ->
    obj = new Kinetic.RegularPolygon
      x: @x
      y: @y
      radius: @radius
      sides: 6
      fill: @color
      stroke: 'black'
      strokeWidth: 1
      coordinate: @coordinate

    super obj

module.exports = HexagonalSpace