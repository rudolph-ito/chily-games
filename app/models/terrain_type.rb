class TerrainType < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Uploaders
  ########################################

  mount_uploader :image, ImageUploader

  ########################################
  # Validations
  ########################################

  validates :image, presence: true
  validates :name, presence: true, uniqueness: true

end