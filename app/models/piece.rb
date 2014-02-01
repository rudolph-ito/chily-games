class Piece < ActiveRecord::Base
  include HasCoordinate

  ########################################
  # Relations
  ########################################

  belongs_to :game
  belongs_to :piece_type
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :game, :piece_type, :user, presence: true

  ########################################
  # Instance Methods
  ########################################

  def color
    game.color(user_id)
  end

  def rule
    game.variant.piece_rules.find_by(piece_type_id: piece_type_id)
  end

end
