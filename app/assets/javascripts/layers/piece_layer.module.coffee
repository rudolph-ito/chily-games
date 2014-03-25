CoordinateMap = require('lib/coordinate_map')
Layer = require('layer')
Piece = require('piece')
Set = require('lib/set')

class PieceLayer extends Layer

  child_constructor: Piece

  constructor: ->
    super
    @coordinate_map = new CoordinateMap
    @setup = new Set

  # Add

  add: (data) ->
    attrs = $.extend data,
      board: @board
      layer: @

    piece = new @child_constructor(attrs)
    @element.add(piece.element)

    if piece.coordinate
      @coordinate_map.set(piece.coordinate, piece)
    else
      @setup.add(piece)

  # Remove

  remove: (piece, draw = true) ->
    @coordinate_map.remove(piece.coordinate)
    piece.remove()
    @draw() if draw

  remove_by_coordinate: (coordinate, draw = true) ->
    piece = @coordinate_map.get(coordinate)
    @remove(piece, draw) if piece

  # Move

  move: (piece, to) ->
    @remove_by_coordinate(to, false)
    @coordinate_map.remove(piece.coordinate)
    piece.update_coordinate(to)
    @coordinate_map.set(to, piece)
    @draw()

  move_by_coordinate: (from, to) ->
    piece = @coordinate_map.get(from)
    @move(piece, to) if piece

  # Reset

  reset: (piece) ->
    piece.reset_position()
    @draw()

  # Setup

  setup_replace: (piece) ->
    @setup.remove(piece)
    @add(x: piece.x, y: piece.y, piece_type_id: piece.piece_type_id, color: piece.color)

  setup_clear: ->
    piece.remove() for piece in @setup.values()
    @setup.clear()

module.exports = PieceLayer
