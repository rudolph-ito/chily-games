SquareBoard = require("boards/square_board")

describe 'SquareBoard', ->
  beforeEach ->
    @container = $("<div>")

  describe '#setup', ->
    describe 'no game_controller', ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {}, null)
        @square_board.setup(800,600)

    describe 'game_controller', ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {piece_types: [], terrain_types: []}, {user_in_setup: -> true})
        @square_board.setup(800,600)

  describe '#draw_spaces', ->
    context "board_rows 7, board_columns 7", ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 7, board_columns: 7}, null)
        @square_board.setup(800,600)
        @square_board.draw_spaces()

   context "board_rows 8, board_columns 8", ->
      it 'does not error', ->
        @square_board = new SquareBoard(@container, 'alabaster', {board_rows: 8, board_columns: 8}, null)
        @square_board.setup(800,600)
        @square_board.draw_spaces()

