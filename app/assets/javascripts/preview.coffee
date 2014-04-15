Board = require('board')

$ ->
  $('body').on 'click', '[data-action=preview]', (e) ->
    e.preventDefault()

    vid = $(this).data('id')
    type = $(this).data('type')
    ptid = $(this).data('piece-type-id')

    Board.preview('#preview .board', vid, {'type': type, 'piece_type_id': ptid})

    $('#preview').modal()
