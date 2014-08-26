Board = require('board')
Preview = require('variant/preview')

previewHtml = '''
<div id="preview">
  <div class="board"></div>
</div>

<a id="preview_board"
   data-action="preview"
   data-variant-id="123"></a>

<a id="preview_valid_moves"
   data-action="preview"
   data-variant-id="123"
   data-piece-type-id="456"
   data-type="movement"></a>
'''

describe 'Preview', ->
  withHtml previewHtml

  beforeEach ->
    @options = {color: 'onyx', board_type: 'square'}
    new Preview '#preview'

  context 'board', ->
    beforeEach ->
      @$('#preview_board').trigger('click')

    it 'makes an getJSON request', ->
      expect($.getJSON).to.have.been.calledOnce
      expect($.getJSON.lastCall.args[0]).to.eql '/api/variants/123/preview'

    context 'on success', ->
      beforeEach ->
        $('#preview .board').on 'Board.draw', @draw_spy = sinon.spy()
        sinon.stub Board, 'create'
        $.getJSON.lastCall.callArgWith(1, options: @options)

      afterEach ->
        Board.create.restore()

      it 'calls Board.create', ->
        expect(Board.create).to.have.been.calledOnce
        expect(Board.create.lastCall.args[0]).to.match @$('#preview .board')
        expect(Board.create.lastCall.args[1]).to.eql 'onyx'
        expect(Board.create.lastCall.args[2]).to.eql {color: 'onyx', board_type: 'square'}

      it 'triggers Board.draw', ->
        expect(@draw_spy).to.have.been.calledOnce

  context 'on valid_moves', ->
    beforeEach ->
      @$('#preview_valid_moves').trigger('click')

    it 'makes an getJSON request', ->
      expect($.getJSON).to.have.been.calledOnce
      expect($.getJSON.lastCall.args[0]).to.eql '/api/variants/123/preview?piece_type_id=456&type=movement'

    context 'on success', ->
      before ->
        @pieces = [{piece_type_id: 1, coordinate: {x:0, y:0}, color: 'onyx'}]
        @valid_plies = {type: 'movememt', origin: {x:0, y:0}, coordinates: [{x:1, y:1}]}

      beforeEach ->
        $('#preview .board')
          .on('Board.draw', @draw_spy = sinon.spy())
          .on('Pieces.add', @add_pieces_spy = sinon.spy())
          .on('ValidPlies.show', @highlight_valid_plies_spy = sinon.spy())

        sinon.stub Board, 'create'

        $.getJSON.lastCall.callArgWith 1,
          options: @options
          pieces: @pieces
          valid_plies: @valid_plies

      afterEach ->
        Board.create.restore()

      it 'calls Board.create', ->
        expect(Board.create).to.have.been.calledOnce
        expect(Board.create.lastCall.args[0]).to.match @$('#preview .board')
        expect(Board.create.lastCall.args[1]).to.eql 'onyx'
        expect(Board.create.lastCall.args[2]).to.eql {color: 'onyx', board_type: 'square'}

      it 'triggers Board.draw', ->
        expect(@draw_spy).to.have.been.calledOnce

      it 'triggers Pieces.add', ->
        expect(@add_pieces_spy).to.have.been.calledOnce
        expect(@add_pieces_spy.lastCall.args[1..]).to.eql @pieces

      it 'triggers ValidPlies.show', ->
        expect(@highlight_valid_plies_spy).to.have.been.calledOnce
        expect(@highlight_valid_plies_spy.lastCall.args[1]).to.eql @valid_plies
