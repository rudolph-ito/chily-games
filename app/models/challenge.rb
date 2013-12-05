class Challenge < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.sides
    %w( alabaster onyx )
  end

  ########################################
  # Relations
  ########################################

  belongs_to :challenged, class_name: 'User'
  belongs_to :challenger, class_name: 'User'
  belongs_to :variant

  ########################################
  # Validations
  ########################################

  validates :challenger, presence: true
  validates :play_as, inclusion: { in: self.sides }, :if => lambda { |c| c.play_as.present? }
  validates :variant, presence: true

  ########################################
  # Instance Methods
  ########################################

  def accept!(user)
    destroy
    create_game_with(user)
  end

  def decline!(user)
    destroy
  end

  def create_game_with(user)
    challenger_play_as = Challenge.sides[rand(2)] if play_as.blank?
    challenged_play_as = Challenge.sides.find{ |x| x != play_as }

    Game.create!(variant: variant, play_as => challenger, challenged_play_as => user, action: 'setup')
  end

end
