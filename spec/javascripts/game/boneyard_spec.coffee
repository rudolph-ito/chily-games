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


  context 'on Boneyard.add', ->
    beforeEach ->
      $('body').trigger 'Boneyard.add', {type_id: 1, color: 'alabaster'}

    it 'adds the piece', ->
      expect(@$('.boneyard .alabaster img[data-piece-type-id=1]')).to.exist


  context 'with one existing piece', ->
    beforeEach ->
      $('body').trigger 'Boneyard.add', {type_id: 1, color: 'alabaster'}

    context 'on remove.Boneyard', ->
      beforeEach ->
        $('body').trigger 'Boneyard.remove', {type_id: 1, color: 'alabaster'}

      it 'removes the piece', ->
        expect(@$('.boneyard .alabaster [data-piece-type-id=1]')).not.to.exist


  context 'with two existing pieces', ->
    beforeEach ->
      $('body').trigger 'Boneyard.add', {type_id: 1, color: 'alabaster'}
      $('body').trigger 'Boneyard.add', {type_id: 1, color: 'alabaster'}


    context 'on Boneyard.remove', ->
      beforeEach ->
        $('body').trigger 'Boneyard.remove', {type_id: 1, color: 'alabaster'}

      it 'removes the last piece', ->
        expect(@$('.boneyard .alabaster img[data-piece-type-id=1]')).to.have.lengthOf 1

      context 'on Boneyard.remove', ->
        beforeEach ->
          $('body').trigger 'Boneyard.remove', {type_id: 1, color: 'alabaster'}

        it 'removes the first piece', ->
          expect(@$('.boneyard .alabaster img[data-piece-type-id=1]')).to.have.lengthOf 0


    context 'on Boneyard.clear', ->
      beforeEach ->
        $('body').trigger 'Boneyard.clear'

      it 'clears the pieces', ->
        expect(@$('.boneyard img')).not.to.exist


    context 'on Boneyard.update', ->
      beforeEach ->
        data = [
          {type_id: 3, color: 'alabaster'},
          {type_id: 3, color: 'alabaster'},
          {type_id: 1, color: 'onyx'}
        ]

        $('body').trigger 'Boneyard.update', data


      it 'clears the pieces', ->
        expect(@$('.boneyard .alabaster [data-piece-type-id=1]')).not.to.exist

      it 'adds the pieces passed in', ->
        expect(@$('.boneyard img')).to.have.lengthOf 3
        expect(@$('.boneyard .alabaster img[data-piece-type-id=3]')).to.have.lengthOf 2
        expect(@$('.boneyard .onyx img[data-piece-type-id=1]')).to.have.lengthOf 1


  context 'on Ply.created', ->
    context 'with a capture', ->
      beforeEach ->
        $('body').trigger 'Ply.created', captured_piece: {type_id: 1, color: 'alabaster'}

      it 'adds the piece', ->
        expect(@$('.boneyard .alabaster img[data-piece-type-id=1]')).to.exist

    context 'without a capture', ->
      beforeEach ->
        $('body').trigger 'Ply.created', captured_piece: null

      it 'does nothing', ->
        expect(@$('.boneyard img')).not.to.exist
