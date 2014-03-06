class Discussion < ActiveRecord::Base
  include Authority::Abilities

  default_scope { order('title asc') }

  ########################################
  # Relations
  ########################################

  has_many :topics, as: :parent, dependent: :destroy
  has_many :comments, through: :topics

  ########################################
  # Validations
  ########################################

  validates :description, presence: true
  validates :title, presence: true, uniqueness: true

  ########################################
  # Instance Methods
  ########################################

  def to_s
    "Discussion: #{title}"
  end

end
