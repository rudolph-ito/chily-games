PieceType = require('piece_type')

class Boneyard

  constructor: ({el}) ->
    @$el = $(el)
    @$alabaster = @$el.find '.alabaster'
    @$onyx = @$el.find '.onyx'

    $('body')
      .on('Boneyard.add', @onAdd)
      .on('Boneyard.clear', @onClear)
      .on('Boneyard.remove', @onRemove)
      .on('Boneyard.update', @onUpdate)
      .on('Ply.created', @onPlyCreated)


  # Handlers


  onAdd: (e, {type_id, color}) =>
    @addImage(type_id, color)


  onClear: =>
    @clearImages()


  onPlyCreated: (e, {captured_piece}) =>
    @addImage(captured_piece.type_id, captured_piece.color) if captured_piece?


  onRemove: (e, {type_id, color}) =>
    @removeImage(type_id, color)


  onUpdate: (e, toShow...) =>
    @clearImages()
    @addImage(type_id, color) for {type_id, color} in toShow


  # Helpers


  addImage: (id, color) ->
    @["$#{color}"].append @createImage(id, color)


  clearImages: ->
    @$el.find('img').remove()


  createImage: (id, color) ->
    $('<img>')
      .attr('data-piece-type-id', id)
      .attr('src', PieceType.url_for(id, color))


  getImage: (id, color) ->
    @["$#{color}"].find("img[data-piece-type-id=#{id}]").last()


  removeImage: (id, color) ->
    @getImage(id, color).remove()


module.exports = Boneyard