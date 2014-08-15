LastPlyLayer = require('layers/last_ply_layer')

describe 'LastPlyLayer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
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
        $('body').trigger(event, {@from, @to})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called
        expect(@last_ply_layer.clear.lastCall.args[0].draw).to.be.false

      it 'add two highlights', ->
        expect(@last_ply_layer.add).to.have.been.calledcalledTwice
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @to, '#FFFF33'

      it 'draws', ->
        expect(@last_ply_layer.draw).to.have.been.called


    context 'range capture only', ->
      beforeEach ->
        $('body').trigger(event, {@from, @range_capture})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called
        expect(@last_ply_layer.clear.lastCall.args[0].draw).to.be.false

      it 'add two highlights', ->
        expect(@last_ply_layer.add).to.have.been.calledTwice
        expect(@last_ply_layer.add).to.have.been.calledWith @from, '#FFFF33'
        expect(@last_ply_layer.add).to.have.been.calledWith @range_capture, '#0066CC'

      it 'draws', ->
        expect(@last_ply_layer.draw).to.have.been.called


    context 'movement and range capture', ->
      beforeEach ->
        $('body').trigger(event, {@from, @to, @range_capture})

      it 'clears', ->
        expect(@last_ply_layer.clear).to.have.been.called
        expect(@last_ply_layer.clear.lastCall.args[0].draw).to.be.false

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
      $('body').trigger('ValidPlies.show')

    it 'hides', ->
      expect(@last_ply_layer.hide).to.have.been.called

    describe 'on ValidPlies.hide', ->
      beforeEach ->
        sinon.stub @last_ply_layer, 'show'
        $('body').trigger('ValidPlies.hide')

      it 'shows', ->
        expect(@last_ply_layer.show).to.have.been.called
