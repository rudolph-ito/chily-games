GameController = require("controllers/game_controller")

describe 'GameController', ->
  beforeEach ->
    @game_controller = new GameController

  describe '#top_player_name, #bottom_player_name', ->
    beforeEach ->
      @game_controller.alabaster_name = 'Alabaster'
      @game_controller.onyx_name = 'Onyx'

    context 'for onyx player', ->
      beforeEach -> @game_controller.color = 'onyx'
      it 'has alabster on top and onyx on the bottom', ->
        expect(@game_controller.top_player_name()).to.eql 'Alabaster'
        expect(@game_controller.bottom_player_name()).to.eql 'Onyx'

    context 'for alabaster player', ->
      beforeEach -> @game_controller.color = 'alabaster'
      it 'has onyx on top and alabaster on the bottom', ->
        expect(@game_controller.top_player_name()).to.eql 'Onyx'
        expect(@game_controller.bottom_player_name()).to.eql 'Alabaster'

    context 'for viewer', ->
      beforeEach -> @game_controller.color = null
      it 'has onyx on top and alabaster on the bottom', ->
        expect(@game_controller.top_player_name()).to.eql 'Onyx'
        expect(@game_controller.bottom_player_name()).to.eql 'Alabaster'
