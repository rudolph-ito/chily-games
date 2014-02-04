Space = require('space')

class HexagonalSpace extends Space

  update_draw_options: ->
    super
    @radius = @board.space_radius
    @size = @radius * 2

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
    super
    @update_draw_options()

    @space.attrs.x = @x
    @space.attrs.y = @y
    @space.attrs.radius = @radius

  terrain_offset: (width, height) ->
    { x: width / 2, y: height / 2 }

module.exports = HexagonalSpace
