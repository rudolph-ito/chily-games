class Space

  constructor: (@board, @coordinate) ->
    @update_draw_options()

  update_draw_options: ->
    [@x, @y] = @board.position(@coordinate)

  draw: ->
    # create @space in subclass, then call super
    @space.on "click", @click
    @board.space_layer.add(@space)

  click: =>
    @board.click(@coordinate)

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

  set_fill: (color) ->
    @space.attrs.fill = color

  highlight: (color) ->
    @highlighted = true
    @set_fill(color)

  dehighlight: ->
    return unless @highlighted
    @highlighted = false
    @set_fill('white')

module.exports = Space