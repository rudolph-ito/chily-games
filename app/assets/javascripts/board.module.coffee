CoordinateMap = require('lib/coordinate_map')
Piece = require('piece')


class Board

  @preview: (container, variant_id, options) ->
    container = $(container)
    container.html('')

    path = "/api/variants/#{variant_id}/preview"
    if options.piece_type_id
      path += "?piece_type_id=#{options.piece_type_id}"
      for key, value of options.coord
        path += "&coord[#{key}]=#{value}"

    $.getJSON(path).done (data) =>
      board = @create(container, data.color, data.options)
      board.draw()

      if data.pieces
        board.draw_pieces(data.pieces)
        board.highlight_spaces(data.valid_plies, '#006633')
        board.highlight_spaces([data.pieces[0].coordinate], '#00CC00')

  @create: (container, color, options, game_controller = null) ->
    klass = require("boards/#{options.board_type}_board")
    new klass(container, color, options, game_controller)



  constructor: (container, @color, options, @game_controller) ->
    @container = $(container)
    @container.html('')

    @piece_types = options.piece_types
    @terrain_types = options.terrain_types


    @header_height = @footer_height = 30

    @piece_map = new CoordinateMap
    @space_map = new CoordinateMap
    @setup_pieces = []
    @setup_spaces = []

    @stage = new Kinetic.Stage container: @container[0]
    @space_layer = new Kinetic.Layer()
    @stage.add(@space_layer)
    @info_layer = new Kinetic.Layer()
    @stage.add(@info_layer)
    @piece_layer = new Kinetic.Layer()
    @stage.add(@piece_layer)

  max_board_height: ->
    @container.height() - @header_height - @footer_height

  max_board_width: ->
    @container.width()

  update_stage: ->
    @stage.setHeight @header_height + @board_height + @footer_height
    @stage.setWidth @setup_width + @board_width

  draw: ->
    @setup(@max_board_width(), @max_board_height())
    @update_stage()

    @draw_spaces()
    @space_layer.draw()

    if @game_controller
      @draw_header()
      @draw_footer()
      @info_layer.draw()

    @draw_setup() if @game_controller?.user_in_setup()

  # Used to redraw board after we are set
  redraw: ->
    @setup(@max_board_width(), @max_board_height())
    @update_stage()

    space.redraw() for space in @space_map.values()
    @space_layer.draw()

    piece.remove() for piece in @setup_pieces
    @setup_pieces = []
    piece.redraw() for piece in @piece_map.values()
    @piece_layer.draw()

    @redraw_header()
    @redraw_footer()
    @info_layer.draw()

  draw_spaces: ->
    # override

  draw_space: (coordinate) ->
    space = new @Space(@, {coordinate: coordinate})
    space.draw()
    # space.draw_coordinate()
    @space_map.set(coordinate, space)

  draw_terrains: (terrains) ->
    for terrain_data in terrains
      space = @space_map.get(terrain_data.coordinate)
      space.set_terrain(terrain_data.terrain_type_id)

  draw_pieces: (pieces) ->
    for piece_data in pieces
      piece = new Piece(@, piece_data)
      piece.draw()
      @piece_map.set(piece_data.coordinate, piece)

  draw_header: ->
    @header = new Kinetic.Text
      x: @setup_width
      y: 0
      width: @board_width
      height: @header_height - 5
      text: @game_controller.opponent_name()
      align: 'center'
      fontSize: @header_height - 9
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @info_layer.add(@header)

  redraw_header: ->
    @header.attrs.x = 0
    @header.attrs.width = @board_width

  draw_footer: ->
    @footer = new Kinetic.Text
      x: @setup_width
      y: @board_height + @header_height + 5
      width: @board_width
      height: @footer_height
      text: @game_controller.name()
      align: 'center'
      fontSize: @footer_height - 9
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @info_layer.add(@footer)

  redraw_footer: ->
    @footer.attrs.x = 0
    @footer.attrs.y = @board_height + @header_height + 5
    @footer.attrs.width = @board_width

  draw_setup: ->
    index = 0

    for piece_type_id in @piece_types
      row = Math.floor(index / @setup_columns) % @setup_rows
      column = index % @setup_columns

      x = column * @setup_size + @setup_size / 2
      y = @board_height + @header_height - row * @setup_size - @setup_size / 2

      piece = new Piece(@, {piece_type_id: piece_type_id, color: @color, x: x, y: y})
      piece.draw()
      @setup_pieces.push(piece)

      index++

    for terrain_type_id in @terrain_types
      row = Math.floor(index / @setup_columns) % @setup_rows
      column = index % @setup_columns
      x = column * @setup_size + @setup_size / 2
      y = @board_height + @header_height - row * @setup_size - @setup_size / 2

      space = new @Space(@, {x: x, y: y, terrain_type_id: terrain_type_id})
      space.draw()

  coord_eql: (a,b) ->
    Object.keys(a).all (k) -> a[k] == b[k]

  home_space: (coord) ->
    @territory(coord) == @color

  update_display: ->
    for space in @space_map.values()
      space.update_display() if @territory(space.coordinate) != @color

    @space_layer.draw()

  distance: (x1, x2, y1, y2) ->
    Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) )

  nearest_space: (x,y) ->
    for space in @space_map.values()
      return space if @in_space(space, x, y)

    null

  remove_piece_at: (coordinate) ->
    @piece_map.get(coordinate)?.remove()
    @piece_map.remove(coordinate)

  move_piece: (from, to) ->
    @remove_piece_at(to)

    piece = @piece_map.get(from)
    space = @space_map.get(to)
    piece.move_to_space(space)

    @piece_map.move(from, to)

    @deselect_piece()

  highlight_spaces: (coordinates, color) ->
    for coordinate in coordinates
      @space_map.get(coordinate)?.set_highlight(color)

    @space_layer.draw()

  dehighlight_spaces: ->
    for space in @space_map.values()
      space.set_highlight(null)

    @space_layer.draw()

  click: (coodinate) ->
    if @selected_piece?
      space = @space_map.get(coodinate)
      @selected_piece.try_move(space) if space.highlighted
      @deselect_piece()
    else
      piece = @piece_map.get(coodinate)
      @select_piece(piece)

  select_piece: (piece) ->
    @selected_piece = piece
    @game_controller.valid_piece_moves(piece.coordinate)

  deselect_piece: ->
    @selected_piece = null
    @dehighlight_spaces()


module.exports = Board