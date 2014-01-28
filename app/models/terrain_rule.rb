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
  validates :count, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :terrain_type, presence: true
  validates :variant, presence: true

  ########################################
  # Instance Methods
  ########################################

  def count_with_name
    name = terrain_type.name.downcase
    name = name.pluralize if count != 1
    "#{count} #{name}"
  end

  # Options
  # specify block movement for all pieces or only certain pieces
  # block ranged attacks
  # destructible
  # protecttion

end