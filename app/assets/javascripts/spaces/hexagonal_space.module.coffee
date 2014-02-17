Space = require('space')

class HexagonalSpace extends Space

  ############################################################
  # Init / Update
  ############################################################

  init: ->
    @element = new Kinetic.RegularPolygon
      sides: 6
      stroke: '#000'
      strokeWidth: 1

    super

  update_size: ->
    @radius = @board.space_radius
    @size = @radius * 2
    @element.attrs.radius = @radius

    super

  ############################################################
  # Helpers
  ############################################################

  contains: (x, y) ->
    @distance(@x, x, @y, y) <= @radius * Math.cos(Math.PI/6)

  distance: (x1, x2, y1, y2) ->
    Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) )

  terrain_offset: (width, height) ->
    { x: width / 2, y: height / 2 }

module.exports = HexagonalSpace
