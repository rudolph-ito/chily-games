class Discussion < ActiveRecord::Base
  include Authority::Abilities

  default_scope { order('title asc') }

  ########################################
  # Relations
  ########################################

  has_many :topics
  has_many :comments, through: :topics

  ########################################
  # Validations
  ########################################

  validates :description, presence: true
  validates :title, presence: true, uniqueness: true

end
