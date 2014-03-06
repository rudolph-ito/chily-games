class Comment < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Relations
  ########################################

  belongs_to :topic
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :topic, :text, :user, presence: true

end
