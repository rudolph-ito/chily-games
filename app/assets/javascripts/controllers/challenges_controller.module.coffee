Controller = require('controller')

class ChallengesController extends Controller

  constructor: (@user_id) ->
    super
    @container = $('.challenges')
    @your = @container.find('table tbody.your')
    @open = @container.find('table tbody.open')

  activate: ->
    super
    @your.html('')
    @open.html('')

    @socket.on 'create', @server_challenge_created
    @socket.on 'accept', @server_challenge_accepted
    @socket.on 'decline', @server_challenge_declined
    @socket.on 'cancel', @server_challenge_canceled

    @join('c')

    @container.on 'click', '[data-action=create]', @create_challenge
    @container.on 'click', '[data-action=accept]', @accept_challenge
    @container.on 'click', '[data-action=decline]', @decline_challenge
    @container.on 'click', '[data-action=cancel]', @cancel_challenge

    $.getJSON "/api/games/current", (data) =>
      @load_game(data.id) if data.id isnt null

    for type in ['your', 'open']
      do (type) =>
        $.getJSON "/api/challenges?#{type}=1", (challenges) =>
          @add_row(challenge, type) for challenge in challenges

  deactivate: ->
    @socket.removeAllListeners 'create'
    @socket.removeAllListeners 'accept'
    @socket.removeAllListeners 'decline'
    @socket.removeAllListeners 'cancel'
    @container.off()
    super


  load_game: (id) ->
    @deactivate()
    GameController = require('controllers/game_controller')
    new GameController(@user_id, id).activate()

  ########################################
  # Update UI
  ########################################

  find_row: (challenge_id) ->
    @container.find("tr[data-id=#{challenge_id}]")

  add_row: (challenge, type) ->
    return if @find_row(challenge.id).length > 0

    row = $("<tr>").attr("data-id", challenge.id)
    row.append( $("<td>").text("#{challenge.challenger} (#{challenge.play_as})") )
    row.append( $("<td>").text("#{challenge.variant}") )

    links = []
    attrs = href: '#', 'data-id': challenge.id
    if challenge.challenger_id != @user_id && (challenge.challenged_id == @user_id || challenge.challenged_id == null)
      links.push $("<a>").text("Accept").attr(attrs).attr('data-action': 'accept')
    if challenge.challenged_id == @user_id
      links.push $("<a>").text("Decline").attr(attrs).attr('data-action': 'decline')
    if challenge.challenger_id == @user_id
      links.push $("<a>").text("Cancel").attr(attrs).attr('data-action': 'cancel')

    row.append( $("<td>").append(links) )

    @[type].append(row)

  remove_row: (challenge_id) ->
    @find_row(challenge_id).remove()

  ########################################
  # User initiated actions
  ########################################

  create_challenge: (e) =>
    e.preventDefault()
    data = { challenge: {} }
    data.challenge[pair.name] = pair.value for pair in $(e.target).parents('form').serializeArray()
    @emit 'create', { path: '/api/challenges', method: 'POST', data: data }

  accept_challenge: (e) =>
    e.preventDefault()
    id = $(e.target).data('id')
    @emit 'accept', { path: "/api/challenges/#{id}/accept", method: 'PUT' }

  decline_challenge: (e) =>
    e.preventDefault()
    id = $(e.target).data('id')
    @emit 'decline', { path: "/api/challenges/#{id}/decline", method: 'PUT' }

  cancel_challenge: (e) =>
    e.preventDefault()
    id = $(e.target).data('id')
    @emit 'cancel', { path: "/api/challenges/#{id}", method: 'DELETE' }

  ########################################
  # Server initiated actions
  ########################################

  server_challenge_created: (data) =>
    return unless data.backendResponse.status == 200
    challenge = $.parseJSON data.backendResponse.body

    type = if challenge.challenger_id == @user_id || challenge.challenged_id == @user_id
      'your'
    else if challenge.challenged_id == null
      'open'

    @add_row(challenge, type) if type

  server_challenge_accepted: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON(data.backendResponse.body)
    game = data.game
    @remove_row(data.challenge_id)

    if game.alabaster_id == @user_id || game.onyx_id == @user_id
      @load_game(game.id)

  server_challenge_declined: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON(data.backendResponse.body)
    @remove_row(data.challenge_id)

  server_challenge_canceled: (data) =>
    return unless data.backendResponse.status == 200
    data = $.parseJSON(data.backendResponse.body)
    @remove_row(data.challenge_id)

module.exports = ChallengesController
