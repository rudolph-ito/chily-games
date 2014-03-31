PieceType = require('piece_type')

class Piece

  constructor: ({@board, @color, @coordinate, @layer, @piece_type_id, @x, @y}) ->
    @init()
    @update()
    @load_image()

  ############################################################
  # Init / Update
  ############################################################

  init: ->
    @element = new Kinetic.Image( draggable: @draggable() )
    @element.on 'click', @click
    if @draggable()
      @element.on 'dragstart', @drag_start
      @element.on 'dragend', @drag_end

  update: ->
    @update_position()
    @update_size()

  load_image: ->
    image = new Image()
    image.src = PieceType.url_for(@piece_type_id, @color)
    image.onload = =>
      @element.setImage(image)
      @layer.draw()

  update_coordinate: (coordinate) ->
    @coordinate = coordinate
    @update_position()

  update_position: ->
    {@x, @y} = @board.position(@coordinate) if @coordinate
    @element.attrs.x = @x
    @element.attrs.y = @y

  update_size: ->
    @size = @board.piece_size
    @element.attrs.offset = x: @size / 2, y: @size / 2
    @element.attrs.width = @size
    @element.attrs.height = @size

  ############################################################
  # Handlers
  ############################################################

  click: =>
    return if @dragging
    @board.click(@coordinate)

  drag_start: =>
    @dragging = true
    @layer.drag_start(@)

  drag_end: =>
    @dragging = false
    @layer.drag_end(@)

  ############################################################
  # Helpers
  ############################################################

  draggable: ->
    @color == @board.color

  setup: ->
    !@coordinate?

  current_position: ->
    x: @element.attrs.x
    y: @element.attrs.y

  reset_position: ->
    @element.attrs.x = @x
    @element.attrs.y = @y

  remove: ->
    @element.remove()

  ############################################################
  # Clone
  ############################################################

  clone: ->
    new @.constructor
      board: @board
      color: @color
      coordinate: @coordinate
      layer: @layer
      piece_type_id: @piece_type_id
      x: @x
      y: @y

module.exports = Piece