class Topic < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Relations
  ########################################

  has_many :comments
  belongs_to :parent
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :parent, :title, :user, presence: true
  validates :title, uniqueness: { scope: [:parent_id, :parent_type] }

end
