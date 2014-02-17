Space = require('space')

class SquareSpace extends Space

  ############################################################
  # Init / Update
  ############################################################

  init: ->
    @element = new Kinetic.Rect
      stroke: '#000'
      strokeWidth: 1

    super

  update_size: ->
    @size = @board.space_size
    @element.attrs.offset = x: @size / 2, y: @size / 2
    @element.attrs.width = @size
    @element.attrs.height = @size

    super

  ############################################################
  # Helpers
  ############################################################

  contains: (x, y)->
    left_x = @x - @size / 2
    right_x = left_x + @size

    top_y = @y - @size / 2
    bottom_y = top_y + @size

    left_x <= x <= right_x && top_y <= y <= bottom_y

  terrain_offset: ->
    { x: 0, y: 0 }

module.exports = SquareSpace
