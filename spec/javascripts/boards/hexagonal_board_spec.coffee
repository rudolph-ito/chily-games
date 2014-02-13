HexagonalBoard = require("boards/hexagonal_board")

describe 'HexagonalBoard', ->
  beforeEach ->
    @container = $("<div>")

  describe '#setup', ->
    describe 'no game_controller', ->
      it 'does not error', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {}, null)
        @hexagonal_board.setup(800,600)

    describe 'game_controller', ->
      it 'does not error', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {piece_types: [], terrain_types: []}, {user_in_setup: -> true})
        @hexagonal_board.setup(800,600)

  describe '#draw_spaces', ->
    context "board_size 1", ->
      it 'does not error', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 1}, null)
        @hexagonal_board.setup(800,600)
        @hexagonal_board.draw_spaces()

    context "board_size 3", ->
      it 'does not error', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 3}, null)
        @hexagonal_board.setup(800,600)
        @hexagonal_board.draw_spaces()

