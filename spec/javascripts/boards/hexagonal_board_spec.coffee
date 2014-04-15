HexagonalBoard = require("boards/hexagonal_board")

describe 'HexagonalBoard', ->
  beforeEach ->
    @container = $("<div>")

  describe '#setup', ->
    beforeEach ->
      @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 6}, null)

    describe 'user not in setup', ->
      context 'bounded by height', ->
        beforeEach ->
          @hexagonal_board.max_board_height = -> 600
          @hexagonal_board.max_board_width = -> 800

        it 'sets the radius properly', ->
          @hexagonal_board.setup()
          expect(@hexagonal_board.space_radius).to.be.within(35, 36)
          expect(@hexagonal_board.board_height).to.eql(600)
          expect(@hexagonal_board.board_width).to.be.within(672, 673)
          expect(@hexagonal_board.setup_width).to.eql(0)

      context 'bounded by width', ->
        beforeEach ->
          @hexagonal_board.max_board_height = -> 600
          @hexagonal_board.max_board_width = -> 400

        it 'sets the radius properly', ->
          @hexagonal_board.setup()
          expect(@hexagonal_board.space_radius).to.be.within(20, 21)

    describe 'user in setup', ->
      beforeEach ->
        @hexagonal_board.max_board_height = -> 600
        @hexagonal_board.max_board_width = -> 800
        @hexagonal_board.game_controller = {user_in_setup: -> true}

      context 'one column for setup', ->
        beforeEach ->
          @hexagonal_board.setup_count = -> 7

        it 'sets the radius properly', ->
          @hexagonal_board.setup()
          expect(@hexagonal_board.space_radius).to.be.within(35, 36)
          expect(@hexagonal_board.board_height).to.eql(600)
          expect(@hexagonal_board.board_width).to.be.within(672, 673)
          expect(@hexagonal_board.setup_width).to.be.within(81, 82)

      context 'two columns for setup', ->
        beforeEach ->
          @hexagonal_board.setup_count = -> 8

        it 'sets the radius properly', ->
          @hexagonal_board.setup()
          expect(@hexagonal_board.space_radius).to.be.within(33, 34)
          expect(@hexagonal_board.board_height).to.be.within(577, 578)
          expect(@hexagonal_board.board_width).to.be.within(647, 648)
          expect(@hexagonal_board.setup_width).to.be.within(152, 153)

  describe '#add_spaces', ->
    context "board_size 3", ->
      it 'draws all the spaces', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 3}, null)
        @hexagonal_board.setup()
        @hexagonal_board.add_spaces()
        expect(@hexagonal_board.space_layer.element.children.length).to.eql(19)

    context "board_size 6", ->
      it 'draws all the spaces', ->
        @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 6}, null)
        @hexagonal_board.setup()
        @hexagonal_board.add_spaces()
        expect(@hexagonal_board.space_layer.element.children.length).to.eql(91)

  describe '#position', ->
    beforeEach ->
      @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 6}, null)
      @hexagonal_board.center = x: 300, y: 300
      @hexagonal_board.space_size = 35
      @hexagonal_board.delta_x = 35 * Math.cos(Math.PI/6)
      @hexagonal_board.delta_y = 35 * 3/2
      @hexagonal_board.board_offset_x = -> 0
      @hexagonal_board.board_offset_y = -> 0

    context "for alabaster", ->
      it 'returns the proper coordinates', ->
        expect(@hexagonal_board.position(x:0, y:0, z:0)).to.eql({x:300, y:300})
        expect(@hexagonal_board.position(x:0, y:2, z:2)).to.eql({x:300, y:510})
        expect(@hexagonal_board.position(x:0, y:-2, z:-2)).to.eql({x:300, y:90})

    context "for onyx", ->
      beforeEach ->
        @hexagonal_board.color = 'onyx'

      it 'returns the proper coordinates', ->
        expect(@hexagonal_board.position(x:0, y:0, z:0)).to.eql({x:300, y:300})
        expect(@hexagonal_board.position(x:0, y:2, z:2)).to.eql({x:300, y:90})
        expect(@hexagonal_board.position(x:0, y:-2, z:-2)).to.eql({x:300, y:510})

  describe '#territory', ->
    beforeEach ->
      @hexagonal_board = new HexagonalBoard(@container, 'alabaster', {board_size: 6}, null)

    it 'alabaster', ->
      expect(@hexagonal_board.territory({x: 0, y: 1, z: 0})).to.eql 'alabaster'
    it 'neutral', ->
      expect(@hexagonal_board.territory({x: 0, y: 0, z: 0})).to.eql 'neutral'
    it 'onyx', ->
      expect(@hexagonal_board.territory({x: 0, y: -1, z: 0})).to.eql 'onyx'
