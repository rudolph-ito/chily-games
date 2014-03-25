TerritoryLayer = require('layers/territory_layer')

describe 'TerritoryLayer', ->
  beforeEach ->
    @space = { coordinate: {x:0,y:0}, element: {} }
    @space_constructor = sinon.stub().returns @space
    @board = { add_layer: sinon.spy(), space_constructor: @space_constructor }

    @layer = new TerritoryLayer @board

    sinon.stub @layer.element, 'add'

  describe '#add', ->
    it 'creates a piece', ->
      @layer.add({x:0,y:0})
      expect(@space_constructor).to.have.been.calledWithNew

    it 'adds the piece to the element', ->
      @layer.add({x:0,y:0})
      expect(@layer.element.add).to.have.been.calledWith @space.element
