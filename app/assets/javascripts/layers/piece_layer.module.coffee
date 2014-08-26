ObjectLayer = require('layers/object_layer')
Piece = require('piece')

class PieceLayer extends ObjectLayer

  piece_constructor: Piece

  constructor: ->
    super
    @board.container
      .on('Pieces.add', @onAddPieces)
      .on('Ply.created', @onPlyCreated)


  add_from_data: (data) ->
    attrs = $.extend {board: @board, layer: @}, data
    piece = new @piece_constructor(attrs)
    @add(piece)


  onAddPieces: (e, data...) =>
    @add_from_data(datum) for datum in data


  onPlyCreated: (e, {from, to, range_capture}) =>
    @move_by_coordinate(from, to) if to?
    @remove_by_coordinate(range_capture) if range_capture?


module.exports = PieceLayer
