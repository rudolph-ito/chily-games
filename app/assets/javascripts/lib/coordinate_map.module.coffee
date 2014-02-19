class CoordinateMap

  constructor: ->
    @clear()

  get: (coordinate) ->
    key = @_coordinate_to_key(coordinate)
    @data[key]

  set: (coordinate, value) ->
    return unless coordinate?
    key = @_coordinate_to_key(coordinate)
    @data[key] = value

  remove: (coordinate) ->
    key = @_coordinate_to_key(coordinate)
    delete @data[key]

  clear: ->
    @data = {}

  values: ->
    (v for k,v of @data)

  _coordinate_to_key: (coordinate) ->
    (v for k,v of coordinate).join(',')

module.exports = CoordinateMap
