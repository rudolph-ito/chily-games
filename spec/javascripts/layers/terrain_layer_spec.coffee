TerrainLayer = require('layers/terrain_layer')

describe 'TerrainLayer', ->
  beforeEach ->
    @space = { }
    @space_constructor = sinon.stub().returns @space
    @board = { add_layer: sinon.spy(), space_constructor: @space_constructor }

    @terrain_layer = new TerrainLayer @board

    sinon.stub @terrain_layer, 'draw'
    sinon.stub @terrain_layer, 'add'
    sinon.stub @terrain_layer.element, 'add'

  describe '#add_from_data', ->
    it 'creates a space', ->
      @terrain_layer.add_from_data({})
      expect(@space_constructor).to.have.been.calledWithNew

    it 'calls add', ->
      @terrain_layer.add_from_data({})
      expect(@terrain_layer.add).to.have.been.calledWith @space
