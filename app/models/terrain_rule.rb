class TerrainRule < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Relations
  ########################################

  belongs_to :terrain_type
  belongs_to :variant

  ########################################
  # Validations
  ########################################

  validates :block_movement, inclusion: { in: [true, false] }
  validates :terrain_type, presence: true
  validates :variant, presence: true

  # Options
  # specify block movement for all pieces or only certain pieces
  # block ranged attacks
  # destructible
  # protecttion

end