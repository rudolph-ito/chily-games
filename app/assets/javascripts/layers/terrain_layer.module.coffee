CoordinateMap = require('lib/coordinate_map')
Layer = require("layer")
Set = require('lib/set')

class TerrainLayer extends Layer

  constructor: ->
    super
    @coordinate_map = new CoordinateMap
    @setup = new Set

  # Add

  add: (data) ->
    attrs = $.extend data,
      board: @board
      display_type: 'terrain',
      display_option: data.terrain_type_id,
      layer: @

    terrain = new @board.space_constructor(attrs)
    @element.add(terrain.element)

    if terrain.coordinate
      @coordinate_map.set(terrain.coordinate, terrain)
    else
      @setup.add(terrain)

  # Remove

  remove: (terrain, draw = true) ->
    @coordinate_map.remove(terrain.coordinate)
    terrain.remove()
    @draw() if draw

  remove_by_coordinate: (coordinate, draw = true) ->
    terrain = @coordinate_map.get(coordinate)
    @remove(terrain, draw) if terrain

  # Move

  move: (terrain, to) ->
    @remove_by_coordinate(to, false)
    @coordinate_map.remove(terrain.coordinate)
    terrain.update_coordinate(to)
    @coordinate_map.set(to, terrain)
    @draw()

  move_by_coordinate: (from, to) ->
    terrain = @coordinate_map.get(from)
    @move(terrain, to) if terrain

  # Reset

  reset: (terrain) ->
    terrain.reset_position()
    @draw()

  # Setup

  setup_replace: (terrain) ->
    @setup.remove(terrain)
    @add(x: terrain.x, y: terrain.y, terrain_type_id: terrain.display_option)

  setup_clear: ->
    terrain.remove() for terrain in @setup.values()
    @setup.clear()

module.exports = TerrainLayer
