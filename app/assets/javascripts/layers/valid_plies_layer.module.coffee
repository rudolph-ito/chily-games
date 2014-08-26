HighlightLayer = require('layers/highlight_layer')

class ValidPliesLayer extends HighlightLayer

  constructor: ->
    super

    @board.container
      .on('Ply.created', @onPlyCreated)
      .on('ValidPlies.hide', @onHide)
      .on('ValidPlies.show', @onShow)


  # Callbacks


  onHide: =>
    @clear(draw: true)


  onPlyCreated: =>
    @clear(draw: true)


  onShow: (e, {type, origin, valid, reachable}) =>
    [origin_color, valid_color, reachable_color] = @colors(type)

    @clear()
    @add(origin, origin_color)
    @add(coordinate, valid_color) for coordinate in valid
    @add(coordinate, reachable_color) for coordinate in reachable
    @draw()


  # Helpers


  colors: (type) ->
    if type == 'movement'
      ['#00CC00', '#006633', '#FFFF66']
    else
      ['#CC0000', '#660033', '#FFFF66']


module.exports = ValidPliesLayer