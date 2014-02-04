Board = require("board")
SquareSpace = require("spaces/square_space")

class SquareBoard extends Board

  Space: SquareSpace

  constructor: (container, color, options, game_controller) ->
    super
    @board_columns = options.board_columns
    @board_rows = options.board_rows

  draw_spaces: ->
    for x in [0...@board_columns]
      for y in [0...@board_rows]
        @draw_space({x: x, y: y})

  in_space: (space, x, y)->
    left_x = space.x - space.size / 2
    right_x = left_x + space.size

    top_y = space.y - space.size / 2
    bottom_y = top_y + space.size

    left_x <= x <= right_x && top_y <= y <= bottom_y

  position: ({x, y}) ->
    relative_x = x * @space_size + @space_size / 2
    relative_y = y * @space_size + @space_size / 2

    if @color is 'onyx'
      real_x = relative_x + @setup_width
      real_y = relative_y
    else
      real_x = @board_width - relative_x + @setup_width
      real_y = @board_height - relative_y

    [real_x, real_y + @header_height]

  territory: ({x,y}) ->
    if @board_rows % 2 is 1 and y == Math.floor(@board_rows / 2)
      'neutral'
    else if y < @board_rows / 2
      'alabaster'
    else
      'onyx'

  # Set all the instance variables used to build the board
  setup: (max_width, max_height) ->
    padding = 2

    if @game_controller?.user_in_setup()
      @setup_rows = @board_rows
      @setup_columns = Math.ceil((@piece_types.length + @terrain_types.length) / @board_rows)

      setup_spaces = @setup_columns
      setup_padding = 10
    else
      setup_spaces = 0
      setup_padding = 0

    max_space_width = (max_width - padding - setup_padding) / (@board_columns + setup_spaces)
    max_space_height = (max_height - padding) / @board_rows

    @space_size = Math.min.apply(null, [max_space_width, max_space_height])
    @piece_size = @space_size * 0.9

    @setup_size = @space_size
    @setup_width = @space_size * setup_spaces + setup_padding
    @board_width = @space_size * @board_columns + padding
    @board_height = @space_size * @board_rows + padding

module.exports = SquareBoard
