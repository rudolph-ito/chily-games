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

    if @game_controller
      @draw_info_layer()
      @draw_territories() if @game_controller.in_setup()
      @add_setup() if @game_controller.user_in_setup()

  ########################################
  # Space Layer
  ########################################

  draw_space_layer: ->
    @add_spaces()
    @space_layer.draw()

  add_spaces: ->
    # Overwrite

  add_space: (coordinate) ->
    @space_layer.add(coordinate)

  ########################################
  # Territory Layer
  ########################################

  draw_territories: ->
    @add_territories()
    @territory_layer.draw()

  # Adds neutral and enemny territories to the board
  # Does not draw the layer
  add_territories: ->
    for coordinate in @space_layer.coordinate_map.keys()
      territory = @territory(coordinate)
      continue if territory is @color
      color = if territory is 'neutral' then '#A8A8A8' else '#505050'
      @territory_layer.add(coordinate, color)

  # Removes territories from the board and draws
  remove_territories: ->
    @territory_layer.clear()

  # Returns whose territory a coordinate is in during setup
  # Returns alabaster, onyx, or neutral
  territory: (coordinate) ->

  ########################################
  # Highlight Layer
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
  # Object Layers
  ########################################

  add_pieces: (data) ->
    @add_piece(datum) for datum in data

  add_piece: (datum) ->
    @piece_layer.add_from_data(datum)


  add_terrains: (data) ->
    @add_terrain(datum) for datum in data

  add_terrain: (datum) ->
    @terrain_layer.add_from_data(datum)


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
  # Info Layer
  ########################################

  draw_info_layer: ->
    @add_header()
    @add_footer()
    @info_layer.draw()

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

  update_header: ->
    @header.attrs.x = 0
    @header.attrs.width = @board_width

  update_footer: ->
    @footer.attrs.x = 0
    @footer.attrs.y = @board_height + @header_height + 5
    @footer.attrs.width = @board_width


  ########################################
  # Redraw
  ########################################

  redraw: ->
    @setup()

    unless @game_controller.in_setup()
      @remove_territories()

    unless @game_controller.user_in_setup()
      @piece_layer.setup_clear()
      @terrain_layer.setup_clear()

    @space_layer.update()
    @territory_layer.update()
    @terrain_layer.update()
    @highlight_layer.update()
    @piece_layer.update()

    @update_header()
    @update_footer()
    @info_layer.draw()

  ########################################
  # CLick Interaction
  ########################################

  click: (coordinate) ->
    if @selected_piece?
      if _.isEqual(coordinate, @selected_piece.coordinate)
        @update_selected_piece()
      else
        @try_move(@piece_layer, @selected_piece, coordinate)
        @deselect_piece()
    else if @temporary_move
      range_capture = if _.isEqual(coordinate, @temporary_move.to) then null else coordinate
      @game_controller.ply(@temporary_move.from, @temporary_move.to, range_capture)
      @clear_temporary_move()
    else
      piece = @piece_layer.coordinate_map.get(coordinate)
      @select_piece(piece) if piece

  dragging: (object) ->
    @deselect_piece() unless object is @selected_piece

  select_piece: (piece) ->
    @selected_piece = piece
    @highlight_selected_piece('movement')

  highlight_selected_piece: (type) ->
    @game_controller.valid_plies(@selected_piece.coordinate, type)
    @highlighting = type

  deselect_piece: ->
    @selected_piece = null
    @highlighting = null
    @dehighlight()

  update_selected_piece: ->
    if @selected_piece.type_id() in @game_controller.range_capture_piece_type_ids and @highlighting == 'movement'
      @highlight_selected_piece('range')
    else
      @deselect_piece()

  get_range_capture_input: (from, to) ->
    @temporary_move = from: from, to: to
    @piece_layer.move_by_coordinate(from, to)
    @game_controller.valid_plies(from, 'range', to)

  clear_temporary_move: ->
    @piece_layer.move_by_coordinate(@temporary_move.to, @temporary_move.from)
    @temporary_move = null
    @dehighlight()

  try_move: (layer, object, to) ->
    if @game_controller.user_in_setup()
      @setup_try_move(layer, object, to)
    else
      @play_try_move(layer, object, to)

  setup_try_move: (layer, object, to) ->
    from = object.coordinate
    type = object.type()

    if !to? or !@home_space(to)
      layer.remove(object)
      @game_controller.setup_remove(type, from) if from
    else if _.isEqual(from, to)
      layer.reset(object)
    else
      layer.move(object, to)

      if from
        @game_controller.setup_move(type, from, to)
      else
        @game_controller.setup_add(type, object.type_id(), to)

  play_try_move: (layer, object, to) ->
    from = object.coordinate
    layer.reset(object)

    return if !to? or _.isEqual(from, to)

    if object.type_id() in @game_controller.move_and_range_capture_piece_type_ids
      @game_controller.ply_valid from, to, => @get_range_capture_input(from, to)
    else if @highlighting == 'range'
      @game_controller.ply(from, null, to)
    else
      @game_controller.ply(from, to, null)

  ########################################
  # Helpers
  ########################################

  home_space: (coord) ->
    @territory(coord) == @color

  nearest_coordinate: (arg) ->
    @nearest_space(arg)?.coordinate

  nearest_space: ({x, y}) ->
    for space in @space_layer.coordinate_map.values()
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