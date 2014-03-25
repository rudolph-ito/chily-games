Piece = require('piece')

describe 'Piece', ->
  beforeEach ->
    @board = { click: (->), color: 'alabaster', piece_drag_start: (->), piece_drag_end: (->), piece_size: 5, position: (-> {x:100,y:200}) }
    @options = { board: @board }
    sinon.stub Piece::, 'load_image'

  afterEach ->
    Piece::load_image.restore()

  context '#constuctor', ->

    it 'creates element', ->
      piece = new Piece @options
      expect(piece.element).to.be.instanceOf Kinetic.Image

    context 'color matches board color', ->
      it 'sets element draggable to true', ->
        piece = new Piece($.extend @options, color: 'alabaster')
        expect(piece.element.attrs.draggable).to.eql true

    context 'color does not match board color', ->
      it 'sets element draggable to false', ->
        piece = new Piece($.extend @options, color: 'onyx')
        expect(piece.element.attrs.draggable).to.eql false

    it 'calls update', ->
      sinon.stub Piece::, 'update'
      new Piece @options
      expect(Piece::update).to.have.been.called
      Piece::update.restore()

    it 'calls load_image', ->
      new Piece @options
      expect(Piece::load_image).to.have.been.called

  context '#update_position', ->
    context 'with a coordinate', ->
      beforeEach ->
        @piece = new Piece($.extend @options, coordinate: {x:1, y:1})
        @piece.x = 0
        @piece.y = 0
        @piece.element.attrs.x = 0
        @piece.element.attrs.y = 0

      it 'updates @x, @y', ->
        expect(@piece.x).to.eql 0
        expect(@piece.y).to.eql 0
        @piece.update_position()
        expect(@piece.x).to.eql 100
        expect(@piece.y).to.eql 200

      it 'updates @element position', ->
        @piece.update_position()
        expect(@piece.element.attrs.x).to.eql 100
        expect(@piece.element.attrs.y).to.eql 200

    context 'without a coordinate', ->
      beforeEach ->
        @piece = new Piece($.extend @options, x:25, y:75)
        @piece.element.attrs.x = 0
        @piece.element.attrs.y = 0

      it 'update @element position', ->
        @piece.update_position()
        expect(@piece.element.attrs.x).to.eql 25
        expect(@piece.element.attrs.y).to.eql 75

  context '#update_size', ->
    beforeEach ->
      @piece = new Piece @options
      @board.piece_size = 10

    it 'updates @size', ->
      @piece.update_size()
      expect(@piece.size).to.eql 10

    it 'updates @element size', ->
      @piece.update_size()
      expect(@piece.element.attrs.width).to.eql 10
      expect(@piece.element.attrs.height).to.eql 10

  context '#click', ->
    beforeEach -> @piece = new Piece($.extend @options, coordinate: {x:1, y:1})

    context 'not dragging', ->
      beforeEach -> @piece.dragging = false

      it 'calls @board.click with @coordinate', ->
        sinon.stub @board, 'click'
        @piece.click()
        expect(@board.click).to.have.been.calledWith {x:1, y:1}
        @board.click.restore()

    context 'dragging', ->
      beforeEach -> @piece.dragging = true

      it 'does no call board.click', ->
        sinon.stub @board, 'click'
        @piece.click()
        expect(@board.click).to.not.have.been.called
        @board.click.restore()

  context '#drag_start', ->
    beforeEach -> @piece = new Piece @options

    it 'sets dragging to true', ->
      @piece.drag_start()
      expect(@piece.dragging).to.eql true

    it 'calls @board.piece_drag_start', ->
      sinon.stub @board, 'piece_drag_start'
      @piece.drag_start()
      expect(@board.piece_drag_start).to.have.been.calledWith(@piece)
      @board.piece_drag_start.restore()

  context '#drag_end', ->
    beforeEach -> @piece = new Piece @options

    it 'sets dragging to false', ->
      @piece.drag_end()
      expect(@piece.dragging).to.eql false

    it 'calls @board.piece_drag_end', ->
      sinon.stub @board, 'piece_drag_end'
      @piece.drag_end()
      expect(@board.piece_drag_end).to.have.been.calledWith(@piece)
      @board.piece_drag_end.restore()

  context '#setup', ->
    beforeEach -> @piece = new Piece @options

    context 'with a coordinate', ->
      beforeEach -> @piece.coordinate = {x:1, y:1}

      it 'returns false', ->
        expect(@piece.setup()).to.eql false

    context 'without a coordinate', ->
      beforeEach -> @piece.coordinate = null

      it 'returns true', ->
        expect(@piece.setup()).to.eql true

  context '#current_position', ->
    beforeEach ->
      @piece = new Piece @options
      @piece.element.attrs.x = 25
      @piece.element.attrs.y = 75

    it 'returns @element position', ->
      expect(@piece.current_position()).to.eql {x:25, y:75}

  context '#reset_position', ->
    beforeEach ->
      @piece = new Piece($.extend @options, x:100, y:200)
      @piece.element.attrs.x = 25
      @piece.element.attrs.y = 75

    it 'reset @element x and y', ->
      @piece.reset_position()
      expect(@piece.element.attrs.x).to.eql 100
      expect(@piece.element.attrs.y).to.eql 200

  context 'remove', ->
    beforeEach -> @piece = new Piece @options

    it 'calls remove on element', ->
      sinon.stub @piece.element, 'remove'
      @piece.remove()
      expect(@piece.element.remove).to.have.been.called
      @piece.element.remove()
