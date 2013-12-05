class Space

  constructor: (@board, @coordinate) ->
    [@x, @y] = @board.position(@coordinate)
    @color = @board.space_color(@coordinate)

  draw: (obj) ->
    @board.add_to_space_layer(obj)

  draw_coordinate: ->
    obj = new Kinetic.Text
      x: @x
      y: @y
      text: (v for k,v of @coordinate).join(',')
      fontSize: 12
      fontFamily: 'Calibri'
      fontWeight: 'bold'
      fill: 'blue'

    @board.add_to_space_layer(obj)


module.exports = Space