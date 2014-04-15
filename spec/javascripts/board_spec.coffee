Board = require("board")
HexagonalBoard = require("boards/hexagonal_board")
HighlightLayer = require('layers/highlight_layer')
Piece = require('piece')
PieceLayer = require('layers/piece_layer')
SpaceLayer = require('layers/space_layer')
SquareBoard = require("boards/square_board")
TerrainLayer = require('layers/terrain_layer')
TerritoryLayer = require('layers/territory_layer')

describe 'Board', ->
  beforeEach ->
    @container = $("<div style='height:100px;width:100px;'>")
    @color = 'alabaster'
    @setup_data = { piece_types: [{id: 1, count: 1}, {id: 2, count: 1}, {id: 3, count: 1}], terrain_types: [{id: 4, count: 3}] }
    @options = { setup_data: @setup_data }
    @game_controller =
      range_capture_piece_type_ids: []
      move_and_range_capture_piece_type_ids: []

      bottom_player_name: -> 'Player2'
      top_player_name: -> 'Player1'
      in_setup: -> false
      user_in_setup: -> false

      ply: sinon.spy()
      ply_valid: sinon.stub()
      setup_add: sinon.spy()
      setup_move: sinon.spy()
      setup_remove: sinon.spy()
      valid_plies: sinon.spy()

    @board = new Board(@container, @color, @options, @game_controller)
    sinon.stub @board, 'add_space'
    sinon.stub @board, 'add_piece'
    sinon.stub @board, 'add_terrain'
    sinon.stub Piece::, 'load_image'
    sinon.stub Piece::, 'update'

  afterEach ->
    Piece::load_image.restore()
    Piece::update.restore()

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

    it 'sets the setup_data', ->
      expect(@board.setup_data).to.eql(@setup_data)

    it 'sets the game_controller', ->
      expect(@board.game_controller).to.eql(@game_controller)

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

  describe '#max_board_height', ->
    beforeEach ->
      @board.container = { height: -> 200 }
      @board.padding = 5

    it 'returns container height minus padding', ->
      expect(@board.max_board_height()).to.eql(190)

  describe '#max_board_width', ->
    beforeEach ->
      @board.container = { width: -> 200 }
      @board.padding = 5

    it 'returns container width minus padding', ->
      expect(@board.max_board_width()).to.eql(190)

  describe '#setup', ->
    beforeEach ->
      @board.board_height = 200
      @board.board_width = 200
      @board.setup_width = 20
      @board.padding = 5

    it 'sets the stages height and width', ->
      @board.setup()
      expect(@board.stage.getHeight()).to.eql(210)
      expect(@board.stage.getWidth()).to.eql(230)

  describe '#draw', ->
    it 'calls setup', ->
      sinon.spy @board, 'setup'
      @board.draw()
      expect(@board.setup).to.have.been.called

    it 'calls draw_space_layer', ->
      sinon.spy @board, 'draw_space_layer'
      @board.draw()
      expect(@board.draw_space_layer).to.have.been.called

    context 'game_controller exists', ->
      context 'action is setup', ->
        beforeEach -> sinon.stub @game_controller, 'in_setup', -> true
        it 'calls draw territories', ->
          sinon.spy @board, 'draw_territories'
          @board.draw()
          expect(@board.draw_territories).to.have.been.called

      context 'user is in setup', ->
        beforeEach -> sinon.stub @game_controller, 'user_in_setup', -> true
        it 'calls draw setup', ->
          sinon.spy @board, 'add_setup'
          @board.draw()
          expect(@board.add_setup).to.have.been.called

  describe 'add_territories', ->
    beforeEach ->
      sinon.stub @board.space_layer.coordinate_map, 'keys', -> [{x:0,y:0}, {x:0,y:1}, {x:0,y:2}]
      territory_stub = sinon.stub @board, 'territory'
      territory_stub.withArgs({x:0,y:0}).returns('alabaster')
      territory_stub.withArgs({x:0,y:1}).returns('neutral')
      territory_stub.withArgs({x:0,y:2}).returns('onyx')
      sinon.stub @board.territory_layer, 'add'
      @board.add_territories()

    it 'does not a territory for a home space', ->
      expect(@board.territory_layer.add).not.to.have.been.calledWith {x:0,y:0}, sinon.match.any

    it 'adds a light grey territory for a netural space', ->
      expect(@board.territory_layer.add).to.have.been.calledWith {x:0,y:1}, '#A8A8A8'

    it 'adds a dark grey territory for an enemy space', ->
      expect(@board.territory_layer.add).to.have.been.calledWith {x:0,y:2}, '#505050'

  describe 'remove_territories', ->
    it 'calls clear on territory_layer', ->
      sinon.stub @board.territory_layer, 'clear'
      @board.remove_territories()
      expect(@board.territory_layer.clear).to.have.been.called

  describe '#highlight_valid_plies', ->
    beforeEach ->
      sinon.stub @board.highlight_layer, 'add'
      sinon.stub @board.highlight_layer, 'draw'

    context 'type is movement', ->
      beforeEach -> @board.highlight_valid_plies('movement', {x:0,y:0}, [{x:0,y:1}, {x:0,y:2}])
      it 'add the proper number of highlights', ->
        expect(@board.highlight_layer.add).to.have.been.calledThrice
      it 'adds the piece highlight', ->
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:0}, '#00CC00'
      it 'adds the space highlights', ->
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:1}, '#006633'
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:2}, '#006633'
      it 'calls draw on highlight_layer', ->
        expect(@board.highlight_layer.draw).to.have.been.called

    context 'type is range', ->
      beforeEach -> @board.highlight_valid_plies('range', {x:0,y:0}, [{x:0,y:1}, {x:0,y:2}])
      it 'add the proper number of highlights', ->
        expect(@board.highlight_layer.add).to.have.been.calledThrice
      it 'adds the piece highlight', ->
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:0}, '#CC0000'
      it 'adds the space highlights', ->
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:1}, '#660033'
        expect(@board.highlight_layer.add).to.have.been.calledWith {x:0,y:2}, '#660033'
      it 'calls draw on highlight_layer', ->
        expect(@board.highlight_layer.draw).to.have.been.called

  describe '#dehighlight', ->
    it 'calls clear on highlight_layer', ->
      sinon.stub @board.highlight_layer, 'clear'
      @board.dehighlight()
      expect(@board.highlight_layer.clear).to.have.been.called

  describe '#click', ->
    context 'a piece is selected', ->
      beforeEach ->
        @piece = new Piece { board: @board, layer: @board.piece_layer }
        @board.selected_piece = @piece

      context 'the coordinate clicked is the same as the pieces coordinate', ->
        beforeEach -> @piece.coordinate = {x:0,y:0}

        context 'piece can range capture and currently highlighting movement', ->
          beforeEach ->
            @board.highlighting = 'movement'
            @piece.type_id = -> 1
            @game_controller.range_capture_piece_type_ids = [1]

          it 'highlights range', ->
            @board.click({x:0,y:0})
            expect(@game_controller.valid_plies).to.have.been.calledWith {x:0,y:0}, 'range'

        context 'otherwise', ->
          it 'clears selected_piece', ->
            @board.click({x:0,y:0})
            expect(@board.selected_piece).to.eql null

          it 'clears highlighting', ->
            @board.click({x:0,y:0})
            expect(@board.highlighting).to.eql null

          it 'dehighlight the board', ->
            sinon.stub @board, 'dehighlight'
            @board.click({x:0,y:0})
            expect(@board.dehighlight).to.have.been.called

      context 'coordinate clicked is not the same as the piece coordinate', ->

        it 'calls try move', ->
          sinon.stub @board, 'try_move'
          @board.click({x:0,y:0})
          expect(@board.try_move).to.have.been.calledWith @board.piece_layer, @piece, {x:0,y:0}

        it 'clears selected_piece', ->
          @board.click({x:0,y:0})
          expect(@board.selected_piece).to.eql null

        it 'clears highlighting', ->
          @board.click({x:0,y:0})
          expect(@board.highlighting).to.eql null

        it 'dehighlight the board', ->
          sinon.stub @board, 'dehighlight'
          @board.click({x:0,y:0})
          expect(@board.dehighlight).to.have.been.called

    context 'there is temporary move', ->
      beforeEach -> @board.temporary_move = { from: {x:1,y:1}, to: {x:0,y:1} }

      context 'coordinate is equal to the temporary move location', ->
        beforeEach -> @board.click({x:0,y:1})
        it 'calls game_controller.ply properly', ->
          expect(@game_controller.ply).to.have.been.calledWith {x:1,y:1}, {x:0,y:1}, null

      context 'coordinate is not equal to the temporary move location', ->
        beforeEach -> @board.click({x:0,y:0})
        it 'calls game_controller.ply properly', ->
          expect(@game_controller.ply).to.have.been.calledWith {x:1,y:1}, {x:0,y:1}, {x:0,y:0}

      it 'undoes the temporary move', ->
        sinon.stub @board.piece_layer, 'move_by_coordinate'
        @board.click({x:0,y:0})
        expect(@board.piece_layer.move_by_coordinate).to.have.been.calledWith {x:0,y:1}, {x:1,y:1}

      it 'clears the temporary move', ->
        @board.click({x:0,y:0})
        expect(@board.temporary_move).to.eql null

      it 'dehighlights the board', ->
        sinon.stub @board, 'dehighlight'
        @board.click({x:0,y:0})
        expect(@board.dehighlight).to.have.been.called

    context 'no piece selected, no temporary move', ->
      context 'there is a piece at that coordinate', ->
        beforeEach ->
          @piece = new Piece { board: @board, coordinate: {x:0,y:0}, layer: @board.piece_layer }
          get_piece_stub = sinon.stub @board.piece_layer.coordinate_map, 'get'
          get_piece_stub.withArgs({x:0,y:0}).returns(@piece)

        it 'selects the piece', ->
          @board.click({x:0,y:0})
          expect(@board.selected_piece).to.eql @piece

        it 'calls game_controller.valid_plies', ->
          @board.click({x:0,y:0})
          expect(@game_controller.valid_plies).to.have.been.calledWith {x:0,y:0}, 'movement'

      context 'there is no piece at that coordinate', ->
        beforeEach ->
          get_piece_stub = sinon.stub @board.piece_layer.coordinate_map, 'get'
          get_piece_stub.withArgs({x:0,y:0}).returns(null)

        it 'does nothing', ->
          @board.click({x:0,y:0})
          expect(@board.selected_piece).to.eql undefined
          expect(@game_controller.valid_plies).not.to.have.been.called

  describe '#try_move', ->

    itShouldBeReset = ->
      it 'calls layer.reset', ->
        @board.try_move(@layer, @object, @to)
        expect(@layer.reset).to.have.been.calledWith @object

    itShouldBeMoved = ->
      it 'calls layer.move with the object', ->
        @board.try_move(@layer, @object, @to)
        expect(@layer.move).to.have.been.calledWith @object, @to

    beforeEach ->
      @layer = { move: sinon.spy(), remove: sinon.spy(), reset: sinon.spy() }
      @object = { constructor: { name: 'Piece' }, coordinate: {x:0,y:0}, type: (-> 'Piece'), type_id: (-> 1) }
      @to = {x:1,y:1}

    context 'during setup', ->
      beforeEach -> sinon.stub @game_controller, 'user_in_setup', -> true

      context 'to is null', ->
        beforeEach -> @to = null
        itShouldBeReset()

      context 'to is not null', ->
        beforeEach -> @to = {x:1,y:1}

        context 'to is not a home square', ->
          beforeEach -> sinon.stub @board, 'home_space', -> false
          itShouldBeReset()

        context 'to is a home square', ->
          beforeEach -> sinon.stub @board, 'home_space', -> true

          context 'from == to', ->
            beforeEach -> @object.coordinate = {x:1,y:1}
            itShouldBeReset()

          context 'from != to', ->
            context 'from is null', ->
              beforeEach -> @object.coordinate = null
              itShouldBeMoved()
              it 'calls game_controller.setup_add', ->
                @board.try_move(@layer, @object, @to)
                expect(@game_controller.setup_add).to.have.been.calledWith 'Piece', 1, @to

            context 'from is not null', ->
              beforeEach -> @object.coordinate = {x:0,y:0}
              itShouldBeMoved()
              it 'calls game_controller.setup_move', ->
                @board.try_move(@layer, @object, @to)
                expect(@game_controller.setup_move).to.have.been.calledWith 'Piece', {x:0,y:0}, {x:1,y:1}

    context 'during play', ->
      beforeEach ->
        sinon.stub @game_controller, 'user_in_setup', -> false
        @object.coordinate = {x:0,y:0}

      context 'to is null', ->
        beforeEach -> @to = null

        it 'calls layer.reset', ->
          @board.try_move(@layer, @object, @to)
          expect(@layer.reset).to.have.been.calledWith @object

        it 'does nothing', ->
          @board.try_move(@layer, @object, @to)
          expect(@game_controller.ply).not.to.have.been.called
          expect(@game_controller.ply_valid).not.to.have.been.called

      context 'to is the same as object.coordinate', ->
        beforeEach -> @to = {x:0,y:0}

        it 'calls layer.reset', ->
          @board.try_move(@layer, @object, @to)
          expect(@layer.reset).to.have.been.calledWith @object

        it 'does nothing', ->
          @board.try_move(@layer, @object, @to)
          expect(@game_controller.ply).not.to.have.been.called
          expect(@game_controller.ply_valid).not.to.have.been.called

      context 'to is not null and is not the same as object.coordinate', ->
        beforeEach -> @to = {x:1,y:1}

        it 'calls layer.reset', ->
          @board.try_move(@layer, @object, @to)
          expect(@layer.reset).to.have.been.calledWith @object

        context 'object.type_id() is in move_and_range_capture_piece_type_ids', ->
          beforeEach ->
            @object.type_id = -> 1
            @game_controller.move_and_range_capture_piece_type_ids = [1]

          it 'calls game_controller.ply_valid', ->
            @board.try_move(@layer, @object, @to)
            expect(@game_controller.ply_valid).to.have.been.calledWith {x:0,y:0}, {x:1,y:1}, sinon.match.func

          context 'on success', ->
            beforeEach -> @game_controller.ply_valid.callsArg(2)

            it 'calls get_range_capture_input', ->
              sinon.stub @board, 'get_range_capture_input'
              @board.try_move(@layer, @object, @to)
              expect(@board.get_range_capture_input).to.have.been.calledWith {x:0,y:0}, {x:1,y:1}

        context 'highlighting range', ->
          beforeEach -> @board.highlighting = 'range'

          it 'calls game_controller.ply', ->
            @board.try_move(@layer, @object, @to)
            expect(@game_controller.ply).to.have.been.calledWith {x:0,y:0}, null, {x:1,y:1}

        context 'otherwise', ->
          it 'calls game_controller.ply', ->
            @board.try_move(@layer, @object, @to)
            expect(@game_controller.ply).to.have.been.calledWith {x:0,y:0}, {x:1,y:1}, null

