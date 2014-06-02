Boneyard = require('game/boneyard')
PieceType = require('piece_type')

boneyardHtml = '''
<style>
  img { width: 20px; height: 20px; }
</style>

<div class="boneyard">
  <div class="alabaster"></div>
  <div class="onyx"></div>
</div>
'''

describe 'Boneyard', ->
  withHtml boneyardHtml

  before ->
    sinon.stub PieceType, 'url_for', -> ''

  after ->
    PieceType.url_for.restore()

  beforeEach ->
    new Boneyard(el: '.boneyard')

  context 'on init.Boneyard', ->
    beforeEach ->
      $('body').trigger 'init.Boneyard', [{id: 1, count: 1}, {id: 2, count: 1}, {id: 3, count: 2}]

    it 'adds alabaster pieces', ->
      expect(@$('.boneyard .alabaster img').length).to.eql 4
      expect(@$('.boneyard .alabaster img[data-piece-type-id=1]').length).to.eql 1
      expect(@$('.boneyard .alabaster img[data-piece-type-id=2]').length).to.eql 1
      expect(@$('.boneyard .alabaster img[data-piece-type-id=3]').length).to.eql 2

    it 'adds onyx pieces', ->
      expect(@$('.boneyard .onyx img').length).to.eql 4
      expect(@$('.boneyard .onyx img[data-piece-type-id=1]').length).to.eql 1
      expect(@$('.boneyard .onyx img[data-piece-type-id=2]').length).to.eql 1
      expect(@$('.boneyard .onyx img[data-piece-type-id=3]').length).to.eql 2

    it 'hides all images', ->
      expect(@$('.boneyard img:hidden').length).to.eql 8



    context 'on show.Boneyard', ->
      context 'with count == 1', ->
        beforeEach ->
          $('body').trigger 'show.Boneyard', {type_id: 1, color: 'alabaster'}

        it 'shows the piece', ->
          expect(@$('.boneyard .alabaster img[data-piece-type-id=1]')).to.be.visible

      context 'with count > 1', ->
        context 'on first show', ->
          beforeEach ->
            $('body').trigger 'show.Boneyard', {type_id: 3, color: 'alabaster'}

          it 'shows only one piece', ->
            expect(@$('.boneyard .alabaster img[data-piece-type-id=3]:visible').length).to.eql 1

          context 'on second show', ->
            beforeEach ->
              $('body').trigger 'show.Boneyard', {type_id: 3, color: 'alabaster'}

            it 'shows two pieces', ->
              expect(@$('.boneyard .alabaster img[data-piece-type-id=3]:visible').length).to.eql 2



    context 'on hide.Boneyard', ->
      context 'with count == 1', ->
        beforeEach ->
          $('body').trigger 'show.Boneyard', {type_id: 1, color: 'alabaster'}
          $('body').trigger 'hide.Boneyard', {type_id: 1, color: 'alabaster'}

        it 'hides the piece', ->
          expect(@$('.boneyard .alabaster [data-piece-type-id=1]')).to.be.hidden

      context 'with count > 1', ->
        beforeEach ->
          $('body').trigger 'show.Boneyard', {type_id: 3, color: 'alabaster'}
          $('body').trigger 'show.Boneyard', {type_id: 3, color: 'alabaster'}

        context 'on first hide', ->
          beforeEach ->
            $('body').trigger 'hide.Boneyard', {type_id: 3, color: 'alabaster'}

          it 'shows only one piece', ->
            expect(@$('.boneyard .alabaster img[data-piece-type-id=3]:visible').length).to.eql 1

          context 'on second hide', ->
            beforeEach ->
              $('body').trigger 'hide.Boneyard', {type_id: 3, color: 'alabaster'}

            it 'shows two pieces', ->
              expect(@$('.boneyard .alabaster img[data-piece-type-id=3]:visible').length).to.eql 0



    context 'on update.Boneyard', ->
      beforeEach ->
        $('body').trigger 'show.Boneyard', {type_id: 1, color: 'alabaster'}
        $('body').trigger 'show.Boneyard', {type_id: 2, color: 'onyx'}
        $('body').trigger 'update.Boneyard', [{type_id: 3, color: 'alabaster'}, {type_id: 3, color: 'alabaster'}, {type_id: 1, color: 'onyx'}]

      it 'hides images that were showing', ->
        expect(@$('.boneyard .alabaster [data-piece-type-id=1]')).to.be.hidden
        expect(@$('.boneyard .onyx [data-piece-type-id=2]')).to.be.hidden


      it 'shows the pieces passed in', ->
        expect(@$('.boneyard img:visible').length).to.eql 3
        expect(@$('.boneyard .alabaster img[data-piece-type-id=3]:visible').length).to.eql 2
        expect(@$('.boneyard .onyx img[data-piece-type-id=1]')).to.be.visible
