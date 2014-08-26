ValidPliesLayer = require('layers/valid_plies_layer')

describe 'ValidPliesLayer', ->
  beforeEach ->
    @container = $('<div></div>')
    @board = { add_layer: sinon.spy(), container: @container }
    @valid_plies_layer = new ValidPliesLayer @board

  describe 'Ply.created', ->
    beforeEach ->
      @clearStub = sinon.stub @valid_plies_layer, 'clear'
      @container.trigger 'Ply.created'

    it 'clears', ->
      expect(@clearStub).to.have.been.calledOnce
      expect(@clearStub.lastCall.args[0]).to.eql draw: true


  describe 'ValidPlies.hide', ->
    beforeEach ->
      @clearStub = sinon.stub @valid_plies_layer, 'clear'
      @container.trigger 'ValidPlies.hide'

    it 'clears', ->
      expect(@clearStub).to.have.been.calledOnce
      expect(@clearStub.lastCall.args[0]).to.eql draw: true


  describe 'ValidPlies.show', ->
    beforeEach ->
      @args =
        origin: {x:0,y:0}
        valid: [ {x:0,y:1}, {x:0,y:2} ]
        reachable: [ {x:0,y:3} ]

      @clearStub = sinon.stub @valid_plies_layer, 'clear'
      @addStub = sinon.stub @valid_plies_layer, 'add'
      @drawStub = sinon.stub @valid_plies_layer, 'draw'

    context 'type is movement', ->
      beforeEach ->
        @container.trigger 'ValidPlies.show', $.extend(type: 'movement', @args)

      it 'clears', ->
        expect(@clearStub).to.have.been.calledOnce

      it 'add the proper number of times', ->
        expect(@addStub.callCount).to.eql 4

      it 'adds the piece coordinate', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:0}, '#00CC00'

      it 'adds the valid coordinates', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:1}, '#006633'
        expect(@addStub).to.have.been.calledWith {x:0,y:2}, '#006633'

      it 'adds the reachable coordinates', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:3}, '#FFFF66'

      it 'draws', ->
        expect(@drawStub).to.have.been.called


    context 'type is range', ->
      beforeEach ->
        @container.trigger 'ValidPlies.show', $.extend(type: 'range', @args)

      it 'clears', ->
        expect(@clearStub).to.have.been.calledOnce

      it 'add the proper number of times', ->
        expect(@addStub.callCount).to.eql 4

      it 'adds the piece coordinate', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:0}, '#CC0000'

      it 'adds the valid coordinates', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:1}, '#660033'
        expect(@addStub).to.have.been.calledWith {x:0,y:2}, '#660033'

      it 'adds the reachable coordinates', ->
        expect(@addStub).to.have.been.calledWith {x:0,y:3}, '#FFFF66'

      it 'draws', ->
        expect(@drawStub).to.have.been.called
