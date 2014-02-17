class Set

  constructor: ->
    @clear()

  add: (element) ->
    @data.push(element)

  remove: (element) ->
    @data = @data.filter (x) => x isnt element

  values: ->
    @data

  clear: ->
    @data = []

module.exports = Set
