Board = require("board")
HexagonalSpace = require("spaces/hexagonal_space")

class HexagonalBoard extends Board

  space_constructor: HexagonalSpace

  constructor: (container, color, options, game_controller) ->
    super
    @board_size = options.board_size

  ########################################
  # Setup
  ########################################

  setup: ->
    vertical_radii = 3 * @board_size + 2
    horizontal_radii = 2 * (2 * @board_size + 1) * Math.cos(Math.PI/6)

    if @game_controller?.user_in_setup()
      @setup_rows = Math.floor(vertical_radii / 2 / 1.1)
      @setup_columns = Math.ceil(@setup_count() / @setup_rows)

      setup_horizontal_radii = @setup_columns * 2 * 1.1 + 0.1
    else
      setup_horizontal_radii = 0

    max_horizontal_radius = @max_board_width() / (horizontal_radii + setup_horizontal_radii)
    max_vertical_radius = @max_board_height() / vertical_radii

    @space_radius = Math.min.apply(null, [max_vertical_radius, max_horizontal_radius])

    @delta_x = @space_radius * Math.cos(Math.PI/6)
    @delta_y = @space_radius * 3/2

    @piece_size = @delta_x / Math.sqrt(2) * 2

    @setup_size = @space_radius * 2 * 1.1
    @setup_width = @space_radius * setup_horizontal_radii
    @board_width = @space_radius * horizontal_radii
    @board_height = @space_radius * vertical_radii

    @center =
      x: @board_width / 2
      y: @board_height / 2

    super

  ########################################
  # Add Spaces
  ########################################

  add_spaces: ->
    range = [0..2 * @board_size]
    for x in range
      for y in range
        sum = x + y
        continue if sum < @board_size
        break if sum > @board_size + 2 * @board_size
        @add_space({x: x, y: y})

  ########################################
  # Helpers
  ########################################

  position: ({x, y}) ->
    x -= @board_size
    y -= @board_size

    relative_x = x * 2 * @delta_x + y * @delta_x
    relative_y = y * @delta_y

    if @color is 'alabaster'
      relative_x *= -1
      relative_y *= -1

    x: @center.x + relative_x + @board_offset_x()
    y: @center.y + relative_y + @board_offset_y()

  territory: ({x,y}) ->
    if y is @board_size
      'neutral'
    else if y < @board_size
      'alabaster'
    else
      'onyx'

module.exports = HexagonalBoard
