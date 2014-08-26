LastPlyLayer = require('layers/last_ply_layer')

describe 'LastPlyLayer', ->
  beforeEach ->
    @container = $('<div></div>')
    @board = { add_layer: sinon.spy(), container: @container }
    @last_ply_layer = new LastPlyLayer @board

  itUpdatesLastPly = (event) ->
    beforeEach ->
      @from = {x: 0, y: 0}
      @to = {x: 1, y: 0}
      @range_capture = {x: 2, y: 0}

      sinon.stub @last_ply_layer, 'clear'
      sinon.stub @last_ply_layer, 'add'
      sinon.stub @last_ply_layer, 'draw'


    context 'movement only', ->
      beforeEach ->
        @container.trigger(event, {@from, @to})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called

      it 'add two highlights', ->
        expect(@last_ply_layer.add).to.have.been.calledcalledTwice
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @to, '#FFFF33'

      it 'draws', ->
        expect(@last_ply_layer.draw).to.have.been.called


    context 'range capture only', ->
      beforeEach ->
        @container.trigger(event, {@from, @range_capture})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called

      it 'add two highlights', ->
        expect(@last_ply_layer.add).to.have.been.calledTwice
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @range_capture, '#0066CC'

      it 'draws', ->
        expect(@last_ply_layer.draw).to.have.been.called


    context 'movement and range capture', ->
      beforeEach ->
        @container.trigger(event, {@from, @to, @range_capture})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called

      it 'add three highlights', ->
        expect(@last_ply_layer.add).to.have.been.calledThrice
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @range_capture, '#0066CC'

      it 'draws', ->
        expect(@last_ply_layer.draw).to.have.been.called


  describe 'on LastPly.update', ->
    itUpdatesLastPly('LastPly.update')

  describe 'on Ply.created', ->
    itUpdatesLastPly('Ply.created')

  describe 'on ValidPlies.show', ->
    beforeEach ->
      sinon.stub @last_ply_layer, 'hide'
      @container.trigger('ValidPlies.show')

    it 'hides', ->
      expect(@last_ply_layer.hide).to.have.been.called

    describe 'on ValidPlies.hide', ->
      beforeEach ->
        sinon.stub @last_ply_layer, 'show'
        @container.trigger('ValidPlies.hide')

      it 'shows', ->
        expect(@last_ply_layer.show).to.have.been.called
