ObjectLayer = require('layers/object_layer')

class TerrainLayer extends ObjectLayer

  constructor: ->
    super
    @board.container.on('Terrains.add', @on_add_terrain)


  add_from_data: (data) ->
    attrs = $.extend
      board: @board
      display_type: 'terrain',
      display_option: data.terrain_type_id,
      layer: @
    , data
    terrain = new @board.space_constructor(attrs)
    @add(terrain)


  on_add_terrain: (e, data...) =>
    @add_from_data(datum) for datum in data


module.exports = TerrainLayer
