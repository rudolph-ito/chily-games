HighlightLayer = require('layers/highlight_layer')

class ValidPliesLayer extends HighlightLayer

  constructor: ->
    super

    $('body')
      .on('ValidPlies.hide', @onHide)
      .on('ValidPlies.show', @onShow)


  # Callbacks


  onHide: =>
    @clear()


  onShow: (e, {type, origin, valid, reachable}) =>
    [origin_color, valid_color, reachable_color] = @colors(type)

    @clear(draw: false)
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