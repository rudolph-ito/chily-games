HighlightLayer = require('layers/highlight_layer')

class LastPlyLayer extends HighlightLayer

  constructor: ->
    super

    @board.container
      .on('LastPly.update', @onUpdate)
      .on('Ply.created', @onPlyCreated)
      .on('ValidPlies.hide', @onValidPliesHide)
      .on('ValidPlies.show', @onValidPliesShow)


  # Callbacks


  onPlyCreated: (e, data) =>
    @updateDisplay(data)


  onUpdate: (e, data) =>
    @updateDisplay(data)


  onValidPliesHide: =>
    @show()


  onValidPliesShow: =>
    @hide()


  # Helpers


  updateDisplay: ({from, to, range_capture}) ->
    @clear()
    @add(from, '#FFFF33')
    @add(to, '#FFFF33') if to?
    @add(range_capture, '#0066CC') if range_capture?
    @draw()


module.exports = LastPlyLayer
