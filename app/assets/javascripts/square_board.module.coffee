Board = require("board")
SquareSpace = require("square_space")

class SquareBoard extends Board

  Space: SquareSpace

  constructor: (@game) ->
    super
    @board_columns = @game.board_columns
    @board_rows = @game.board_rows

  draw_spaces: ->
    for x in [0...@board_columns]
      for y in [0...@board_rows]
        @draw_space({x: x, y: y})

  coord_to_s: (coord) ->
    "#{coord.x},#{coord.y}"

  inSpace: (space, x, y)->
    0 <= x <= @width && 0 <= y <= @height

  position: ({x, y}) ->
    relative_x = x * @space_size + @space_size / 2
    relative_y = y * @space_size + @space_size / 2

    if @color is 'onyx'
      real_x = relative_x
      real_y = relative_y
    else
      real_x = @width - relative_x
      real_y = @height - relative_y

    [real_x, real_y]

  # Set all the instance variables used to build the board
  setup: (max_width, max_height) ->
    max_space_width = max_width / @board_columns
    max_space_height = max_height / @board_rows

    @space_size = if max_space_width > max_space_height then max_space_height else max_space_width
    @piece_size = @space_size * 0.9

    @width = @space_size * @board_columns + 2
    @height = @space_size * @board_rows + 2

module.exports = SquareBoard