class Controller

  constructor: ->
    @csrfToken = $("meta[name='csrf-token']").attr("content")

  activate: ->
    @container.show()
    @socket = io.connect "http://#{window.location.hostname}:3001"

    @socket.on "room joined", @server_player_joined
    @socket.on "room left", @server_player_left

  deactivate: ->
    @container.hide()
    @socket.emit 'leave'

  join: (room_id) ->
    @socket.emit "join", userId: @user_id, roomId: room_id

  emit: (event, options={}) ->
    options.broadcast ||= {}
    # options.broadcast.sessionID = @sessionID
    # options.broadcast.page = @roomController.getViewingPageName()

    if options.path?
      backendRequest =
        path: options.path
        method: options.method
        data: options.data
        sendToSelf: yes
        headers:
          cookie: document.cookie
          'X-CSRF-Token': @csrfToken

    @socket.emit 'send',
      event: event
      broadcast: options.broadcast
      backendRequest: backendRequest

  server_player_joined: (data) ->

  server_player_left: (data) ->


module.exports = Controller
