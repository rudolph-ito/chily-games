TerrainType = require("terrain_type")

describe 'TerrainType', ->

  context '.set_data', ->
    it 'sets the url_map', ->
      TerrainType.set_data({1: '/terrain_types/1/image.png'})
      expect(TerrainType.url_map).to.not.be.undefined

  context '.url_for', ->
    beforeEach ->
      TerrainType.set_data({1: '/terrain_types/1/image.png'})

    it 'returns the url', ->
      expect(TerrainType.url_for(1)).to.eql '/terrain_types/1/image.png'

