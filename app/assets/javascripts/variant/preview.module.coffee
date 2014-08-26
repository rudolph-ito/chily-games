Board = require('board')

class Preview

  constructor: (container) ->
    @$container = $ container
    @$board = @$container.find('.board')
    $('body').on 'click', '[data-action=preview]', @onPreview


  # Callbacks


  onPreview: (e) =>
    e.preventDefault()
    @$container.modal()
    $.getJSON @getPath($(e.target)), @onUpdateSuccess


  # Helpers


  getPath: ($el) ->
    variant_id = $el.data('variant-id')
    piece_type_id = $el.data('piece-type-id')
    type = $el.data('type')

    query = []
    query.push("piece_type_id=#{piece_type_id}") if piece_type_id
    query.push("type=#{type}") if type

    path = "/api/variants/#{variant_id}/preview"
    path += "?" + query.join('&') if query.length > 0
    path


  onUpdateSuccess: ({options, pieces, valid_plies}) =>
    Board.create(@$board, options.color, options)
    @$board.trigger('Board.draw')
    @$board.trigger('Pieces.add', pieces) if pieces?
    @$board.trigger('ValidPlies.show', valid_plies) if valid_plies?


module.exports = Preview
