Board = require("board")
HexagonalSpace = require("spaces/hexagonal_space")

class HexagonalBoard extends Board

  Space: HexagonalSpace

  constructor: ->
    super
    @board_size = @data.board_size

  draw_spaces: ->
    @draw_space {x: 0, y: 0, z: 0}

    for n in [1...@board_size]
      @draw_space {x: n, y: 0, z: 0}
      @draw_space {x: 0, y: n, z: 0}
      @draw_space {x: 0, y: 0, z: n}
      @draw_space {x: -n, y: 0, z: 0}
      @draw_space {x: 0, y: -n, z: 0}
      @draw_space {x: 0, y: 0, z: -n}

    for i in [1...(@board_size/2)]
      @draw_space {x: i, y: i, z: 0}
      @draw_space {x: 0, y: i, z: i}
      @draw_space {x: -i, y: 0, z: i}
      @draw_space {x: -i, y: -i, z: 0}
      @draw_space {x: 0, y: -i, z: -i}
      @draw_space {x: i, y: 0, z: -i}

      for j in [(i+1)...(@board_size-i)]
        @draw_space {x: j, y: i, z: 0}
        @draw_space {x: i, y: j, z: 0}
        @draw_space {x: 0, y: i, z: j}
        @draw_space {x: 0, y: j, z: i}
        @draw_space {x: -i, y: 0, z: j}
        @draw_space {x: -j, y: 0, z: i}
        @draw_space {x: -j, y: -i, z: 0}
        @draw_space {x: -i, y: -j, z: 0}
        @draw_space {x: 0, y: -i, z: -j}
        @draw_space {x: 0, y: -j, z: -i}
        @draw_space {x: i, y: 0, z: -j}
        @draw_space {x: j, y: 0, z: -i}

  in_space: (space, x, y) ->
    @distance(space.attrs.x, x, space.attrs.y, y) <= @space_radius

  position: ({x, y, z}) ->
    relative_x = x * 2 * @delta_x + y * @delta_x + z * -@delta_x
    relative_y = y * -@delta_y + z * -@delta_y

    if @color is 'onyx'
      real_x = @center.x + relative_x
      real_y = @center.y + relative_y
    else
      real_x = @center.x - relative_x
      real_y = @center.y - relative_y

    [real_x, real_y + @board_padding_top()]

  territory: ({x,y,z}) ->
    if y is 0 and z is 0
      'neutral'
    else if y >= 0 && z >= 0
      'alabaster'
    else
      'onyx'

  # Set all the instance variables used to build the board
  setup: (max_width, max_height) ->
    padding = 2

    vertical_radii = 3 * @board_size - 1
    horizontal_radii = 2 * (2 * @board_size - 1) * Math.cos(Math.PI/6)

    if @data.action is 'setup'
      @setup_rows = Math.floor(vertical_radii / 2)
      @setup_columns = Math.ceil(@data.piece_types.length / @setup_rows)

      setup_horizontal_radii = @setup_columns * 2
      setup_padding = 10
    else
      setup_horizontal_radii = 0
      setup_padding = 0

    max_vertical_radius = (max_height - padding) / vertical_radii
    max_horizontal_radius = (max_width - padding - setup_padding) / (horizontal_radii + setup_horizontal_radii)

    @space_radius = Math.min.apply(null, [max_vertical_radius, max_horizontal_radius])

    @delta_x = @space_radius * Math.cos(Math.PI/6)
    @delta_y = @space_radius * 3/2

    @piece_size = @delta_x / Math.sqrt(2) * 2

    @setup_size = @delta_y
    @setup_width = @space_radius * setup_horizontal_radii + setup_padding
    @board_width = @space_radius * horizontal_radii + padding
    @board_height = @space_radius * vertical_radii + padding

    @center =
      x: @setup_width + @board_width / 2
      y: @board_height / 2

module.exports = HexagonalBoard
