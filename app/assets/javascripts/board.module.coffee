CoordinateMap = require('lib/coordinate_map')
HighlightLayer = require('layers/highlight_layer')
Piece = require('piece')
PieceLayer = require('layers/piece_layer')
Set = require('lib/set')
SpaceLayer = require('layers/space_layer')
TerrainLayer = require('layers/terrain_layer')
TerritoryLayer = require('layers/territory_layer')

class Board

  @preview: (container, variant_id, options = {}) ->
    container = $(container)
    container.html('')

    path = "/api/variants/#{variant_id}/preview"

    query = []
    query.push("piece_type_id=#{options.piece_type_id}") if options.piece_type_id
    query.push("type=#{options.type}") if options.type
    path += "?" + query.join('&')

    $.getJSON(path).done (data) =>
      board = @create(container, data.color, data.options)
      board.draw()

      if data.pieces
        board.add_pieces(data.pieces)
        board.highlight_valid_plies(data.valid_plies.type, data.pieces[0].coordinate, data.valid_plies.coordinates)

  @create: (container, color, options, game_controller = null) ->
    klass = require("boards/#{options.board_type}_board")
    new klass(container, color, options, game_controller)



  constructor: (container, @color, options, @game_controller) ->
    @container = $(container)
    @container.html('')

    @piece_types = options.piece_types
    @terrain_types = options.terrain_types

    @header_height = @footer_height = 30
    @padding = 2

    @stage = new Kinetic.Stage container: @container[0]

    @space_layer = new SpaceLayer(@)
    @territory_layer = new TerritoryLayer(@)
    @terrain_layer = new TerrainLayer(@)
    @highlight_layer = new HighlightLayer(@)
    @piece_layer = new PieceLayer(@)

    @info_layer = new Kinetic.Layer()
    @stage.add(@info_layer)

  max_board_height: ->
    @container.height() - @header_height - @footer_height - @padding

  max_board_width: ->
    @container.width() - @padding

  board_offset_x: ->
    @padding + @setup_width

  board_offset_y: ->
    @padding + @header_height

  setup: ->
    @stage.setHeight @header_height + @board_height + @footer_height + 2 * @padding
    @stage.setWidth @setup_width + @board_width + 2 * @padding

  ########################################
  # Draw
  ########################################

  add_layer: (layer) ->
    @stage.add(layer)

  draw: ->
    @setup()
    @draw_space_layer()
    @draw_info_layer() if @game_controller
    @draw_territories() if @game_controller?.action == 'setup'
    @add_setup() if @game_controller?.user_in_setup()

  # Draw Layers

  draw_space_layer: ->
    @add_spaces()
    @space_layer.draw()

  draw_info_layer: ->
    @add_header()
    @add_footer()
    @info_layer.draw()

  draw_territories: ->
    @add_territories()
    @territory_layer.draw()

  # Add Many Entities

  add_spaces: ->

  add_territories: ->
    for space in @space_layer.coordinate_map.values()
      territory = @territory(space.coordinate)
      continue if territory is @color
      color = if territory is 'neutral' then '#A8A8A8' else '#505050'
      @territory_layer.add(coordinate, color)

  add_terrains: (terrains) ->
    @add_terrain(terrain_data) for terrain_data in terrains

  add_pieces: (pieces) ->
    @add_piece(piece_data) for piece_data in pieces

  # Add Single Entities

  add_space: (coordinate) ->
    @space_layer.add(coordinate)

  add_terrain: (data) ->
    @terrain_layer.add(data)

  add_piece: (data) ->
    @piece_layer.add(data)

  # Add Sections

  add_header: ->
    @header = new Kinetic.Text
      x: @setup_width
      y: 0
      width: @board_width
      height: @header_height - 5
      text: @game_controller.top_player_name()
      align: 'center'
      fontSize: @header_height - 9
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'black'

    @info_layer.add(@header)

  add_footer: ->
    @footer = new Kinetic.Text
      x: @setup_width
      y: @board_height + @header_height + 5
      width: @board_width
      height: @footer_height
      text: @game_controller.bottom_player_name()
      align: 'center'
      fontSize: @footer_height - 9
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'black'

    @info_layer.add(@footer)

  add_setup: ->
    index = 0

    for piece_type_id in @piece_types
      {x,y} = @setup_position(index)
      @add_piece(x: x, y: y, piece_type_id: piece_type_id, color: @color)
      index++

    for terrain_type_id in @terrain_types
      {x,y} = @setup_position(index)
      @add_terrain(x: x, y: y, terrain_type_id: terrain_type_id)
      index++

  ########################################
  # Redraw
  ########################################

  redraw: ->
    @setup()

    unless @game_controller.action == 'setup'
      @remove_territories()

    unless @game_controller?.user_in_setup()
      @remove_setup_pieces()
      @remove_setup_terrain()

    @space_layer.update()
    @territory_layer.update()
    @terrain_layer.update()
    @highlight_layer.update()
    @piece_layer.update()

    @update_header()
    @update_footer()
    @info_layer.draw()

  update_header: ->
    @header.attrs.x = 0
    @header.attrs.width = @board_width

  update_footer: ->
    @footer.attrs.x = 0
    @footer.attrs.y = @board_height + @header_height + 5
    @footer.attrs.width = @board_width

  ########################################
  # CLick Interaction
  ########################################

  click: (coordinate) ->
    if @selected_piece?
      @piece_try_move(@selected_piece, coordinate)
      @deselect_piece()
    else if @temporary_move
      range_capture = if coordinate == @temporary_move.to then null else coordinate
      @game_controller.piece_move_with_range_capture(@temporary_move.from, @temporary_move.to, range_capture)
      @move_piece_by_coordinate(@temporary_move.to, @temporary_move.from)
      @temporary_move = null
      @dehighlight()
    else
      piece = @coordinate_maps.piece.get(coordinate)
      @select_piece(piece) if piece

  select_piece: (piece) ->
    @selected_piece = piece
    @game_controller.valid_piece_moves(piece.coordinate)

  deselect_piece: ->
    @selected_piece = null
    @dehighlight()

  get_range_capture_input: (from, to, range_captures) ->
    return unless @coordinate_maps.piece.get(from).color == @color

    @temporary_move = from: from, to: to
    @move_piece_by_coordinate(from, to)
    @highlight_valid_plies('range', to, range_captures)

  ########################################
  # Piece Interation
  ########################################

  piece_drag_start: (piece) ->
    @replace_setup_piece(piece) if @game_controller.user_in_setup() and piece.setup()

  piece_drag_end: (piece) ->
    to = @nearest_space( piece.current_position() )?.coordinate
    @piece_try_move(piece, to)

  piece_try_move: (piece, to) ->
    from = piece.coordinate

    if to? and from is to
      @reset_piece(piece)
    else if @game_controller.user_in_setup()
      if to and @home_space(to)
        @move_piece(piece, to)

        if from
          @game_controller.setup_move('Piece', from, to)
        else
          @game_controller.setup_add('Piece', piece.piece_type_id, to)
      else
        @remove_piece(piece)
        @game_controller.setup_remove('Piece', from) if from
    else if to
      @reset_piece(piece)
      @game_controller.piece_move(from, to)

  ########################################
  # Terrain Interaction
  ########################################

  terrain_drag_start: (terrain) ->
    @replace_setup_terrain(terrain) if @game_controller.user_in_setup() and terrain.setup()

  terrain_drag_end: (terrain) ->
    to = @nearest_space( terrain.current_position() )?.coordinate
    @terrain_try_move(terrain, to)

  terrain_try_move: (terrain, to) ->
    from = terrain.coordinate

    if to? and from is to
      @reset_terrain(terrain)
    else if @game_controller.user_in_setup()
      if to and @home_space(to)
        @move_terrain(terrain, to)

        if from
          @game_controller.setup_move('Terrain', from, to)
        else
          @game_controller.setup_add('Terrain', terrain.display_option, to)
      else
        @remove_terrain(terrain)
        @game_controller.setup_remove('Terrain', from)

  ########################################
  # Highlight
  ########################################

  add_highlight: (coordinate, color) ->
    @highlight_layer.add(coordinate, color)

  add_highlights: (coordinates, color) ->
    @add_highlight(coordinate, color) for coordinate in coordinates

  dehighlight: ->
    @highlight_layer.clear()

  highlight_valid_plies: (type, piece_coordinate, space_coordinates) ->
    [piece_highlight_color, space_highlight_color] = if type == 'movement'
      ['#00CC00', '#006633']
    else
      ['#CC0000', '#660033']

    @add_highlight(piece_coordinate, piece_highlight_color)
    @add_highlights(space_coordinates, space_highlight_color)
    @highlight_layer.draw()

  ########################################
  # Territories
  ########################################

  remove_territories: ->
    @territory_layer.clear()

  ########################################
  # Helpers
  ########################################

  home_space: (coord) ->
    @territory(coord) == @color

  nearest_space: ({x, y}) ->
    for space in @coordinate_maps.space.values()
      return space if space.contains(x, y)
    null

  setup_position: (index) ->
    row = Math.floor(index / @setup_columns) % @setup_rows
    column = index % @setup_columns
    x = column * @setup_size + @setup_size / 2
    y = @board_height + @header_height - row * @setup_size - @setup_size / 2

    x: x + @padding
    y: y + @padding

module.exports = Board