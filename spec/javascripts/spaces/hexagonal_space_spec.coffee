HexagonalSpace = require("spaces/hexagonal_space")
Space = require('space')

describe 'HexagonalSpace', ->
  beforeEach ->
    @board = {space_radius: 5}
    @hexagonal_space = new HexagonalSpace board: @board, x: 1, y: 2
    sinon.stub Space::, 'init'
    sinon.stub Space::, 'update_size'

  afterEach ->
    Space::init.restore()
    Space::update_size.restore()

  describe '#init', ->
    it 'sets @element', ->
      @hexagonal_space.init()
      expect(@hexagonal_space.element).to.be.instanceOf Kinetic.RegularPolygon
      expect(@hexagonal_space.element.attrs.sides).to.be.eql 6
      expect(@hexagonal_space.element.attrs.stroke).to.be.eql '#000'
      expect(@hexagonal_space.element.attrs.strokeWidth).to.be.eql 1

    it 'calls super', ->
      @hexagonal_space.init()
      expect(Space::init).to.have.been.called

  describe '#update_size', ->
    beforeEach ->
      @hexagonal_space.board.space_radius = 10

    it 'sets the radius', ->
      @hexagonal_space.update_size()
      expect(@hexagonal_space.radius).to.eql 10

    it 'sets the size as twice the radius (user for displaying terrain)', ->
      @hexagonal_space.update_size()
      expect(@hexagonal_space.size).to.eql 20

    it 'sets radius of @element', ->
      @hexagonal_space.update_size()
      expect(@hexagonal_space.element.attrs.radius).to.eql 10

    it 'calls super', ->
      @hexagonal_space.update_size()
      expect(Space::update_size).to.have.been.called

  describe '#terrain_offset', ->
    it 'returns inputs divided by 2', ->
      expect(@hexagonal_space.terrain_offset(10,10)).to.eql {x:5, y:5}
      expect(@hexagonal_space.terrain_offset(25,25)).to.eql {x:12.5, y:12.5}

  describe '#contains', ->
    beforeEach ->
      @hexagonal_space.radius = 5
      @hexagonal_space.x = 10
      @hexagonal_space.y = 10

    it 'returns true if in the space', ->
      expect(@hexagonal_space.contains(10,10)).to.eql true
      expect(@hexagonal_space.contains(13,12)).to.eql true
      expect(@hexagonal_space.contains(8,7)).to.eql true

    it 'returns false otherwise', ->
      expect(@hexagonal_space.contains(15,12)).to.eql false
      expect(@hexagonal_space.contains(5,4)).to.eql false