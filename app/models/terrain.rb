class Terrain < ActiveRecord::Base
  include HasCoordinate

  ########################################
  # Relations
  ########################################

  belongs_to :game
  belongs_to :terrain_type
  belongs_to :user

  ########################################
  # Instance Methods
  ########################################

  def rule
    game.variant.terrain_rules.find_by(terrain_type_id: terrain_type_id)
  end

end
