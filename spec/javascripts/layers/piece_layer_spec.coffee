PieceLayer = require('layers/piece_layer')

describe 'PieceLayer', ->
  beforeEach ->
    @container = $('<div></div>')
    @board = { add_layer: sinon.spy(), container: @container }
    @piece = { }
    @piece_constructor = sinon.stub().returns @piece

    @piece_layer = new PieceLayer @board
    @piece_layer.piece_constructor = @piece_constructor

    sinon.stub @piece_layer, 'draw'
    sinon.stub @piece_layer, 'add'
    sinon.stub @piece_layer.element, 'add'

  describe '#add_from_data', ->
    beforeEach ->
      @piece_layer.add_from_data({})

    it 'creates a piece', ->
      expect(@piece_constructor).to.have.been.calledWithNew

    it 'calls add', ->
      expect(@piece_layer.add).to.have.been.calledWith @piece


  describe 'on Pieces.add', ->
    beforeEach ->
      @add_stub = sinon.stub @piece_layer, 'add_from_data'

    context 'no pieces', ->
      beforeEach ->
        @container.trigger('Pieces.add', [])

      it 'does not call add_from_data', ->
        expect(@add_stub).not.to.have.been.called

    context '1 piece', ->
      beforeEach ->
        @container.trigger('Pieces.add', [{piece: 'data1'}])

      it 'calls add_from_data once', ->
        expect(@add_stub).to.have.been.calledOnce
        expect(@add_stub.lastCall.args[0]).to.eql {piece: 'data1'}

    context '2 pieces', ->
      beforeEach ->
        @container.trigger('Pieces.add', [{piece: 'data1'}, {piece: 'data2'}])

      it 'calls add_from_data once per piece', ->
        expect(@add_stub).to.have.been.calledTwice
        expect(@add_stub.getCall(0).args[0]).to.eql {piece: 'data1'}
        expect(@add_stub.getCall(1).args[0]).to.eql {piece: 'data2'}


  describe 'on Ply.created', ->
    beforeEach ->
      sinon.stub @piece_layer, 'move_by_coordinate'
      sinon.stub @piece_layer, 'remove_by_coordinate'


    context 'move only', ->
      beforeEach ->
        @container.trigger('Ply.created', {from: {x:0, y:0}, to: {x:0, y:1}})

      it 'calls move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.move_by_coordinate).to.have.been.calledWith {x:0, y:0}, {x:0, y:1}

      it 'does not call remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).not.to.have.been.called


    context 'range capture only', ->
      beforeEach ->
        @container.trigger('Ply.created', {from: {x:0, y:0}, range_capture: {x:0, y:2}})

      it 'does not call move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).not.to.have.been.called

      it 'calls remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledWith {x:0, y:2}


    context 'move and range capture', ->
      beforeEach ->
        @container.trigger('Ply.created', {from: {x:0, y:0}, to: {x:0, y:1}, range_capture: {x:0, y:2}})

      it 'calls move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.move_by_coordinate).to.have.been.calledWith {x:0, y:0}, {x:0, y:1}

      it 'calls remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledWith {x:0, y:2}
