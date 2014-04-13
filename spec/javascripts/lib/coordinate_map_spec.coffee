CoordinateMap = require("lib/coordinate_map")

describe 'CoordinateMap', ->
  beforeEach ->
    @data = {a:1,b:2,c:3}
    @coordinate = {x:0,y:0}
    @coordinate_map = new CoordinateMap

  it 'can set and get a value at a coordinate', ->
    @coordinate_map.set(@coordinate, @data)
    expect(@coordinate_map.get(@coordinate)).to.eql @data

  it 'does not set data when coordinate is null', ->
    @coordinate_map.set(null, @data)
    expect(@coordinate_map.get(null)).to.eql undefined

  context 'given data', ->
    beforeEach -> @coordinate_map.set(@coordinate, @data)

    it 'can return all keys', ->
      expect(@coordinate_map.keys()).to.eql [@coordinate]

    it 'can return all values', ->
      expect(@coordinate_map.values()).to.eql [@data]

    it 'can remove data at a specifc coordinate', ->
      @coordinate_map.set(@coordinate, @data)
      @coordinate_map.remove(@coordinate)
      expect(@coordinate_map.get(@coordinate)).to.eql undefined

    it 'can clear all data', ->
      @coordinate_map.set(@coordinate, @data)
      @coordinate_map.clear()
      expect(@coordinate_map.get(@coordinate)).to.eql undefined
