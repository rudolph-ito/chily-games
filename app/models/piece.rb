class Piece < ActiveRecord::Base

  ########################################
  # Relations
  ########################################

  serialize :coordinate
  belongs_to :game
  belongs_to :piece_type
  belongs_to :user

end