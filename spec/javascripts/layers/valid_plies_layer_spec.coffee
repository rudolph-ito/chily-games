ValidPliesLayer = require('layers/valid_plies_layer')

describe 'ValidPliesLayer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
    @valid_plies_layer = new ValidPliesLayer @board

  describe 'ValidPlies.hide', ->
    beforeEach ->
      sinon.stub @valid_plies_layer, 'clear'
      $('body').trigger 'ValidPlies.hide'

    it 'clears', ->
      expect(@valid_plies_layer.clear).to.have.been.calledOnce


  describe 'ValidPlies.show', ->
    beforeEach ->
      @args =
        origin: {x:0,y:0}
        valid: [ {x:0,y:1}, {x:0,y:2} ]
        reachable: [ {x:0,y:3} ]

      sinon.stub @valid_plies_layer, 'clear'
      sinon.stub @valid_plies_layer, 'add'
      sinon.stub @valid_plies_layer, 'draw'

    context 'type is movement', ->
      beforeEach ->
        $('body').trigger 'ValidPlies.show', $.extend(type: 'movement', @args)

      it 'clears', ->
        expect(@valid_plies_layer.clear).to.have.been.calledOnce
        expect(@valid_plies_layer.clear.lastCall.args[0].draw).to.be.false

      it 'add the proper number of times', ->
        expect(@valid_plies_layer.add.callCount).to.eql 4

      it 'adds the piece coordinate', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:0}, '#00CC00'

      it 'adds the valid coordinates', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:1}, '#006633'
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:2}, '#006633'

      it 'adds the reachable coordinates', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:3}, '#FFFF66'

      it 'draws', ->
        expect(@valid_plies_layer.draw).to.have.been.called


    context 'type is range', ->
      beforeEach ->
        $('body').trigger 'ValidPlies.show', $.extend(type: 'range', @args)

      it 'clears', ->
        expect(@valid_plies_layer.clear).to.have.been.calledOnce
        expect(@valid_plies_layer.clear.lastCall.args[0].draw).to.be.false

      it 'add the proper number of times', ->
        expect(@valid_plies_layer.add.callCount).to.eql 4

      it 'adds the piece coordinate', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:0}, '#CC0000'

      it 'adds the valid coordinates', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:1}, '#660033'
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:2}, '#660033'

      it 'adds the reachable coordinates', ->
        expect(@valid_plies_layer.add).to.have.been.calledWith {x:0,y:3}, '#FFFF66'

      it 'draws', ->
        expect(@valid_plies_layer.draw).to.have.been.called
