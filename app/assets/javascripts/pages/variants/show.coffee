Board = require('board')

$ ->
  $('[data-action=preview]').on 'click', (e) ->
    e.preventDefault()

    vid = $(this).data('id')
    ptid = $(this).data('piece-type-id')

    Board.preview('previewCanvas', vid, {'piece_type_id': ptid})

    $('#preview').modal()


