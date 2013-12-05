class Piece

  constructor: (@board, {@piece_type_id, @coordinate, @color}) ->
    @size = @board.piece_size

  draw: ->
    imageObj = new Image()
    imageObj.onload = =>
      [x,y] = @board.position(@coordinate)

      image = new Kinetic.Image
        x: x
        y: y
        offset:
          x: @size / 2
          y: @size / 2
        image: imageObj
        width: @size
        height: @size
        draggable: true
        coordinate: @coordinate

      # drag_start = {}
      # image.on 'dragstart', (evt) ->
      #   drag_start.x = image.attrs.x
      #   drag_start.y = image.attrs.y

      # image.on 'dragend', (evt) =>
      #   nearest_space = @nearest_space(image.attrs.x, image.attrs.y)
      #   if @inSpace(nearest_space, image.attrs.x, image.attrs.y)
      #     image.attrs.x = nearest_space.attrs.x
      #     image.attrs.y = nearest_space.attrs.y
      #     image.attrs.coordinate = nearest_space.attrs.coordinate
      #   else
      #     image.attrs.x = drag_start.x
      #     image.attrs.y = drag_start.y


      #   drag_start = {}
      #   @piece_layer.draw()

      @board.add_to_piece_layer(image)

    imageObj.src = "/piece_types/#{@piece_type_id}/#{@color}_image.svg"

module.exports = Piece