PieceType = require("piece_type")

describe 'PieceType', ->

  context '.set_data', ->
    it 'sets the url_map', ->
      PieceType.set_data({1: {alabaster: '/piece_types/1/alabaster_image.png', onyx: '/piece_types/1/onyx_image.png'}})
      expect(PieceType.url_map).to.not.be.undefined

  context '.url_for', ->
    beforeEach ->
      PieceType.set_data({1: {alabaster: '/piece_types/1/alabaster_image.png', onyx: '/piece_types/1/onyx_image.png'}})

    it 'returns the url', ->
      expect(PieceType.url_for(1, 'alabaster')).to.eql '/piece_types/1/alabaster_image.png'
      expect(PieceType.url_for(1, 'onyx')).to.eql '/piece_types/1/onyx_image.png'

