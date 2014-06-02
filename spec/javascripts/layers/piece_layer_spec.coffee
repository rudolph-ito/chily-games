PieceLayer = require('layers/piece_layer')

describe 'PieceLayer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
    @piece = { }
    @piece_constructor = sinon.stub().returns @piece

    @piece_layer = new PieceLayer @board
    @piece_layer.piece_constructor = @piece_constructor

    sinon.stub @piece_layer, 'draw'
    sinon.stub @piece_layer, 'add'
    sinon.stub @piece_layer.element, 'add'

  describe '#add_from_data', ->
    it 'creates a piece', ->
      @piece_layer.add_from_data({})
      expect(@piece_constructor).to.have.been.calledWithNew

    it 'calls add', ->
      @piece_layer.add_from_data({})
      expect(@piece_layer.add).to.have.been.calledWith @piece



  describe 'on created.Ply', ->
    beforeEach ->
      sinon.stub @piece_layer, 'move_by_coordinate'
      sinon.stub @piece_layer, 'remove_by_coordinate'


    context 'move only', ->
      beforeEach ->
        $('body').trigger('created.Ply', {from: {x:0, y:0}, to: {x:0, y:1}})

      it 'calls move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.move_by_coordinate).to.have.been.calledWith {x:0, y:0}, {x:0, y:1}

      it 'does not call remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).not.to.have.been.called


    context 'range capture only', ->
      beforeEach ->
        $('body').trigger('created.Ply', {from: {x:0, y:0}, range_capture: {x:0, y:2}})

      it 'does not call move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).not.to.have.been.called

      it 'calls remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledWith {x:0, y:2}


    context 'move and range capture', ->
      beforeEach ->
        $('body').trigger('created.Ply', {from: {x:0, y:0}, to: {x:0, y:1}, range_capture: {x:0, y:2}})

      it 'calls move_by_coordinate', ->
        expect(@piece_layer.move_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.move_by_coordinate).to.have.been.calledWith {x:0, y:0}, {x:0, y:1}

      it 'calls remove_by_coordinate', ->
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledOnce
        expect(@piece_layer.remove_by_coordinate).to.have.been.calledWith {x:0, y:2}
