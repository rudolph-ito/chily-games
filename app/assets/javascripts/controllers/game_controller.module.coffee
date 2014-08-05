Controller = require('controller')
Board = require('board')

class GameController extends Controller

  constructor: (@game_id, @user_id, @user_name) ->
    super
    @container = $('.game')
    @board_container = $('.board')
    @chat_messages = @container.find(".chat .messages")
    @chat_input = @container.find(".chat input[name=message]")
    @help_container = @container.find('.help')

  activate: ->
    super

    @socket.on 'chat', @server_chat
    @socket.on 'abort', @server_game_abort
    @socket.on 'setup_complete', @server_setup_complete
    @socket.on 'create_ply', @server_create_ply
    @socket.on 'resign', @server_game_resign

    @container.on 'keyup', 'input[name=message]', @chat
    @container.on 'click', '[data-action=abort]', @abort_game
    @container.on 'click', '[data-action=setup_complete]', @setup_complete
    @container.on 'click', '[data-action=resign]', @resign_game

    @chat_messages.html('')
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
      @update_controls()
      @update_players()

      $('body').trigger('init.Boneyard', data.piece_types)
      $('body').trigger('update.Boneyard', data.boneyard)

      @board = Board.create(@board_container, data.color, data.options, @)
      @board.draw()
      @board.add_terrains(data.terrains)
      @board.add_pieces(data.pieces)
      @board.update_last_ply(data.last_ply.from, data.last_ply.to, data.last_ply.range_capture) if data.last_ply

    $.ajax
      url: @url('rules.html')
      method: 'GET'
      success: (data) =>
        @container.find('#rules').html(data)

  in_setup: ->
    @action == 'setup'

  user_in_setup: ->
    @in_setup() && (@action_to_id == null || @action_to_id == @user_id)

  parse_data: (data) ->
    @action = data.action
    @action_to_id = data.action_to_id
    @alabaster_id = data.alabaster_id
    @alabaster_name = data.alabaster_name
    @color = data.color
    @move_and_range_capture_piece_type_ids = data.move_and_range_capture_piece_type_ids
    @onyx_id = data.onyx_id
    @onyx_name = data.onyx_name
    @range_capture_piece_type_ids = data.range_capture_piece_type_ids
    @variant_id = data.variant_id

  load_challenges: =>
    @board_container.html('')
    @deactivate()
    ChallengesController = require('controllers/challenges_controller')
    new ChallengesController(@user_id, @user_name).activate()

  top_player_name: ->
    if @color == 'onyx' then @alabaster_name else @onyx_name

  bottom_player_name: ->
    if @color == 'onyx' then @onyx_name else @alabaster_name

  opponent_name: ->
    if @user_id == @alabaster_id
      @onyx_name
    else
      @alabaster_name

  ########################################
  # Update UI
  ########################################

  update_controls: ->
    @update_status()
    @update_actions()

  update_actions: ->
    $('[data-action=abort]').toggle @user_in_setup()
    $('[data-action=resign]').toggle !@in_setup()

  update_status: ->
    [message, cssClass] = if @user_in_setup()
      ['Please place your pieces. <a data-action="setup_complete">Click here when done.</a>', 'green']
    else if @in_setup()
      ["Waiting for #{@opponent_name()} to place their pieces", 'yellow']
    else if @action_to_id == @user_id
      ['Your move', 'green']
    else
      player = if @action_to_id == @alabaster_id then @alabaster_name else @onyx_name
      ["#{@opponent_name()} to move", 'yellow']

    @container.find('.status').html(message).removeClass('green yellow').addClass(cssClass)

  update_players: ->
    @container.find('.top-player').text( @top_player_name() )
    @container.find('.bottom-player').text( @bottom_player_name() )

  add_to_chat: (message, username) ->
    @chat_messages.append $('<div class="message">').html("#{username}: #{message}")

  connection_message: (message, connected) ->
    cssClass = if connected then 'connect' else 'disconnect'
    @chat_messages.append $('<div>').addClass(cssClass).html(message)

  finish_setup: ->
    @board.redraw()

    return unless @action == 'play'

    $.ajax
      url: @url('opponent_setup')
      method: 'GET'
      success: (data) =>
        @board.add_pieces(data.pieces)
        @board.add_terrains(data.terrains)

  finish_game_if_complete: ->
    if @action == 'complete'
      name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
      @review("#{name} wins by death")

  abort: ->
    $('.modal .message').text('Game Aborted')
    $('.modal .form').hide()

    $('.modal.review')
      .off('hide.bs.modal')
      .on('hide.bs.modal', @load_challenges)
      .modal()

  review: (message) ->
    $('.modal .message').text("Game Over - #{message}")
    $('.modal .form').show()

    $('.modal.review')
      .off('hide.bs.modal')
      .off('click', '[data-action=submit]')
      .on('hide.bs.modal', @load_challenges)
      .on('click', '[data-action=submit]', @submit_review)
      .modal()

    $.getJSON "/api/variants/#{@variant_id}/review", (data) =>
      raty_options =
        target: '[name=rating]'
        targetKeep: true
        targetType: 'score'

      $('.review .rating').raty(raty_options).raty('score', data.rating)
      $('.review [name=comment]').val(data.comment)

  submit_review: (e) =>
    e.preventDefault()

    $.ajax
      url: "/api/variants/#{@variant_id}/update_review"
      dataType: 'json'
      method: 'PUT'
      data:
        rating: $('.modal [name=rating]').val()
        comment: $('.modal [name=comment]').val()

    $('.modal').modal('hide')

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
          @finish_setup()

          @emit_broadcast 'setup_complete', {action: @action, action_to_id: @action_to_id}, false
        else
          alert(data.errors.join("\n"))

  valid_plies: (coordinate, type, from) ->
    $.ajax
      url: @url('valid_plies')
      dataType: 'json'
      method: 'GET'
      data:
        coordinate: coordinate
        type: type
        from: from
      success: (data) =>
        @board.dehighlight()
        @board.highlight_valid_plies(type, from || coordinate, data.valid, data.reachable)

  ply_valid: (from, to, success_callback) ->
    $.ajax
      url: @url('ply_valid')
      dataType: 'json'
      method: 'GET'
      data:
        from: from
        to: to
      success: (valid) ->
        success_callback() if valid

  create_ply: (from, to, range_capture) =>
    @emit_request 'create_ply',
      path: @url('create_ply')
      method: 'PUT'
      data:
        from: from
        to: to
        range_capture: range_capture

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
    @finish_setup()

  server_create_ply: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON data.backendResponse.body
    if data.success
      @action = data.action
      @action_to_id = data.action_to_id
      @update_status()

      $('body').trigger('created.Ply', data.ply)
      $('body').trigger('show.Boneyard', data.ply.captured_piece) if data.ply.captured_piece?

      @board.update_last_ply(data.ply.from, data.ply.to, data.ply.range_capture)
      @finish_game_if_complete()

  server_game_abort: (data) =>
    @abort()

  server_game_resign: (data) =>
    @action = data.action
    @action_to_id = data.action_to_id

    name = if (@action_to_id == @alabaster_id) then @alabaster_name else @onyx_name
    @review("#{name} wins by resignation")

  server_player_joined: (data) =>
    if data.userId == @user_name
      for name in data.usersInRoom when name isnt @user_name
        @connection_message("#{name} is here", true)

    else
      @connection_message("#{data.userId} joined", true)

  server_player_left: (data) =>
    return if data.userId == @user_name
    @connection_message("#{data.userId} left", false)


module.exports = GameController
