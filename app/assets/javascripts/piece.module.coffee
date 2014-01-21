class Piece

  constructor: (@board, data) ->
    @size = @board.piece_size
    @piece_type_id = data.piece_type_id
    @color = data.color
    @display = 'none'

    if data.coordinate
      @coordinate = data.coordinate
      [@x, @y] = @board.position(@coordinate)
    else
      @x = data.x
      @y = data.y

  draw: ->
    imageObj = new Image()
    imageObj.onload = =>
      @image = new Kinetic.Image
        x: @x
        y: @y
        offset:
          x: @size / 2
          y: @size / 2
        image: imageObj
        width: @size
        height: @size
        draggable: @color == @board.color
        coordinate: @coordinate

      @image.on 'click', @click

      if @color == @board.color
        @image.on 'dragstart', @drag_start
        @image.on 'dragend', @drag_end

      @board.piece_layer.add(@image)
      @board.piece_layer.draw()

    imageObj.src = "/piece_types/#{@piece_type_id}/#{@color}_image.svg"

  click: =>
    return if @dragging

    if @display == 'none'
      @board.game_controller.valid_piece_moves(@coordinate)
      @display = 'moves'
    else
      @board.dehighlight_spaces()
      @display = 'none'

  drag_start: =>
    @dragging = true
    if @board.data.action == 'setup' and !@coordinate?
      new Piece(@board, {piece_type_id: @piece_type_id, color: @color, x: @x, y: @y}).draw()

  drag_end: =>
    @dragging = false
    space = @board.nearest_space(@image.attrs.x, @image.attrs.y)
    from = @coordinate
    to = space?.attrs.coordinate

    if @board.data.action == 'setup'
      if space and @board.home_space(to)
        @board.remove_piece_at(to)
        @move_to_space(space)

        if from
          @board.game_controller.setup_move_piece(from, @coordinate)
        else
          @board.game_controller.setup_add_piece(@piece_type_id, @coordinate)

      else
        @remove()
        @board.game_controller.setup_remove_piece(@coordinate)
    else
      @move_back()
      @board.game_controller.piece_move(from, to) if space

  move_back: ->
    @image.attrs.x = @x
    @image.attrs.y = @y
    @board.piece_layer.draw()

  move_to_space: (space) ->
    @image.attrs.x = @x = space.attrs.x
    @image.attrs.y = @y = space.attrs.y
    @image.attrs.coordinate = @coordinate = space.attrs.coordinate
    @board.piece_layer.draw()

  remove: ->
    @image.remove()
    @board.piece_layer.draw()

module.exports = Piece