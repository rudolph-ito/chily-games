Space = require('space')

class HexagonalSpace extends Space

  update_draw_options: ->
    super
    @radius = @board.space_radius

  draw: ->
    @space = new Kinetic.RegularPolygon
      x: @x
      y: @y
      radius: @radius
      sides: 6
      stroke: 'black'
      strokeWidth: 1
      coordinate: @coordinate

    super

  redraw: ->
    @update_draw_options()

    @space.attrs.x = @x
    @space.attrs.y = @y
    @space.attrs.radius = @radius

module.exports = HexagonalSpace
