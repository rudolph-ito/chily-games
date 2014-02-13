class CoordinateMap

  constructor: ->
    @data = {}

  get: (coordinate) ->
    key = @_coordinate_to_key(coordinate)
    @data[key] ? null

  set: (coordinate, value) ->
    key = @_coordinate_to_key(coordinate)
    @data[key] = value

  remove:(coordinate) ->
    key = @_coordinate_to_key(coordinate)
    delete @data[key]

  move: (from, to) ->
    @set(to, @get(from))
    @remove(from)

  values: ->
    (v for k,v of @data)

  _coordinate_to_key: (coordinate) ->
    (v for k,v of coordinate).join(',')

module.exports = CoordinateMap
