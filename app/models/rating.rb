class Rating < ActiveRecord::Base

  ########################################
  # Relations
  ########################################

  belongs_to :variant
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :value, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 10 }

end
