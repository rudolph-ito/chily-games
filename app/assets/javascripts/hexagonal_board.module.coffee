Board = require("board")
HexagonalSpace = require("hexagonal_space")

class HexagonalBoard extends Board

  Space: HexagonalSpace

  constructor: (@game) ->
    super
    @board_size = @game.board_size

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

  coord_to_s: (coord) ->
    "#{coord.x},#{coord.y},#{coord.z}"

  inSpace: (space, x, y) ->
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

    [real_x, real_y]

  # Set all the instance variables used to build the board
  setup: (max_width, max_height) ->
    min_row = @board_size
    max_row = 2 * @board_size - 1

    @space_radius = max_height / (min_row + max_row)

    @delta_x = @space_radius * Math.cos(Math.PI/6)
    @delta_y = @space_radius * 3/2

    @piece_size = @delta_x / Math.sqrt(2) * 2

    @width = @delta_x * 2 * max_row + 2
    @height = max_height

module.exports = HexagonalBoard