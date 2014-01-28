class TerrainType < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.urls
    out = {}
    all.each do |tt|
      out[tt.id] = tt.image.url
    end
    out
  end

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