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
