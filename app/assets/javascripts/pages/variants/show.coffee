Board = require('board')

$ ->
  $('[data-action=preview]').on 'click', (e) ->
    e.preventDefault()

    vid = $(this).data('id')
    type = $(this).data('type')
    ptid = $(this).data('piece-type-id')

    Board.preview('.board', vid, {'type': type, 'piece_type_id': ptid})

    $('#preview').modal()


