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

  emit_broadcast: (event, data, toSelf=true) ->
    @socket.emit 'send',
      event: event
      toSelf: toSelf
      broadcast: data

  emit_request: (event, options, toSelf=true) ->
    @socket.emit 'send',
      event: event
      toSelf: toSelf
      backendRequest:
        path: options.path
        method: options.method
        data: options.data
        sendToSelf: yes
        headers:
          cookie: document.cookie
          'X-CSRF-Token': @csrfToken

  server_player_joined: (data) ->

  server_player_left: (data) ->


module.exports = Controller
