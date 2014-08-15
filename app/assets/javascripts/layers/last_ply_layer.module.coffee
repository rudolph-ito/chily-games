HighlightLayer = require('layers/highlight_layer')

class LastPlyLayer extends HighlightLayer

  constructor: ->
    super

    $('body')
      .on('LastPly.update', @onUpdate)
      .on('Ply.created', @onPlyCreated)
      .on('ValidPlies.hide', @onValidPliesHide)
      .on('ValidPlies.show', @onValidPliesShow)


  # Callbacks


  onPlyCreated: (e, data) =>
    @update(data)


  onUpdate: (e, data) =>
    @update(data)


  onValidPliesHide: =>
    @show()


  onValidPliesShow: =>
    @hide()


  # Helpers


  update: ({from, to, range_capture}) ->
    @clear(draw: false)
    @add(from, '#FFFF33')
    @add(to, '#FFFF33') if to?
    @add(range_capture, '#0066CC') if range_capture?
    @draw()


module.exports = LastPlyLayer
