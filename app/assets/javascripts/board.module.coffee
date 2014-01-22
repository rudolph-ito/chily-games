CoordinateMap = require('lib/coordinate_map')
Piece = require('piece')


class Board

  @preview: (container, variant_id, options) ->
    container = $(container)
    container.html('')

    path = "/variants/#{variant_id}/preview"
    if options.piece_type_id
      path += "?piece_type_id=#{options.piece_type_id}"
      for key, value of options.coord
        path += "&coord[#{key}]=#{value}"

    $.getJSON(path).done (data) =>
      board = @create(container, data)
      board.draw()


  @create: (container, data, gameController = null) ->
    klass = require("boards/#{data.board_type}_board")
    new klass(container, data, gameController)



  constructor: (@container, @data, @game_controller) ->
    @container = $(container)

    @board_type = @data.board_type
    @color = @data.color ? 'onyx'
    @pieces = @data.pieces ? []
    @terrain = @data.terrain ? []
    @valid_plies = @data.valid_plies ? []

    @piece_map = new CoordinateMap
    @space_map = new CoordinateMap

  draw: ->
    @header_height = @footer_height = 25
    @header_padding = @footer_padding = 5

    max_board_width = @container.width()
    max_board_height = @container.height() - @header_height - @header_padding - @footer_padding - @footer_height

    @setup(max_board_width, max_board_height)

    @stage = new Kinetic.Stage container: @container[0]
    @stage.setHeight @header_height + @header_padding + @board_height + @footer_height  + @footer_padding
    @stage.setWidth @board_width + @setup_width

    @space_layer = new Kinetic.Layer()
    @stage.add(@space_layer)

    @info_layer = new Kinetic.Layer()
    @stage.add(@info_layer)

    @piece_layer = new Kinetic.Layer()
    @stage.add(@piece_layer)

    if @game_controller
      @draw_header()
      @draw_footer()
      @info_layer.draw()

    @draw_spaces()
    @space_layer.draw()

    @draw_pieces()
    @draw_setup() if @data.action == 'setup'

  board_padding_top: ->
    @header_height + @header_padding

  draw_spaces: ->
    # override

  draw_space: (coordinate) ->
    space = new @Space(@, coordinate)
    space.draw()
    # space.draw_coordinate()
    @space_map.set(coordinate, space)

  draw_pieces: ->
    for piece_data in @pieces
      piece = new Piece(@, piece_data)
      piece.draw()
      @piece_map.set(piece_data.coordinate, piece)

  draw_header: ->
    header = new Kinetic.Text
      x: @setup_width
      y: 0
      width: @board_width
      height: @header_height
      text: if @data.color == 'alabaster' then @data['onyx_name'] else @data['alabaster_name']
      align: 'center'
      fontSize: @footer_height - 4
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @info_layer.add(header)

  draw_footer: ->
    footer = new Kinetic.Text
      x: @setup_width
      y: @board_height + @header_height + @header_padding + @footer_padding
      width: @board_width
      height: @footer_height
      text: @data[@data.color + '_name']
      align: 'center'
      fontSize: @footer_height - 4
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @info_layer.add(footer)

  draw_setup: ->
    for piece_type_id, index in @data.piece_types
      row = Math.floor(index / @setup_columns) % @setup_rows
      column = index % @setup_columns

      x = column * @setup_size + @setup_size / 2
      y = @board_height + @board_padding_top() - row * @setup_size - @setup_size / 2

      piece = new Piece(@, {piece_type_id: piece_type_id, color: @data.color, x: x, y: y})
      piece.draw()

  coord_eql: (a,b) ->
    Object.keys(a).all (k) -> a[k] == b[k]

  home_space: (coord) ->
    @territory(coord) == @data.color

  space_color: (coord) ->
    if @data.action == 'setup'
      color = @territory(coord)
      if color == 'neutral'
        '#A8A8A8'
      else if color == @data.color
        '#FFFFFF'
      else
        '#505050'
    else if @valid_plies.any( (x) => @coord_eql(x, coord) )
      '#99FF99'
    else
      '#FFFFFF'

  distance: (x1, x2, y1, y2) ->
    Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) )

  nearest_space: (x,y) ->
    for space in @space_layer.children
      return space if @in_space(space, x, y)

    null

  remove_piece_at: (coordinate) ->
    @piece_map.get(coordinate)?.remove()
    @piece_map.remove(coordinate)

  move_piece: (from, to) ->
    @remove_piece_at(to)

    piece = @piece_map.get(from)
    space = @space_map.get(to)
    piece.move_to_space(space.space)

    @piece_map.move(from, to)

  highlight_spaces: (coordinates, color) ->
    for coordinate in coordinates
      @space_map.get(coordinate)?.highlight(color)

    @space_layer.draw()

  dehighlight_spaces: ->
    for space in @space_map.values()
      space.dehighlight()

    @space_layer.draw()

module.exports = Board