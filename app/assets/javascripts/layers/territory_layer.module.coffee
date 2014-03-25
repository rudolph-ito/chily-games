Layer = require('layer')

class TerritoryLayer extends Layer

  add: (coordinate, color) ->
    attrs =
     board: @board
     coordinate: coordinate
     display_type: 'territory'
     display_option: color
     layer: @

    space = new @board.space_constructor()
    @element.add(space.element)

module.exports = TerritoryLayer
