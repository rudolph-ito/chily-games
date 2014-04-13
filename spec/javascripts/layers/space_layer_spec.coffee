SpaceLayer = require('layers/space_layer')

describe 'SpaceLayer', ->
  beforeEach ->
    @space = { coordinate: {x:0,y:0}, element: {} }
    @space_constructor = sinon.stub().returns @space
    @board = { add_layer: sinon.spy(), space_constructor: @space_constructor }

    @layer = new SpaceLayer @board

    sinon.stub @layer.element, 'add'

  describe '#add', ->
    it 'creates a piece', ->
      @layer.add({x:0,y:0})
      expect(@space_constructor).to.have.been.calledWithNew

    it 'adds the piece to the element', ->
      @layer.add({x:0,y:0})
      expect(@layer.element.add).to.have.been.calledWith @space.element

    it 'adds the piece to coordinate_map', ->
      sinon.stub @layer.coordinate_map, 'set'
      @layer.add({x:0,y:0})
      expect(@layer.coordinate_map.set).to.have.been.calledWith {x:0,y:0}, @space
