ObjectLayer = require('layers/object_layer')
Piece = require('piece')

class PieceLayer extends ObjectLayer

  piece_constructor: Piece

  constructor: ->
    super
    $('body').on 'created.Ply', @onPlyCreated


  add_from_data: (data) ->
    attrs = $.extend data,
      board: @board
      layer: @

    piece = new @piece_constructor(attrs)

    @add(piece)


  onPlyCreated: (e, {from, to, range_capture}) =>
    @move_by_coordinate(from, to) if to?
    @remove_by_coordinate(range_capture) if range_capture?


module.exports = PieceLayer
