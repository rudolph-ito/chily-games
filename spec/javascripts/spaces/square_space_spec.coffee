SquareSpace = require("spaces/square_space")
Space = require('space')

describe 'SquareSpace', ->
  beforeEach ->
    @board = {space_size: 10}
    @square_space = new SquareSpace board: @board, x: 1, y: 2
    sinon.stub Space::, 'init'
    sinon.stub Space::, 'update_size'

  afterEach ->
    Space::init.restore()
    Space::update_size.restore()

  describe '#init', ->
    it 'sets @element', ->
      @square_space.init()
      expect(@square_space.element).to.be.instanceOf Kinetic.Rect
      expect(@square_space.element.attrs.stroke).to.be.eql '#000'
      expect(@square_space.element.attrs.strokeWidth).to.be.eql 1

    it 'calls super', ->
      @square_space.init()
      expect(Space::init).to.have.been.called

  describe '#update_size', ->
    beforeEach ->
      @square_space.board.space_size = 20

    it 'sets the size', ->
      @square_space.update_size()
      expect(@square_space.size).to.eql 20

    it 'updates offset, height, and width of @element', ->
      @square_space.update_size()
      expect(@square_space.element.attrs.offset.x).to.eql 10
      expect(@square_space.element.attrs.offset.y).to.eql 10
      expect(@square_space.element.attrs.width).to.eql 20
      expect(@square_space.element.attrs.height).to.eql 20

    it 'calls super', ->
      @square_space.update_size()
      expect(Space::update_size).to.have.been.called

  describe '#terrain_offset', ->
    it 'returns 0,0', ->
      expect(@square_space.terrain_offset(10,10)).to.eql {x:0, y:0}
      expect(@square_space.terrain_offset(25,25)).to.eql {x:0, y:0}

  describe '#contains', ->
    beforeEach ->
      @square_space.size = 10
      @square_space.x = 10
      @square_space.y = 10

    it 'returns true if in the space', ->
      expect(@square_space.contains(5,5)).to.eql true
      expect(@square_space.contains(5,15)).to.eql true
      expect(@square_space.contains(15,15)).to.eql true
      expect(@square_space.contains(15,5)).to.eql true
      expect(@square_space.contains(10,10)).to.eql true

    it 'returns false otherwise', ->
      expect(@square_space.contains(8,4)).to.eql false
      expect(@square_space.contains(4,8)).to.eql false
      expect(@square_space.contains(16,8)).to.eql false
      expect(@square_space.contains(8,16)).to.eql false
