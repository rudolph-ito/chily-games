class CoordinateMap

  constructor: ->
    @data = {}

  get: (coordinate) ->
    key = @coordinate_to_key(coordinate)
    @data[key]

  set: (coordinate, value) ->
    key = @coordinate_to_key(coordinate)
    @data[key] = value

  values: ->
    (v for k,v of @data)

  coordinate_to_key: (coordinate) ->
    (v for k,v of coordinate).join(',')

module.exports = CoordinateMap
