CoordinateMap = require("lib/coordinate_map")

describe 'CoordinateMap', ->
  beforeEach ->
    @data = {a:1,b:2,c:3}
    @coordinate = {x:0,y:0}
    @coordinate_map = new CoordinateMap
    @coordinate_map.set(@coordinate, @data)

  context '#get', ->
    it 'gets the data at the specific coordinate', ->
      expect(@coordinate_map.get(@coordinate)).to.eql @data
      expect(@coordinate_map.get({x:1,y:1})).to.eql undefined

  context '#keys', ->
    it 'returns an array of keys', ->
      expect(@coordinate_map.keys()).to.eql [@coordinate]

  context '#values', ->
    it 'returns an array of values', ->
      expect(@coordinate_map.values()).to.eql [@data]

  context '#remove', ->
    it 'removes the value at the specific coordinate', ->
      expect(@coordinate_map.get(@coordinate)).to.eql @data
      @coordinate_map.remove(@coordinate)
      expect(@coordinate_map.get(@coordinate)).to.eql undefined

  context '#clear', ->
    it 'removes all data', ->
      expect(@coordinate_map.get(@coordinate)).to.eql @data
      @coordinate_map.clear()
      expect(@coordinate_map.get(@coordinate)).to.eql undefined
