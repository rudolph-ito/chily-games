Board = require("board")
CoordinateMap = require("lib/coordinate_map")
GameController = require("controllers/game_controller")
HexagonalBoard = require("boards/hexagonal_board")
SquareBoard = require("boards/square_board")

describe 'Board', ->
  beforeEach ->
    @container = $("<div>")

  describe '.create', ->
    it 'creates a square board when board_type is square', ->
      @board = Board.create(@container, 'alabaster', {board_type: 'square'}, null)
      expect(@board).to.be.an.instanceOf SquareBoard

    it 'creates a hexagonal board when board_type is hexagonal', ->
      @board = Board.create(@container, 'alabaster', {board_type: 'hexagonal'}, null)
      expect(@board).to.be.an.instanceOf HexagonalBoard

  describe '#constructor', ->
    context 'setup', ->
      beforeEach ->
        @terrain_types = [1,2,3]
        @piece_tyeps = [4,5,6]
        @game_controller = new GameController
        @board = new Board(@container, 'alabaster', {piece_types: @piece_types, terrain_types: @terrain_types}, @game_controller)

      it 'sets the color', ->
        expect(@board.color).to.eql('alabaster')

      it 'sets the piece_types', ->
        expect(@board.piece_types).to.eql(@piece_types)

      it 'sets the terrain_types', ->
        expect(@board.terrain_types).to.eql(@terrain_types)

      it 'sets the game_controller', ->
        expect(@board.game_controller).to.eql(@game_controller)

      it 'sets header_height and footer_height', ->
        expect(@board.header_height).to.eql(30)
        expect(@board.footer_height).to.eql(30)

      it 'creates piece_map and space_map', ->
        expect(@board.piece_map).to.be.an.instanceOf CoordinateMap
        expect(@board.space_map).to.be.an.instanceOf CoordinateMap

      it 'initializes setup_pieces', ->
        expect(@board.setup_pieces).to.eql([])

      it 'initializes setup_terrain', ->
        expect(@board.setup_terrain).to.eql([])

      it 'creates the stage', ->
        expect(@board.stage).to.be.an.instanceOf Kinetic.Stage

      it 'creates the space layer to draw the spaces', ->
        expect(@board.layers.space).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.space)

      it 'creates the terrain layer to draw the terrain', ->
        expect(@board.layers.terrain).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.terrain)

      it 'creates the territory layer to mark spaces as specific territory', ->
        expect(@board.layers.territory).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.territory)

      it 'creates the highlight layer to highlight spaces', ->
        expect(@board.layers.highlight).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.highlight)

      it 'creates the piece layer to draw the pieces', ->
        expect(@board.layers.piece).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.piece)

      it 'creates the info layer for any informative data', ->
        expect(@board.layers.info).to.be.an.instanceOf Kinetic.Layer
        expect(@board.stage.children).to.include(@board.layers.info)

  describe '#max_board_height', ->
    beforeEach ->
      @board = new Board(@container, 'alabaster', {}, null)
      @board.container = { height: -> 100 }
      @board.header_height = 30
      @board.footer_height = 30

    it 'returns container height minus header and footer', ->
      expect(@board.max_board_height()).to.eql(40)

  describe '#max_board_width', ->
    beforeEach ->
      @board = new Board(@container, 'alabaster', {}, null)
      @board.container = { width: -> 100 }

    it 'returns container width', ->
      expect(@board.max_board_width()).to.eql(100)

  describe '#update_stage', ->
    beforeEach ->
      @board = new Board(@container, 'alabaster', {}, null)
      @board.board_height = 200
      @board.board_width = 200
      @board.setup_width = 20

    it 'sets the stages height and width', ->
      @board.update_stage()
      expect(@board.stage.getHeight()).to.eql(260)
      expect(@board.stage.getWidth()).to.eql(220)



