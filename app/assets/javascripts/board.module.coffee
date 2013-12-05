class Board

  @preview: (container, variant_id, options) ->
    $("##{container}").html('')

    path = "/variants/#{variant_id}/preview"
    if options.piece_type_id
      path += "?piece_type_id=#{options.piece_type_id}"
      for key, value of options.coord
        path += "&coord[#{key}]=#{value}"

    $.getJSON(path).done (data) ->
      board = Board.create(data)
      board.draw(container)


  @create: (data) ->
    klass = require("#{data.board_type}_board")
    new klass(data)



  constructor: (@game) ->
    @board_type = @game.board_type
    @color = @game.color ? 'onyx'
    @pieces = @game.pieces ? []
    @terrain = @game.terrain ? []
    @valid_plies = @game.valid_plies ? []
    @Piece = require('piece')

  draw: (container) ->
    @setup(600,600)

    @stage = new Kinetic.Stage container: container
    @stage.setHeight @height
    @stage.setWidth @width

    @center =
      x: @stage.getWidth() / 2
      y: @stage.getHeight() / 2

    @space_layer = new Kinetic.Layer()
    @stage.add(@space_layer)

    @piece_layer = new Kinetic.Layer()
    @stage.add(@piece_layer)

    @draw_spaces()
    @draw_pieces()

  draw_spaces: ->
    # override

  draw_space: (coordinate) ->
    space = new @Space(@, coordinate)
    space.draw()
    #space.draw_coordinate()

  draw_pieces: ->
    for piece_data in @pieces
      piece = new @Piece(@, piece_data)
      piece.draw()

  add_to_space_layer: (obj) ->
    @space_layer.add(obj)
    @space_layer.draw()

  add_to_piece_layer: (obj) ->
    @piece_layer.add(obj)
    @piece_layer.draw()

  coord_eql: (a,b) ->
    Object.keys(a).all (k) -> a[k] == b[k]

  home_space: (coord) ->
    @game.partition[@game.color]?.any((x) => @coord_eql(x, coord))

  neutral_space: (coord) ->
    @game.partition.neutral.any((x) => @coord_eql(x, coord))

  space_color: (coord) ->
    if @game.action == 'setup'
      if @home_space(coord)
        'white'
      else if @neutral_space(coord)
        '#A8A8A8'
      else
        '#505050'
    else if @valid_plies.any( (x) => @coord_eql(x, coord) )
      '#99FF99'
    else
      'white'

  # distance: (x1, x2, y1, y2) ->
  #   Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) )

  # nearest_space: (x,y) ->
  #   min_distance = min_space = null

  #   for space in @space_layer.children
  #     d = @distance(space.attrs.x, x, space.attrs.y, y)
  #     if !min_distance? || d < min_distance
  #       min_distance = d
  #       min_space = space

  #   min_space

  # drawPieces: ->
  #   for piece in @pieces
  #     @drawPiece(piece)
  #     do (coord, value) =>
  #       [x,y] = @position(coord)
  #       color = @color(coord)

  #       space = @drawSpace(x,y,color)

  #       group = new Kinetic.Group
  #       group.add(space)
  #       # group.add(text)
  #       @image(group, coord, value)

  #       if @options.setup && @home_space(coord)
  #         group.on "click", =>
  #           space.setFill('green')
  #           @layer.draw()
  #           @piece_menu(group, space, coord)

  #       @layer.add(group)



  # piece_menu: (group, space, coord) =>
  #   container = @stage.getContainer()
  #   mousePos = @stage.getMousePosition()
  #   x = container.offsetLeft + mousePos.x - 5
  #   y = container.offsetTop + mousePos.y - 5

  #   menu = $("<ul>").attr('id', 'piece-menu')

  #   # Links to add new piece
  #   total = 0
  #   for piece in @game.pieces
  #     do (piece) =>
  #       piece.placed ||= []
  #       total += piece.placed.length

  #       count = $("<span>")
  #       count.text "(#{if piece.min is piece.max then piece.min else "#{piece.min} to #{piece.max}"})"
  #       className = if piece.placed.length >= piece.min
  #         if piece.placed.length == piece.max
  #           'done'
  #         else
  #           'optional'
  #       else
  #         'required'

  #       item = $("<li>").addClass(className).text(piece.name).append(count)
  #       if piece.placed.length < piece.max
  #         item.on 'click', =>
  #           value = {piece_id: piece.id, color: @game.color}
  #           piece.placed.push {coord: coord, value: value}
  #           @image(group, coord, value)
  #           menu.trigger('mouseleave')
  #       menu.append(item)

  #   # Link to remove current piece
  #   if group.getChildren().length > 1
  #     item = $('<li>').text('Remove')
  #     item.on 'click', =>
  #       do =>
  #         for piece in @game.pieces
  #           for placed, i in piece.placed
  #             if @coord_eql(coord, placed.coord)
  #               piece.placed.splice(i, 1)
  #               return

  #       for child in group.getChildren()
  #         child.remove() if child.shapeType is "Image"

  #       menu.trigger('mouseleave')

  #     menu.prepend(item)

  #   # Summary
  #   total_item = $('<li>').text("Placed: #{total} of #{@game.variant.maximum_pieces}")
  #   menu.prepend(total_item)

  #   menu.on 'mouseleave', =>
  #     menu.remove()
  #     space.setFill('white')
  #     @layer.draw()

  #   menu.css
  #     position: 'absolute'
  #     top: y
  #     left: x

  #   $('body').append(menu)

module.exports = Board