Space = require('space')

class SquareSpace extends Space

  constructor: ->
    super
    @size = @board.space_size

  draw: ->
    obj = new Kinetic.Rect
      x: @x
      y: @y
      offset:
        x: @size / 2
        y: @size / 2
      width: @size
      height: @size
      fill: @color
      stroke: 'black'
      strokeWidth: 1
      coordinate: @coordinate

    super obj


module.exports = SquareSpace