TerrainLayer = require('layers/terrain_layer')

describe 'TerrainLayer', ->
  beforeEach ->
    @container = $('<div></div>')
    @space = { }
    @space_constructor = sinon.stub().returns @space
    @board = { add_layer: sinon.spy(), container: @container, space_constructor: @space_constructor }

    @terrain_layer = new TerrainLayer @board

    sinon.stub @terrain_layer, 'draw'
    sinon.stub @terrain_layer, 'add'
    sinon.stub @terrain_layer.element, 'add'

  describe '#add_from_data', ->
    beforeEach ->
      @terrain_layer.add_from_data({})

    it 'creates a space', ->
      expect(@space_constructor).to.have.been.calledWithNew

    it 'calls add', ->
      expect(@terrain_layer.add).to.have.been.calledWith @space

  describe 'on Terrains.add', ->
    beforeEach ->
      @add_stub = sinon.stub @terrain_layer, 'add_from_data'

    context 'no terrain', ->
      beforeEach ->
        @container.trigger('Terrains.add', [])

      it 'does not call add_from_data', ->
        expect(@add_stub).not.to.have.been.called

    context '1 terrain', ->
      beforeEach ->
        @container.trigger('Terrains.add', [{terrain: 'data1'}])

      it 'calls add_from_data once', ->
        expect(@add_stub).to.have.been.calledOnce
        expect(@add_stub.lastCall.args[0]).to.eql {terrain: 'data1'}

    context '2 terrain', ->
      beforeEach ->
        @container.trigger('Terrains.add', [{terrain: 'data1'}, {terrain: 'data2'}])

      it 'calls add_from_data once per terrain', ->
        expect(@add_stub).to.have.been.calledTwice
        expect(@add_stub.getCall(0).args[0]).to.eql {terrain: 'data1'}
        expect(@add_stub.getCall(1).args[0]).to.eql {terrain: 'data2'}
