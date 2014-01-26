Controller = require('controller')
Board = require('board')

class GameController extends Controller

  constructor: (@user_id, @game_id) ->
    super
    @container = $('.game')
    @board_container = $('.board')
    @chat_container = @container.find(".chat")

  activate: ->
    super

    @socket.on 'abort', @server_game_abort
    @socket.on 'setup_complete', @server_setup_complete
    @socket.on 'piece_move', @server_piece_move
    @socket.on 'resign', @server_game_resign

    @container.on 'click', '[data-action=abort]', @abort_game
    @container.on 'click', '[data-action=setup_complete]', @setup_complete
    @container.on 'click', '[data-action=resign]', @resign_game

    @chat_container.html('')
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
    $.getJSON @url(), (data) =>
      @parse_data(data)
      @update_state()
      @update_actions()
      @add_to_chat("Server:\n" + data.message) if @user_in_setup()

      @board = Board.create(@board_container, data.color, data.options, @)
      @board.draw()
      @board.draw_pieces(data.pieces)

  user_in_setup: ->
    @action == 'setup' && (@action_to_id == null || @action_to_id == @user_id)

  parse_data: (data) ->
    @action = data.action
    @action_to_id = data.action_to_id
    @alabaster_id = data.alabaster_id
    @alabaster_name = data.alabaster_name
    @color = data.color
    @onyx_id = data.onyx_id
    @onyx_name = data.onyx_name

  load_challenges: ->
    @board_container.html('')
    @deactivate()
    ChallengesController = require('controllers/challenges_controller')
    new ChallengesController(@user_id).activate()

  name: ->
    @[@color + "_name"]

  opponent_name: ->
    opponent_color = if @color == 'alabaster' then 'onyx' else 'alabaster'
    @[opponent_color + "_name"]

  ########################################
  # Update UI
  ########################################

  update_controls: ->
    @update_state()
    @update_actions()

  update_state: ->
    @container.find('.state').text( @state() )

  state: ->
    name = switch @action_to_id
      when @alabaster_id then @alabaster_name
      when @onyx_id then @onyx_name
      else "Both players"

    if @action == 'setup'
      "#{name} to complete setup"
    else
      "#{name} to move"

  update_actions: ->
    actions = {
      setup_complete: @user_in_setup()
      abort: @action == 'setup'
      resign: @action == 'move'
    }

    for name, should_display of actions
      element = @container.find("[data-action=#{name}]")
      if should_display then element.show() else element.hide()

  add_to_chat: (message) ->
    @chat_container.append($('<div>').html(message.replace(/\n/g, "<br/>")))

  finish_setup: ->
    return unless @action == 'move'

    @board.hide_territory()

    $.ajax
      url: @url('opponent_setup')
      method: 'GET'
      success: (data) =>
        @board.draw_pieces(data.pieces)
        @add_to_chat("Server:\n" + 'Let the battle begin!')

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
          @action = data.action
          @action_to_id = data.action_to_id
          @update_controls()
          @add_to_chat("Server:\n" + 'Setup complete')

          @emit_broadcast 'setup_complete', {action: @action, action_to_id: @action_to_id}, false

          @board.redraw()
          @finish_setup()
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
        @board.highlight_spaces(data, '#4a8f50')
        @board.highlight_spaces([coordinate], '#7be383')

  piece_move: (from_coordinate, to_coordinate) =>
    @emit_request 'piece_move',
      path: @url('piece_move')
      method: 'PUT'
      data:
        from: from_coordinate
        to: to_coordinate

  abort_game: =>
    @emit_request 'abort', { path: @url('abort'), method: 'PUT' }

  resign_game: =>
    @emit_request 'resign', { path: @url('resign'), method: 'PUT' }

  ########################################
  # Server initiated actions
  ########################################

  server_setup_complete: (data) =>
    @action = data.broadcast.action
    @action_to_id = data.broadcast.action_to_id
    @update_controls()
    @add_to_chat("Server:\n" + 'Opponent is ready')
    @finish_setup()

  server_piece_move: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON data.backendResponse.body
    if data.success
      @action = data.action
      @action_to_id = data.action_to_id
      @update_state()

      @board.move_piece(data.from, data.to)

      if @action == 'complete'
        name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
        alert("Game over: #{name} wins by death")
        @load_challenges()

  server_game_abort: (data) =>
    alert("Game aborted")
    @load_challenges()

  server_game_resign: (data) =>
    @action = data.action
    @action_to_id = data.action_to_id

    name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
    alert("Game over: #{name} wins by resignation")
    @load_challenges()


module.exports = GameController
