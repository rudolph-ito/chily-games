class Layer

  constructor: (@board) ->
    @element = new Kinetic.Layer()
    @board.add_layer(@element)

  draw: ->
    @element.draw()

  update: ->
    # TODO update all children
    @element.draw()

  clear: ->
    @element.removeChildren()
    @element.draw()

module.exports = Layer
