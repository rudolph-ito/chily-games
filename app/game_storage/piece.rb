class Piece

  attr_accessor :coordinate, :game, :piece_type_id, :user_id

  def initialize(coordinate, game, piece_type_id, user_id)
    @coordinate = coordinate
    @game = game
    @piece_type_id = piece_type_id
    @user_id = user_id
  end

  def piece_type
    PieceType.find(piece_type_id)
  end

  def color
    game.color(user_id)
  end

  def rule
    game.variant.piece_rules.find_by(piece_type_id: piece_type_id)
  end

  def encode
    [piece_type_id.to_i, user_id.to_i]
  end

  def self.decode(coordinate, game, data)
    self.new(coordinate, game, data[0], data[1])
  end

end
