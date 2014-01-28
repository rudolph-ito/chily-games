class TerrainType
  @url_map: {}

  @set_data: (data) ->
    @url_map = data

  @url_for: (terrain_type_id) ->
    @url_map[terrain_type_id]

module.exports = TerrainType
