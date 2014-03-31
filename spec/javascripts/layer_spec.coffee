Layer = require('layer')

describe 'Layer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
    @layer = new Layer @board

    sinon.spy @layer.element, 'draw'
    sinon.spy @layer.element, 'removeChildren'

  describe '#constructor', ->
    it 'sets the element', ->
      expect(@layer.element).to.be.an.instanceOf Kinetic.Layer

    it 'adds the element to the board', ->
      expect(@board.add_layer).to.have.been.calledWith @layer.element

  describe '#draw', ->
    it 'calls draw on the element', ->
      @layer.draw()
      expect(@layer.element.draw).to.have.been.called

  describe '#clear', ->
    it 'calls removeChildren and draw on the element', ->
      @layer.clear()
      expect(@layer.element.removeChildren).to.have.been.called
      expect(@layer.element.draw).to.have.been.called
