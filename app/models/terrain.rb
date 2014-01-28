class Terrain < ActiveRecord::Base
  include HasCoordinate

  ########################################
  # Relations
  ########################################

  serialize :coordinate
  belongs_to :game
  belongs_to :terrain_type
  belongs_to :user

end