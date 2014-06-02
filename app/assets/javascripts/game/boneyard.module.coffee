PieceType = require('piece_type')

class Boneyard

  constructor: ({el}) ->
    @showing =
      alabaster: {}
      onyx: {}

    @$el = $(el)
    @$alabaster = @$el.find '.alabaster'
    @$onyx = @$el.find '.onyx'

    $('body').on 'init.Boneyard', @onInit
    $('body').on 'hide.Boneyard', @onHide
    $('body').on 'show.Boneyard', @onShow
    $('body').on 'update.Boneyard', @onUpdate


  # Handlers


  onInit: (e, piece_types...) =>
    @addImages(piece_types)
    @hideImages()


  onHide: (e, {type_id, color}) =>
    @hideImage(type_id, color)


  onShow: (e, {type_id, color}) =>
    @showImage(type_id, color)


  onUpdate: (e, toShow...) =>
    @hideImages()
    @showImage(type_id, color) for {type_id, color} in toShow


  # Helpers


  addImages: (piece_types) ->
    for {id, count} in piece_types
      $alabasterImg = @createImage(id, 'alabaster')
      $onyxImg = @createImage(id, 'onyx')

      for i in [1..count]
        @$alabaster.append $alabasterImg.clone()
        @$onyx.append $onyxImg.clone()


  indexToHide: (id, color) ->
    @showing[color][id] -= 1


  indexToShow: (id, color) ->
    index = @showing[color][id] ?= 0
    @showing[color][id] += 1
    index


  createImage: (id, color) ->
    $('<img>')
      .attr('data-piece-type-id', id)
      .attr('src', PieceType.url_for(id, color))


  getImage: (id, color, index) ->
    pieces = @["$#{color}"].find("img[data-piece-type-id=#{id}]")
    $(pieces[index])


  hideImage: (id, color) ->
    @getImage(id, color, @indexToHide(id, color)).hide()


  hideImages: ->
    @$el.find('img').hide()


  showImage: (id, color) ->
    @getImage(id, color, @indexToShow(id, color)).show()


module.exports = Boneyard
