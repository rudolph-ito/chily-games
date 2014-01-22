Controller = require('controller')
Board = require('board')

class GameController extends Controller

  constructor: (@user_id, @game_id) ->
    super
    @container = $('.game')
    @board_container = $('.board')

  activate: ->
    super

    @socket.on 'abort', @server_game_abort
    @socket.on 'piece_move', @server_piece_move
    @socket.on 'resign', @server_game_resign

    @container.on 'click', '[data-action=abort]', @abort_game
    @container.on 'click', '[data-action=setup_complete]', @setup_complete
    @container.on 'click', '[data-action=resign]', @resign_game

    @join("g#{@game_id}")

    @load_game()

  deactivate: ->
    @socket.removeAllListeners 'abort'
    @socket.removeAllListeners 'play'
    @socket.removeAllListeners 'resign'
    @container.off()
    super

  url: (subroute) ->
    out = "/api/games/#{@game_id}"
    out += "/#{subroute}" if subroute
    out

  load_game: ->
    @board_container.html('')

    $.getJSON @url(), (data) =>
      @board = Board.create(@board_container[0], data, @)
      @board.draw()
      @update_actions()
      @add_to_chat("Server:\n" + data.message) if data.action == 'setup'

  load_challenges: ->
    @board_container.html('')
    @deactivate()
    ChallengesController = require('controllers/challenges_controller')
    new ChallengesController(@user_id).activate()

  ########################################
  # Update UI
  ########################################

  setup_actions: {abort: true, setup_complete: true, resign: false}
  play_actions: {abort: false, setup_complete: false, resign: true}

  update_actions: ->
    actions = if @board.data.action == 'setup' then @setup_actions else @play_actions

    for name, should_display of actions
      element = @container.find("[data-action=#{name}]")
      if should_display then element.show() else element.hide()

  add_to_chat: (message) ->
    $(".chat").append($('<div>').html(message.replace(/\n/g, "<br/>")))

  ########################################
  # User initiated actions
  ########################################

  setup_add_piece: (piece_type_id, coordinate) ->
    $.ajax
      url: @url('setup_add_piece')
      dataType: 'json'
      method: 'PUT'
      data:
        piece_type_id: piece_type_id
        coordinate: coordinate

  setup_move_piece: (from_coordinate, to_coordinate) ->
    $.ajax
      url: @url('setup_move_piece')
      dataType: 'json'
      method: 'PUT'
      data:
        from: from_coordinate
        to: to_coordinate

  setup_remove_piece: (coordinate) ->
    $.ajax
      url: @url('setup_remove_piece')
      dataType: 'json'
      method: 'PUT'
      data:
        coordinate: coordinate

  setup_complete: =>
    $.ajax
      url: @url('setup_complete')
      dataType: 'json'
      method: 'PUT'
      success: (data) =>
        if data.success
          @ready = true
          @emit 'ready'
        else
          @add_to_chat("Server:\n" + data.errors.join("\n"))

  valid_piece_moves: (coordinate) ->
    $.ajax
      url: @url('valid_piece_moves')
      dataType: 'json'
      method: 'GET'
      data:
        coordinate: coordinate
      success: (data) =>
        @board.dehighlight_spaces()
        @board.highlight_spaces(data, '#006633')
        @board.highlight_spaces([coordinate], '#00CC00')

  piece_move: (from_coordinate, to_coordinate) =>
    @emit 'piece_move',
      path: @url('piece_move')
      method: 'PUT'
      data:
        from: from_coordinate
        to: to_coordinate

  abort_game: =>
    @emit 'abort', { path: @url('abort'), method: 'PUT' }

  resign_game: =>
    @emit 'resign', { path: @url('resign'), method: 'PUT' }



  ########################################
  # Server initiated actions
  ########################################

  server_ready: (data) =>
    @load_challenges()

  server_piece_move: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON data.backendResponse.body
    @board.move_piece(data.from, data.to) if data.success

  server_game_abort: (data) =>
    @load_challenges()

  server_game_resign: (data) =>
    @load_challenges()


module.exports = GameController
