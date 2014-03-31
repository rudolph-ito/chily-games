ObjectLayer = require('layers/object_layer')
Piece = require('piece')

class PieceLayer extends ObjectLayer

  piece_constructor: Piece

  add_from_data: (data) ->
    attrs = $.extend data,
      board: @board
      layer: @

    piece = new @piece_constructor(attrs)

    @add(piece)

module.exports = PieceLayer
