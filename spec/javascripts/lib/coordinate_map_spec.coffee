CoordinateMap = require("lib/coordinate_map")

describe 'CoordinateMap', ->
  beforeEach ->
    @data = {a:1,b:2,c:3}
    @coordinate = {x:0,y:0}
    @coordinate_map = new CoordinateMap

  it 'basic set and get', ->
    @coordinate_map.set(@coordinate, @data)
    expect(@coordinate_map.get(@coordinate)).to.eql @data
    expect(@coordinate_map.values()).to.eql [@data]

  it 'remove', ->
    @coordinate_map.set(@coordinate, @data)
    @coordinate_map.remove(@coordinate)
    expect(@coordinate_map.get(@coordinate)).to.eql null

  it 'move', ->
    new_coordinate = {x:1,y:0}
    @coordinate_map.set(@coordinate, @data)
    @coordinate_map.move(@coordinate, new_coordinate)
    expect(@coordinate_map.get(@coordinate)).to.eql null
    expect(@coordinate_map.get(new_coordinate)).to.eql @data
