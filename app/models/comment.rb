class Comment < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Relations
  ########################################

  belongs_to :topic, inverse_of: :comments, counter_cache: true
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :topic, :text, :user, presence: true

end
