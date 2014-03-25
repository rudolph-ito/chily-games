Board = require("board")
CoordinateMap = require('lib/coordinate_map')
HexagonalBoard = require("boards/hexagonal_board")
HighlightLayer = require('layers/highlight_layer')
Piece = require('piece')
PieceLayer = require('layers/piece_layer')
Set = require('lib/set')
SpaceLayer = require('layers/space_layer')
SquareBoard = require("boards/square_board")
TerrainLayer = require('layers/terrain_layer')
TerritoryLayer = require('layers/territory_layer')

describe 'Board', ->
  before ->
    @container = $("<div style='height:100px;width:100px;'>")
    @color = 'alabaster'
    @options = { piece_types: [1,2,3], terrain_types: [4] }
    @game_controller =
      bottom_player_name: -> 'Player2'
      top_player_name: -> 'Player1'
      user_in_setup: -> false

  beforeEach ->
    @board = new Board(@container, @color, @options, @game_controller)
    sinon.stub @board, 'add_space'
    sinon.stub @board, 'add_piece'
    sinon.stub @board, 'add_terrain'

  describe '.preview', ->
    beforeEach ->
      @path = @done = null
      sinon.stub $, 'getJSON', (path) =>
        @path = path
        {done: (callback) => @callback = callback}

    afterEach ->
      $.getJSON.restore()

    it 'makes a request', ->
      Board.preview(@container, 1)
      expect(@path).to.eql("/api/variants/1/preview?")

    context 'with piece_type_id and type', ->
      it 'makes a request', ->
        Board.preview(@container, 1, {piece_type_id: 2, type: 'movement'})
        expect(@path).to.eql("/api/variants/1/preview?piece_type_id=2&type=movement")

    context 'when the request returns', ->
      beforeEach ->
        Board.preview(@container, 1, {piece_type_id: 2, type: 'movement'})
        sinon.stub Board::, 'draw'

      afterEach ->
        Board::draw.restore()

      it 'creates a board and draws', ->
        @callback(color: 'alabaster', options: {board_type: 'square'})
        expect(Board::draw).to.have.been.called

      context 'response includes pieces', ->
        beforeEach ->
          sinon.stub Board::, 'add_pieces'
          sinon.stub Board::, 'highlight_valid_plies'

        afterEach ->
          Board::add_pieces.restore()
          Board::highlight_valid_plies.restore()

        it 'draws pieces', ->
          @callback(color: 'alabaster', options: {board_type: 'square'}, pieces: [{}], valid_plies: {})
          expect(Board::add_pieces).to.have.been.called

        it 'highlight_valid_plies', ->
          @callback(color: 'alabaster', options: {board_type: 'square'}, pieces: [{}], valid_plies: {})
          expect(Board::highlight_valid_plies).to.have.been.called

  describe '.create', ->
    it 'creates a square board when board_type is square', ->
      @board = Board.create(@container, 'alabaster', {board_type: 'square'}, null)
      expect(@board).to.be.an.instanceOf SquareBoard

    it 'creates a hexagonal board when board_type is hexagonal', ->
      @board = Board.create(@container, 'alabaster', {board_type: 'hexagonal'}, null)
      expect(@board).to.be.an.instanceOf HexagonalBoard

  describe '#constructor', ->
    it 'sets the color', ->
      expect(@board.color).to.eql('alabaster')

    it 'sets the piece_types', ->
      expect(@board.piece_types).to.eql([1,2,3])

    it 'sets the terrain_types', ->
      expect(@board.terrain_types).to.eql([4])

    it 'sets the game_controller', ->
      expect(@board.game_controller).to.eql(@game_controller)

    it 'sets header_height and footer_height', ->
      expect(@board.header_height).to.eql(30)
      expect(@board.footer_height).to.eql(30)

    it 'creates the stage', ->
      expect(@board.stage).to.be.an.instanceOf Kinetic.Stage

    it 'creates the space layer', ->
      expect(@board.space_layer).to.be.an.instanceOf SpaceLayer
      expect(@board.stage.children).to.include(@board.space_layer.element)

    it 'creates the terrain layer', ->
      expect(@board.terrain_layer).to.be.an.instanceOf TerrainLayer
      expect(@board.stage.children).to.include(@board.terrain_layer.element)

    it 'creates the territory layer', ->
      expect(@board.territory_layer).to.be.an.instanceOf TerritoryLayer
      expect(@board.stage.children).to.include(@board.territory_layer.element)

    it 'creates the highlight layer', ->
      expect(@board.highlight_layer).to.be.an.instanceOf HighlightLayer
      expect(@board.stage.children).to.include(@board.highlight_layer.element)

    it 'creates the piece layer to draw the pieces and a piece coordinate_map', ->
      expect(@board.piece_layer).to.be.an.instanceOf PieceLayer
      expect(@board.stage.children).to.include(@board.piece_layer.element)

    it 'creates the info layer for any informative data', ->
      expect(@board.info_layer).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.info_layer)

  describe '#max_board_height', ->
    beforeEach ->
      @board.container = { height: -> 200 }
      @board.header_height = 10
      @board.footer_height = 10
      @board.padding = 2

    it 'returns container height minus header and footer', ->
      expect(@board.max_board_height()).to.eql(178)

  describe '#max_board_width', ->
    beforeEach ->
      @board.container = { width: -> 200 }

    it 'returns container width', ->
      expect(@board.max_board_width()).to.eql(198)

  describe '#setup', ->
    beforeEach ->
      @board.board_height = 200
      @board.board_width = 200
      @board.header_height = 10
      @board.footer_height = 10
      @board.padding = 2
      @board.setup_width = 20

    it 'sets the stages height and width', ->
      @board.setup()
      expect(@board.stage.getHeight()).to.eql(224)
      expect(@board.stage.getWidth()).to.eql(224)

  describe 'draw', ->
    it 'calls setup', ->
      sinon.spy @board, 'setup'
      @board.draw()
      expect(@board.setup).to.have.been.called
      @board.setup.restore()

    it 'calls draw_space_layer', ->
      sinon.spy @board, 'draw_space_layer'
      @board.draw()
      expect(@board.draw_space_layer).to.have.been.called
      @board.draw_space_layer.restore()

    context 'game_controller exists', ->
      it 'calls draw_info_layer', ->
        sinon.spy @board, 'draw_info_layer'
        @board.draw()
        expect(@board.draw_info_layer).to.have.been.called
        @board.draw_info_layer.restore()

      context 'user is in setup', ->
        before -> @game_controller.user_in_setup = -> true
        it 'calls draw setup', ->
          sinon.spy @board, 'add_setup'
          @board.draw()
          expect(@board.add_setup).to.have.been.called
          @board.add_setup.restore()

  describe 'add_header', ->
    it 'sets header', ->
      @board.add_header()
      expect(@board.header).to.be.instanceOf Kinetic.Text

    it 'adds to info layer', ->
      sinon.spy @board.info_layer, 'add'
      @board.add_header()
      expect(@board.info_layer.add).to.have.been.called

  describe 'add_footer', ->
    it 'sets footer', ->
      @board.add_footer()
      expect(@board.footer).to.be.instanceOf Kinetic.Text

    it 'adds to info layer', ->
      sinon.spy @board.info_layer, 'add'
      @board.add_footer()
      expect(@board.info_layer.add).to.have.been.called
