class Terrain < ActiveRecord::Base

  ########################################
  # Relations
  ########################################

  serialize :coordinate
  belongs_to :game
  belongs_to :terrain_type
  belongs_to :user

end