Board = require("board")
SquareSpace = require("spaces/square_space")

class SquareBoard extends Board

  Space: SquareSpace

  constructor: (container, color, options, game_controller) ->
    super
    @board_columns = options.board_columns
    @board_rows = options.board_rows

  ########################################
  # Setup
  ########################################

  setup: (max_width, max_height) ->
    if @game_controller?.user_in_setup()
      @setup_rows = @board_rows
      @setup_columns = Math.ceil((@piece_types.length + @terrain_types.length) / @board_rows)

      setup_spaces = @setup_columns
      setup_padding = 10
    else
      setup_spaces = 0
      setup_padding = 0

    max_space_width = (@max_board_width() - setup_padding) / (@board_columns + setup_spaces)
    max_space_height = @max_board_height() / @board_rows

    @space_size = Math.min.apply(null, [max_space_width, max_space_height])
    @piece_size = @space_size * 0.9

    @setup_size = @space_size
    @setup_width = @space_size * setup_spaces + setup_padding
    @board_width = @space_size * @board_columns
    @board_height = @space_size * @board_rows

    super

  ########################################
  # Add Spaces
  ########################################

  add_spaces: ->
    for x in [0...@board_columns]
      for y in [0...@board_rows]
        @add_space({x: x, y: y})

  ########################################
  # Helpers
  ########################################

  position: ({x, y}) ->
    board_x = x * @space_size + @space_size / 2
    board_y = y * @space_size + @space_size / 2

    if @color is 'alabaster'
      board_x = @board_width - board_x
      board_y = @board_height - board_y

    x: board_x + @board_offset_x()
    y: board_y + @board_offset_y()

  territory: ({x,y}) ->
    if @board_rows % 2 is 1 and y == Math.floor(@board_rows / 2)
      'neutral'
    else if y < @board_rows / 2
      'alabaster'
    else
      'onyx'



module.exports = SquareBoard
