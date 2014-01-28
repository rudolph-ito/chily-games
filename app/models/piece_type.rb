class PieceType < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.urls
    out = {}
    all.each do |pt|
      out[pt.id] = { alabaster: pt.alabaster_image.url, onyx: pt.onyx_image.url }
    end
    out
  end

  default_scope -> { order('name ASC') }

  ########################################
  # Uploaders
  ########################################

  mount_uploader :alabaster_image, ImageUploader
  mount_uploader :onyx_image, ImageUploader

  ########################################
  # Validations
  ########################################

  validates :alabaster_image, presence: true
  validates :name, presence: true, uniqueness: true
  validates :onyx_image, presence: true

  ########################################
  # Instance Methods
  ########################################

  def king?
    name == 'King'
  end

end