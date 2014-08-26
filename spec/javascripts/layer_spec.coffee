CoordinateMap = require('lib/coordinate_map')
Layer = require('layer')

describe 'Layer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
    @layer = new Layer @board

    sinon.spy @layer.element, 'draw'
    sinon.spy @layer.element, 'hide'
    sinon.spy @layer.element, 'removeChildren'
    sinon.spy @layer.element, 'show'
    sinon.spy @layer.coordinate_map, 'clear'

  describe '#constructor', ->
    it 'sets the element', ->
      expect(@layer.element).to.be.an.instanceOf Kinetic.Layer

    it 'sets coordinate_map as a CoordinateMap element to the board', ->
      expect(@layer.coordinate_map).to.be.an.instanceOf CoordinateMap

    it 'adds the element to the board', ->
      expect(@board.add_layer).to.have.been.calledWith @layer.element

  describe '#draw', ->
    it 'calls draw on the element', ->
      @layer.draw()
      expect(@layer.element.draw).to.have.been.called

  describe '#show', ->
    beforeEach ->
      @layer.show()

    it 'calls show on the element', ->
      expect(@layer.element.show).to.have.been.called

  describe '#hide', ->
    beforeEach ->
      @layer.hide()

    it 'calls hide on the element', ->
      expect(@layer.element.hide).to.have.been.called

  describe '#update', ->
    beforeEach ->
      @children = [{update: sinon.spy()}, {update: sinon.spy()}]
      sinon.stub @layer.coordinate_map, 'values', => @children

    itUpdatesChildren = ->
      it 'calls update on every item in coordinate_map.values()', ->
        expect(@children[0].update).to.have.been.called
        expect(@children[1].update).to.have.been.called

    context 'with no options', ->
      beforeEach ->
        @layer.update()

      itUpdatesChildren()

      it 'does not call draw on the element', ->
        expect(@layer.element.draw).to.not.have.been.called

    context 'with options where draw is true', ->
      beforeEach ->
        @layer.update(draw: true)

      itUpdatesChildren()

      it 'calls draw on the element', ->
        expect(@layer.element.draw).to.have.been.called

  describe '#clear', ->
    itClears = ->
      it 'calls clear on coordinate_map', ->
        expect(@layer.coordinate_map.clear).to.have.been.called

      it 'calls removeChildren and draw on the element', ->
        expect(@layer.element.removeChildren).to.have.been.called


    context 'with no options', ->
      beforeEach ->
        @layer.clear()

      itClears()

      it 'does not call draw on the element', ->
        expect(@layer.element.draw).not.to.have.been.called

    context 'with options where draw is true', ->
      beforeEach ->
        @layer.clear(draw: true)

      itClears()

      it 'calls draw on the element', ->
        expect(@layer.element.draw).to.have.been.called
