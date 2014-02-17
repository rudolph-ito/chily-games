Board = require("board")
CoordinateMap = require("lib/coordinate_map")
HexagonalBoard = require("boards/hexagonal_board")
Piece = require("piece")
Set = require('lib/set')
Space = require("space")
SquareBoard = require("boards/square_board")

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
    sinon.stub Board::, '_add_space'
    sinon.stub Board::, 'add_piece'

  afterEach ->
    Board::_add_space.restore()
    Board::add_piece.restore()

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

    it 'initializes setup_pieces as a Set', ->
      expect(@board.setup_pieces).to.be.an.instanceOf Set

    it 'initializes setup_terrain as a Set', ->
      expect(@board.setup_terrain).to.be.an.instanceOf Set

    it 'creates the stage', ->
      expect(@board.stage).to.be.an.instanceOf Kinetic.Stage

    it 'creates the space layer to draw the spaces and a space coordinate_map', ->
      expect(@board.coordinate_maps.space).to.be.an.instanceOf CoordinateMap
      expect(@board.layers.space).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.space)

    it 'creates the terrain layer to draw the terrain and a terrain coordinate_map', ->
      expect(@board.coordinate_maps.terrain).to.be.an.instanceOf CoordinateMap
      expect(@board.layers.terrain).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.terrain)

    it 'creates the territory layer to mark spaces as specific territory and a territory coordinate_map', ->
      expect(@board.coordinate_maps.territory).to.be.an.instanceOf CoordinateMap
      expect(@board.layers.territory).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.territory)

    it 'creates the highlight layer to highlight spaces and a highlight coordinate_map', ->
      expect(@board.coordinate_maps.highlight).to.be.an.instanceOf CoordinateMap
      expect(@board.layers.highlight).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.highlight)

    it 'creates the piece layer to draw the pieces and a piece coordinate_map', ->
      expect(@board.coordinate_maps.piece).to.be.an.instanceOf CoordinateMap
      expect(@board.layers.piece).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.piece)

    it 'creates the info layer for any informative data', ->
      expect(@board.layers.info).to.be.an.instanceOf Kinetic.Layer
      expect(@board.stage.children).to.include(@board.layers.info)

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
          sinon.spy @board, 'draw_setup'
          @board.draw()
          expect(@board.draw_setup).to.have.been.called
          @board.draw_setup.restore()

  describe 'add_header', ->
    it 'sets header', ->
      @board.add_header()
      expect(@board.header).to.be.instanceOf Kinetic.Text

    it 'adds to info layer', ->
      sinon.spy @board.layers.info, 'add'
      @board.add_header()
      expect(@board.layers.info.add).to.have.been.called
      @board.layers.info.add.restore()

  describe 'add_footer', ->
    it 'sets footer', ->
      @board.add_footer()
      expect(@board.footer).to.be.instanceOf Kinetic.Text

    it 'adds to info layer', ->
      sinon.spy @board.layers.info, 'add'
      @board.add_footer()
      expect(@board.layers.info.add).to.have.been.called
      @board.layers.info.add.restore()


