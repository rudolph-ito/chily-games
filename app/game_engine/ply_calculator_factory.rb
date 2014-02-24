class PlyCalculatorFactory

  def self.instance(game, user = nil)
    board = BoardFactory.instance(game.variant)
    piece_repository = game.pieces
    terrain_repository = game.terrains

    if user && game.action == 'setup'
      piece_repository = piece_repository.where(user_id: user.id)
      terrain_repository = terrain_repository.where(user_id: user.id)
    end

    PlyCalculator.new(board, piece_repository, terrain_repository)
  end

end
