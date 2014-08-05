HighlightLayer = require('layers/highlight_layer')
Piece = require('piece')
PieceLayer = require('layers/piece_layer')
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

    @setup_data = options.setup_data

    @padding = 1

    @stage = new Kinetic.Stage container: @container[0]

    @space_layer = new SpaceLayer(@)
    @territory_layer = new TerritoryLayer(@)
    @terrain_layer = new TerrainLayer(@)
    @last_ply_layer = new HighlightLayer(@)
    @highlight_layer = new HighlightLayer(@)
    @piece_layer = new PieceLayer(@)

  max_board_height: ->
    @container.height() - 2 * @padding

  max_board_width: ->
    @container.width() - 2 * @padding

  board_offset_x: ->
    @setup_width + @padding

  board_offset_y: ->
    @padding

  setup: ->
    @stage.setHeight @board_height + 2 * @padding
    @stage.setWidth @board_width + @setup_width + 2 * @padding

  ########################################
  # Draw
  ########################################

  add_layer: (layer) ->
    @stage.add(layer)

  draw: ->
    @setup()
    @draw_space_layer()

    if @game_controller
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
  # Last Ply Layer
  ########################################

  update_last_ply: (from, to, range_capture) ->
    @last_ply_layer.clear(draw: false)
    @last_ply_layer.add(from, '#FFFF33')
    @last_ply_layer.add(to, '#FFFF33') if to
    @last_ply_layer.add(range_capture, '#0066CC') if range_capture
    @last_ply_layer.draw()

  ########################################
  # Highlight Layer
  ########################################

  add_highlight: (coordinate, color) ->
    @highlight_layer.add(coordinate, color)

  add_highlights: (coordinates, color) ->
    @add_highlight(coordinate, color) for coordinate in coordinates

  dehighlight: ->
    @highlight_layer.clear()

  highlight_valid_plies: (type, piece_coordinate, valid_coordinates, reachable_coordinates) ->
    [piece_highlight, valid_highlight, reachable_highlight] = if type == 'movement'
      ['#00CC00', '#006633', '#FFFF66']
    else
      ['#CC0000', '#660033', '#FFFF66']

    @add_highlight(piece_coordinate, piece_highlight)
    @add_highlights(valid_coordinates, valid_highlight)
    @add_highlights(reachable_coordinates, reachable_highlight)
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

    for {id, count} in @setup_data.piece_types
      for [0...count]
        {x,y} = @setup_position(index)
        @add_piece(x: x, y: y, piece_type_id: id, color: @color)
        index++

    for {id, count} in @setup_data.terrain_types
      for [0...count]
        {x,y} = @setup_position(index)
        @add_terrain(x: x, y: y, terrain_type_id: id)
        index++

  ########################################
  # Redraw
  ########################################

  redraw: ->
    @setup()

    unless @game_controller.in_setup()
      @remove_territories()

    @space_layer.update()
    @territory_layer.update()
    @terrain_layer.update()
    @highlight_layer.update()
    @piece_layer.update()

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
      @game_controller.create_ply(@temporary_move.from, @temporary_move.to, range_capture)
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

    if !to? or !@home_space(to) or _.isEqual(from, to) or layer.coordinate_occupied(to)
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

    if @highlighting == 'range'
      @game_controller.create_ply(from, null, to)
    else if object.type_id() in @game_controller.move_and_range_capture_piece_type_ids
      @game_controller.ply_valid from, to, => @get_range_capture_input(from, to)
    else
      @game_controller.create_ply(from, to, null)

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

  setup_count: ->
    sum = (s, data) -> s + data.count
    @setup_data.piece_types.reduce(sum, 0) + @setup_data.terrain_types.reduce(sum, 0)

  setup_position: (index) ->
    row = Math.floor(index / @setup_columns) % @setup_rows
    column = index % @setup_columns

    x = column * @setup_size + @setup_size / 2
    y = @board_height - row * @setup_size - @setup_size / 2

    x: x + @padding
    y: y + @padding

module.exports = Board