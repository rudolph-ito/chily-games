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

  keys: ->
    @_key_to_coordinate(k) for k,v of @data

  values: ->
    v for k,v of @data

  # Helpers

  _coordinate_to_key: (coordinate) ->
    ("#{k}:#{v}" for k,v of coordinate).join(',')

  _key_to_coordinate: (key) ->
    out = {}
    for pair in key.split(',')
      [k,v] = pair.split(':')
      out[k] = parseInt(v)
    out


module.exports = CoordinateMap
