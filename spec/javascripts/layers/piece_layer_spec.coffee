CoordinateMap = require("lib/coordinate_map")
PieceLayer = require('layers/piece_layer')
Set = require('lib/set')

describe 'PieceLayer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy() }
    @piece = { coordinate: {x:0,y:0}, element: {}, remove: sinon.spy(), reset_position: sinon.spy(), update_coordinate: sinon.spy() }
    @piece_constructor = sinon.stub().returns @piece

    @layer = new PieceLayer @board
    @layer.child_constructor = @piece_constructor

    sinon.stub @layer, 'draw'
    sinon.stub @layer.element, 'add'

  describe '#constructor', ->
    it 'sets coordinate_map as a CoordinateMap element to the board', ->
      expect(@layer.coordinate_map).to.be.an.instanceOf CoordinateMap

    it 'sets setup as a Set', ->
      expect(@layer.setup).to.be.an.instanceOf Set

  describe '#add', ->
    it 'creates a piece', ->
      @layer.add({})
      expect(@piece_constructor).to.have.been.calledWithNew

    it 'adds the piece to the element', ->
      @layer.add({})
      expect(@layer.element.add).to.have.been.calledWith @piece.element

    context 'piece has a coordinate', ->
      it 'adds the piece to coordinate_map', ->
        sinon.stub @layer.coordinate_map, 'set'
        @layer.add({})
        expect(@layer.coordinate_map.set).to.have.been.calledWith {x:0,y:0}, @piece

    context 'piece does not have a coordinate', ->
      beforeEach -> delete @piece.coordinate

      it 'adds the piece to setup', ->
        sinon.stub @layer.setup, 'add'
        @layer.add({})
        expect(@layer.setup.add).to.have.been.calledWith @piece

  describe '#remove', ->
    it 'removes the piece from the coordinate_map', ->
      sinon.stub @layer.coordinate_map, 'remove'
      @layer.remove(@piece)
      expect(@layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'calls remove on the piece', ->
      @layer.remove(@piece)
      expect(@piece.remove).to.have.been.called

    context 'no second argument', ->
      it 'calls draw', ->
        @layer.remove(@piece)
        expect(@layer.draw).to.have.been.called

    context 'second argument is true', ->
      it 'calls draw', ->
        @layer.remove(@piece, true)
        expect(@layer.draw).to.have.been.called

    context 'second argument if false', ->
      it 'does not call draw', ->
        @layer.remove(@piece, false)
        expect(@layer.draw).not.to.have.been.called

  describe '#remove_by_coordinate', ->
    beforeEach ->
      sinon.stub @layer, 'remove'

    context 'piece found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@piece)

      it 'calls remove', ->
        @layer.remove_by_coordinate({x:0,y:0})
        expect(@layer.remove).to.have.been.calledWith(@piece)

    context 'piece not found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call remove', ->
        @layer.remove_by_coordinate({x:0,y:0})
        expect(@layer.remove).not.to.have.been.called

  describe '#move', ->
    it 'removes the piece at to without updating', ->
      sinon.stub @layer, 'remove_by_coordinate'
      @layer.move(@piece, {x:1,y:1})
      expect(@layer.remove_by_coordinate).to.have.been.calledWith {x:1,y:1}, false

    it 'calls remove on the coordinate map', ->
      sinon.stub @layer.coordinate_map, 'remove'
      @layer.move(@piece, {x:1,y:1})
      expect(@layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'updates the coordinate of the piece', ->
      @layer.move(@piece, {x:1,y:1})
      expect(@piece.update_coordinate).to.have.been.calledWith {x:1,y:1}

    it 'calls set on the coordinate map', ->
      sinon.stub @layer.coordinate_map, 'set'
      @layer.move(@piece, {x:1,y:1})
      expect(@layer.coordinate_map.set).to.have.been.calledWith {x:1,y:1}, @piece

    it 'calls draw', ->
      @layer.move(@piece, {x:1,y:1})
      expect(@layer.draw).to.have.been.called

  describe '#move_by_coordinate', ->
    beforeEach ->
      sinon.stub @layer, 'move'

    context 'piece found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@piece)

      it 'calls move', ->
        @layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@layer.move).to.have.been.calledWith(@piece, {x:1,y:1})

    context 'piece not found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call move', ->
        @layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@layer.move).not.to.have.been.called

  describe '#reset', ->
    it 'calls reset_position on the piece', ->
      @layer.reset(@piece)
      expect(@piece.reset_position).to.have.been.called

    it 'calls draw', ->
      @layer.reset(@piece)
      expect(@layer.draw).to.have.been.called

  describe '#setup_replace', ->
    beforeEach ->
      @piece = { x: 0, y: 1, piece_type_id: 2, color: 'onyx' }

    it 'removes the object from the setup', ->
      sinon.stub @layer.setup, 'remove'
      @layer.setup_replace(@piece)
      expect(@layer.setup.remove).to.have.been.calledWith @piece

    it 'calls add with the proper attributes', ->
      sinon.stub @layer, 'add'
      @layer.setup_replace(@piece)
      expect(@layer.add).to.have.been.calledWith { x: 0, y: 1, piece_type_id: 2, color: 'onyx' }

  describe '#setup_clear', ->
    beforeEach ->
      @piece1 = { remove: sinon.spy() }
      @piece2 = { remove: sinon.spy() }

    it 'calls remove on all the pieces in setup', ->
      sinon.stub @layer.setup, 'values', => [@piece1, @piece2]
      @layer.setup_clear()
      expect(@piece1.remove).to.have.been.called
      expect(@piece2.remove).to.have.been.called

    it 'calls clear on setup', ->
      sinon.stub @layer.setup, 'clear'
      @layer.setup_clear()
      expect(@layer.setup.clear).to.have.been.called
