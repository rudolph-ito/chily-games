SquareBoard = require("boards/square_board")

describe 'SquareBoard', ->
  beforeEach ->
    @container = $("<div>")

  describe '#setup', ->
    beforeEach ->
      @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 8, board_columns: 8}, null)

    describe 'user not in setup', ->
      context 'bounded by height', ->
        beforeEach ->
          @square_board.max_board_height = -> 600
          @square_board.max_board_width = -> 800

        it 'sets the dimensions properly', ->
          @square_board.setup()
          expect(@square_board.space_size).to.eql(75)
          expect(@square_board.board_height).to.eql(600)
          expect(@square_board.board_width).to.eql(600)
          expect(@square_board.setup_width).to.eql(0)

      context 'bounded by width', ->
        beforeEach ->
          @square_board.max_board_height = -> 600
          @square_board.max_board_width = -> 400

        it 'sets the dimensions properly', ->
          @square_board.setup()
          expect(@square_board.space_size).to.eql(50)
          expect(@square_board.board_height).to.eql(400)
          expect(@square_board.board_width).to.eql(400)
          expect(@square_board.setup_width).to.eql(0)

    describe 'user in setup', ->
      beforeEach ->
        @square_board.max_board_height = -> 600
        @square_board.max_board_width = -> 800
        @square_board.game_controller = {user_in_setup: -> true}

      context 'one column for setup', ->
        beforeEach ->
          @square_board.setup_count = -> 7

        it 'sets the dimensions properly', ->
          @square_board.setup()
          expect(@square_board.space_size).to.eql(75)
          expect(@square_board.board_height).to.eql(600)
          expect(@square_board.board_width).to.eql(600)
          expect(@square_board.setup_width).to.be.within(86, 87)

      context 'two columns for setup', ->
        beforeEach ->
          @square_board.setup_count = -> 8

        it 'sets the dimensions properly', ->
          @square_board.setup()
          expect(@square_board.space_size).to.eql(75)
          expect(@square_board.board_height).to.eql(600)
          expect(@square_board.board_width).to.eql(600)
          expect(@square_board.setup_width).to.be.within(168, 169)

  describe '#add_spaces', ->
    context "board_rows 3, board_columns 4", ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 3, board_columns: 4}, null)
        @square_board.setup()
        @square_board.add_spaces()
        expect(@square_board.space_layer.element.children.length).to.eql(12)

   context "board_rows 8, board_columns 8", ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 8, board_columns: 8}, null)
        @square_board.setup()
        @square_board.add_spaces()
        expect(@square_board.space_layer.element.children.length).to.eql(64)

  describe '#position', ->
    beforeEach ->
      @square_board = new SquareBoard(@container, 'alabaster', {}, null)
      @square_board.board_height = 400
      @square_board.board_width = 400
      @square_board.space_size = 50
      @square_board.board_offset_x = -> 0
      @square_board.board_offset_y = -> 0

    context "for alabaster", ->
      it 'returns the proper coordinates', ->
        expect(@square_board.position(x:0, y:0)).to.eql({x:375, y:375})
        expect(@square_board.position(x:0, y:7)).to.eql({x:375, y:25})
        expect(@square_board.position(x:7, y:7)).to.eql({x:25, y:25})
        expect(@square_board.position(x:7, y:0)).to.eql({x:25, y:375})

    context "for onyx", ->
      beforeEach ->
        @square_board.color = 'onyx'

      it 'returns the proper coordinates', ->
        expect(@square_board.position(x:0, y:0)).to.eql({x:25, y:25})
        expect(@square_board.position(x:0, y:7)).to.eql({x:25, y:375})
        expect(@square_board.position(x:7, y:7)).to.eql({x:375, y:375})
        expect(@square_board.position(x:7, y:0)).to.eql({x:375, y:25})

  describe '#territory', ->
    context "board_rows 3, board_columns 4", ->
      beforeEach ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 3, board_columns: 4}, null)

      it 'alabaster', ->
        expect(@square_board.territory(x: 0, y: 0)).to.eql 'alabaster'
      it 'neutral', ->
        expect(@square_board.territory(x: 0, y: 1)).to.eql 'neutral'
      it 'onyx', ->
        expect(@square_board.territory(x: 0, y: 2)).to.eql 'onyx'

   context "board_rows 2, board_columns 4", ->
      beforeEach ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 2, board_columns: 4}, null)

      it 'alabaster', ->
        expect(@square_board.territory(x: 0, y: 0)).to.eql 'alabaster'
      it 'onyx', ->
        expect(@square_board.territory(x: 0, y: 1)).to.eql 'onyx'

