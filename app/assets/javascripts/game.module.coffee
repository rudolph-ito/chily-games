Board = require("board")

class Game

  # container - id of dom element
  # variant_id - id of variant being previewed
  @play: (container, game_id) ->
    path = "/games/#{game_id}/state"

    $.getJSON(path).done (data) ->
      board = Board.create(data)
      board.draw(container)
