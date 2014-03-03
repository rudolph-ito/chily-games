class Piece

  attr_accessor :coordinate, :game, :type_id, :user_id

  def initialize(game, attrs)
    @coordinate = attrs[:coordinate]
    @game = game
    @type_id = attrs[:type_id].to_i
    @user_id = attrs[:user_id].to_i
  end

  def piece_type
    PieceType.find(type_id)
  end

  def color
    game.color(user_id)
  end

  def rule
    game.variant.piece_rules.find_by(piece_type_id: type_id)
  end

  def encode
    [type_id, user_id]
  end

  def self.decode(coordinate, game, data)
    self.new(game, {coordinate: coordinate, type_id: data[0], user_id: data[1]})
  end

end
