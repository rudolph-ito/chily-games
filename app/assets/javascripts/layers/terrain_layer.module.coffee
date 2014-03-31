ObjectLayer = require('layers/object_layer')

class TerrainLayer extends ObjectLayer

  add_from_data: (data) ->
    attrs = $.extend data,
      board: @board
      display_type: 'terrain',
      display_option: data.terrain_type_id,
      layer: @

    terrain = new @board.space_constructor(attrs)

    @add(terrain)

module.exports = TerrainLayer
