TerrainType = require('terrain_type')

class Space

  constructor: ({@board, @coordinate, @display_type, @display_option, @layer, @x, @y}) ->
    @init()
    @update()
    @set_display()

  ############################################################
  # Init / Update
  ############################################################

  init: ->
    # override and call super after setting @element
    @element.on "click", @click
    @element.on "dragstart", @drag_start
    @element.on "dragend", @drag_end

  update: ->
    @update_size()
    @update_position()
    @update_draggable()

  update_position: ->
    {@x, @y} = @board.position(@coordinate) if @coordinate
    @element.attrs.x = @x
    @element.attrs.y = @y

  update_size: ->
    # override and call super after setting @size
    @update_terrain_size() if @display_type == 'terrain'

  update_terrain_size: ->
    image = @element.getFillPatternImage()
    @element.setFillPatternScale(x: @size / image.width, y: @size / image.height) if image

  update_draggable: ->
    @element.setDraggable( @draggable() )

  ############################################################
  # Display
  ############################################################

  set_display: ->
    switch @display_type
      when 'highlight' then @set_highlight_display()
      when 'terrain' then @set_terrain_display()
      when 'territory' then @set_territory_display()

  set_highlight_display: ->
    @element.setFill(@display_option)
    @element.setOpacity(0.75)

  set_terrain_display: ->
    @element.setFillPatternRepeat('no-repeat')
    @load_terrain_image()

  set_territory_display: ->
    @element.setFill(@display_option)

  load_terrain_image: ->
    image = new Image()
    image.src = TerrainType.url_for(@display_option)
    image.onload = =>
      @element.setFillPatternImage(image)
      @element.setFillPatternOffset(@terrain_offset(image.width, image.height))
      @update_terrain_size()
      @layer.draw()

  ############################################################
  # Handlers
  ############################################################

  click: =>
    return if @dragging
    @board.click(@coordinate)

  drag_start: =>
    @dragging = true
    @element.moveToTop()
    @board.terrain_drag_start(@)

  drag_end: =>
    @dragging = false
    @board.terrain_drag_end(@)

  ############################################################
  # Helpers
  ############################################################

  draggable: ->
    @display_type is 'terrain' and @board.game_controller?.user_in_setup()

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

module.exports = Space