Space = require('space')

class SquareSpace extends Space

  update_draw_options: ->
    super
    @size = @board.space_size

  draw: ->
    @space = new Kinetic.Rect
      x: @x
      y: @y
      offset:
        x: @size / 2
        y: @size / 2
      width: @size
      height: @size
      stroke: 'black'
      strokeWidth: 1
      coordinate: @coordinate

    super

  redraw: ->
    @update_draw_options()

    @space.attrs.x = @x
    @space.attrs.y = @y
    @space.attrs.offset.x = @size / 2
    @space.attrs.offset.y = @size / 2
    @space.attrs.width = @size
    @space.attrs.height = @size

module.exports = SquareSpace
