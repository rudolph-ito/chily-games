class PieceType
  @url_map: {}

  @set_data: (data) ->
    @url_map = data

  @url_for: (piece_type_id, color) ->
    @url_map[piece_type_id][color]

module.exports = PieceType
