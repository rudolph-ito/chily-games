Layer = require('layer')

class ObjectLayer extends Layer

  # Add

  add: (object) ->
    @element.add(object.element)
    @coordinate_map.set(object.coordinate, object) if object.coordinate

  # Remove

  remove: (object, draw = true) ->
    @coordinate_map.remove(object.coordinate)
    object.remove()
    @draw() if draw

  remove_by_coordinate: (coordinate, draw = true) ->
    object = @coordinate_map.get(coordinate)
    @remove(object, draw) if object

  # Move

  move: (object, to) ->
    @remove_by_coordinate(to, false)
    @coordinate_map.remove(object.coordinate)
    object.update_coordinate(to)
    @coordinate_map.set(to, object)
    @draw()

  move_by_coordinate: (from, to) ->
    object = @coordinate_map.get(from)
    @move(object, to) if object

  # Reset

  reset: (object) ->
    object.reset_position()
    @draw()

  # Coordinate occupied

  coordinate_occupied: (coordinate) ->
    @coordinate_map.get(coordinate)?

  # Handlers

  drag_start: (object) ->
    @board.dragging(object)

  drag_end: (object) ->
    pos = object.current_position()
    coord = @board.nearest_coordinate(pos)
    @board.try_move(@, object, coord)

module.exports = ObjectLayer
