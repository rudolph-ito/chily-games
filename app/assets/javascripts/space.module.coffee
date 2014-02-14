TerrainType = require('terrain_type')

class Space

  constructor: (@board, data) ->
    @x = data.x
    @y = data.y
    @coordinate = data.coordinate
    @terrain_type_id = data.terrain_type_id

    @update_draw_options()

  ################################################################################
  # Draw
  ################################################################################

  update_draw_options: ->
    [@x, @y] = @board.position(@coordinate) if @coordinate

  draw: ->
    # create @space in subclass, then call super
    @update_display()

    @space.on "click", @click
    @space.on "dragstart", @drag_start
    @space.on "dragend", @drag_end

    @board.layers.space.add(@space)

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

  redraw: ->
    @update_display()

  remove: ->
    @space.remove()

  ################################################################################
  # Display
  ################################################################################

  update_display: (draw = false) ->
    for fn in [@display_highlight, @display_terrain, @display_territory, @display_base]
      if fn.apply(@)
        @board.space_layer.draw() if draw
        return

  display_highlight: ->
    return false unless @highlight
    @space.setFill(@highlight)
    @space.setFillPriority('color')
    @space.setFillPatternImage(null)
    true

  display_terrain: ->
    return false unless @terrain_type_id

    image = new Image()
    image.onload = =>
      @space.setFillPriority('pattern')
      @space.setFillPatternImage(image)
      @space.setFillPatternRepeat('no-repeat')
      @space.setFillPatternScale({ x: @size / image.width, y: @size / image.height })
      @space.setFillPatternOffset(@terrain_offset(image.width, image.height))
      @space.setDraggable(true) if @board.game_controller.user_in_setup()
      @board.space_layer.draw()

    image.src = TerrainType.url_for(@terrain_type_id)

    true

  display_territory: ->
    return false unless @board.game_controller?.action == 'setup'

    color = switch @board.territory(@coordinate)
      when 'neutral' then '#A8A8A8'
      when @board.color then "#FFFFFF"
      else '#505050'

    @space.setFill(color)
    @space.setFillPriority('color')
    @space.setFillPatternImage(null)
    true

  display_base: ->
    @space.setFill('#FFFFFF')
    @space.setFillPriority('color')
    @space.setFillPatternImage(null)
    true

  ################################################################################
  # Handlers
  ################################################################################

  click: =>
    return if @dragging
    @board.click(@coordinate)

  drag_start: =>
    @dragging = true

    @space.moveToTop()
    @board.space_layer.draw()

    if @board.game_controller.user_in_setup()
      if @coordinate?
        space = new @.constructor(@board, {coordinate: @coordinate})
        space.draw()
        space.space.moveToBottom()
        @board.space_layer.draw()
        @board.space_map.set(@coordinate, space)
      else
        space = new @.constructor(@board, {x: @x, y: @y, terrain_type_id: @terrain_type_id})
        space.draw()
        space.space.moveToBottom()
        @board.setup_spaces = @board.setup_spaces.filter (x) => x != @
        @board.setup_spaces.push(space)

  drag_end: =>
    @dragging = false
    @try_move( @board.nearest_space(@space.attrs.x, @space.attrs.y) )

  ################################################################################
  # Setters
  ################################################################################

  set_terrain: (terrain_type_id) ->
    @terrain_type_id = terrain_type_id
    @update_display()

  set_highlight: (color) ->
    @highlight = color
    @update_display()

  ################################################################################
  # Util
  ################################################################################

  try_move: (space) ->
    from = @coordinate
    to = space?.coordinate

    if @board.game_controller.user_in_setup()
      if space and @board.home_space(to)
        space.set_terrain(@terrain_type_id)
        @space.remove()

        if from
          @board.game_controller.setup_move('terrain', from, to)
        else
          @board.game_controller.setup_add('terrain', @terrain_type_id, to)

      else
        @space.remove()
        @board.game_controller.setup_remove('terrain', @coordinate)

      @board.space_layer.draw()

module.exports = Space