class Space

  constructor: (@board, @coordinate) ->
    [@x, @y] = @board.position(@coordinate)
    @color = @board.space_color(@coordinate)

  draw_coordinate: ->
    obj = new Kinetic.Text
      x: @x
      y: @y
      text: (v for k,v of @coordinate).join(',')
      fontSize: 12
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @board.space_layer.add(obj)

  highlight: (color) ->
    @space.attrs.stroke = color
    @space.attrs.strokeWidth = 5
    @space.setZIndex(1000)

  dehighlight: ->
    @space.attrs.stroke = 'black'
    @space.attrs.strokeWidth = 1
    @space.setZIndex(1)

module.exports = Space