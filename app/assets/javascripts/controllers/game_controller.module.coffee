Controller = require('controller')
Board = require('board')

class GameController extends Controller

  constructor: (@game_id, @user_id, @user_name) ->
    super
    @container = $('.game')
    @board_container = $('.board')
    @chat_container = @container.find(".chat")
    @chat_input = @container.find("input[name=message]")

  activate: ->
    super

    @socket.on 'chat', @server_chat
    @socket.on 'abort', @server_game_abort
    @socket.on 'setup_complete', @server_setup_complete
    @socket.on 'piece_move', @server_piece_move
    @socket.on 'piece_move_with_range_capture', @server_piece_move_with_range_capture
    @socket.on 'resign', @server_game_resign

    @container.on 'keyup', 'input[name=message]', @chat
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
      @add_to_chat(data.message) if @user_in_setup()

      @board = Board.create(@board_container, data.color, data.options, @)
      @board.draw()
      @board.add_terrains(data.terrains)
      @board.add_pieces(data.pieces)

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
    new ChallengesController(@user_id, @user_name).activate()

  top_player_name: ->
    if @color == 'onyx' then @alabaster_name else @onyx_name

  bottom_player_name: ->
    if @color == 'onyx' then @onyx_name else @alabaster_name

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

  add_to_chat: (message, username = 'server') ->
    last_div = @chat_container.find("> div:last-child")
    if last_div.data("username") is username
      div = last_div
    else
      div = $('<div data-username="' + username + '">')
      div.append $('<div class="username">').text(username)
      @chat_container.append(div)

    div.append($('<div class="message">').html(message.replace(/\n/g, "<br/>")))

  finish_setup: ->
    return unless @action == 'move'

    @board.redraw()

    $.ajax
      url: @url('opponent_setup')
      method: 'GET'
      success: (data) =>
        @board.add_pieces(data.pieces)
        @board.add_terrains(data.terrains)
        @add_to_chat('Let the battle begin!')

  finish_game_if_complete: ->
    if @action == 'complete'
      name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
      alert("Game over: #{name} wins by death")
      @load_challenges()

  ########################################
  # User initiated actions
  ########################################

  chat: (e) =>
    return unless e.which is 13 # ENTER
    msg = @chat_input.val().trim()
    @chat_input.val("")
    return if msg is ""

    @emit_broadcast 'chat',
      username: @user_name
      message: msg

  setup_add: (type, type_id, coordinate) ->
    $.ajax
      url: @url('setup_add')
      dataType: 'json'
      method: 'PUT'
      data:
        type: type
        type_id: type_id
        coordinate: coordinate

  setup_move: (type, from, to) ->
    $.ajax
      url: @url('setup_move')
      dataType: 'json'
      method: 'PUT'
      data:
        type: type
        from: from
        to: to

  setup_remove: (type, coordinate) ->
    $.ajax
      url: @url('setup_remove')
      method: 'PUT'
      data:
        type: type
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
          @add_to_chat('Setup complete')

          @emit_broadcast 'setup_complete', {action: @action, action_to_id: @action_to_id}, false

          @board.redraw()
          @finish_setup()
        else
          @add_to_chat(data.errors.join("\n"))

  valid_piece_moves: (coordinate) ->
    $.ajax
      url: @url('valid_piece_moves')
      dataType: 'json'
      method: 'GET'
      data:
        coordinate: coordinate
      success: (data) =>
        @board.dehighlight()
        @board.highlight_valid_plies('movement', coordinate, data)

  piece_move: (from_coordinate, to_coordinate) =>
    @emit_request 'piece_move',
      path: @url('piece_move')
      method: 'PUT'
      data:
        from: from_coordinate
        to: to_coordinate

  piece_move_with_range_capture: (from_coordinate, to_coordinate, range_capture_coordinate) =>
    @emit_request 'piece_move_with_range_capture',
      path: @url('piece_move_with_range_capture')
      method: 'PUT'
      data:
        from: from_coordinate
        to: to_coordinate
        range_capture: range_capture_coordinate

  abort_game: =>
    @emit_request 'abort', { path: @url('abort'), method: 'PUT' }

  resign_game: =>
    @emit_request 'resign', { path: @url('resign'), method: 'PUT' }

  ########################################
  # server initiated actions
  ########################################

  server_chat: (data) =>
    @add_to_chat(data.broadcast.message, data.broadcast.username)

  server_setup_complete: (data) =>
    @action = data.broadcast.action
    @action_to_id = data.broadcast.action_to_id
    @update_controls()
    @add_to_chat('Opponent is ready')
    @finish_setup()

  server_piece_move: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON data.backendResponse.body
    if data.success
      @action = data.action
      @action_to_id = data.action_to_id
      @update_state()

      @board.move_piece_by_coordinate(data.from, data.to)
      @finish_game_if_complete()

    else if data.range_captures
      @board.get_range_capture_input(data.from, data.to, data.range_captures)

  server_piece_move_with_range_capture: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON data.backendResponse.body
    if data.success
      @action = data.action
      @action_to_id = data.action_to_id
      @update_state()

      @board.move_piece_by_coordinate(data.from, data.to)
      @board.remove_piece_by_coordinate(data.range_capture)
      @finish_game_if_complete()

  server_game_abort: (data) =>
    alert("Game aborted")
    @load_challenges()

  server_game_resign: (data) =>
    @action = data.action
    @action_to_id = data.action_to_id

    name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
    alert("Game over: #{name} wins by resignation")
    @load_challenges()

  server_player_joined: (data) =>
    if data.userId == @user_name
      for name in data.usersInRoom when name isnt @user_name
        @add_to_chat("#{name} is here")

    else
      @add_to_chat("#{data.userId} joined")

  server_player_left: (data) =>
    return if data.userId == @user_name
    @add_to_chat("#{data.userId} left")


module.exports = GameController
