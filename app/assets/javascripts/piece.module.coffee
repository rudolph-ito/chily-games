class Piece

  constructor: (@board, data) ->
    @piece_type_id = data.piece_type_id
    @color = data.color
    @selected = false

    if data.coordinate
      @coordinate = data.coordinate
    else
      @x = data.x
      @y = data.y

    @update_draw_options()

  update_draw_options: ->
    [@x, @y] = @board.position(@coordinate) if @coordinate
    @size = @board.piece_size

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

  redraw: ->
    @update_draw_options()

    @image.attrs.x = @x
    @image.attrs.y = @y
    @image.attrs.offset.x = @size / 2
    @image.attrs.offset.y = @size / 2
    @image.attrs.width = @size
    @image.attrs.height = @size

  click: =>
    return if @dragging
    @board.click(@coordinate)

  drag_start: =>
    @dragging = true
    if @board.game_controller.user_in_setup() and !@coordinate?
      piece = new Piece(@board, {piece_type_id: @piece_type_id, color: @color, x: @x, y: @y})
      piece.draw()
      @board.setup_pieces = @board.setup_pieces.filter (x) => x != @
      @board.setup_pieces.push(piece)

  drag_end: =>
    @dragging = false
    @try_move( @board.nearest_space(@image.attrs.x, @image.attrs.y) )

  try_move: (space) ->
    from = @coordinate
    to = space?.coordinate

    if @board.game_controller.user_in_setup()
      if space and @board.home_space(to)
        @board.remove_piece_at(to)
        @move_to_space(space)
        @board.piece_map.set(@coordinate, @)

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
    @image.attrs.x = @x = space.x
    @image.attrs.y = @y = space.y
    @image.attrs.coordinate = @coordinate = space.coordinate
    @board.piece_layer.draw()

  remove: ->
    @image.remove()
    @board.piece_layer.draw()

module.exports = Piece