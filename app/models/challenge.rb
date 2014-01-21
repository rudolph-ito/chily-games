class Challenge < ActiveRecord::Base
  include Authority::Abilities

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
  validates :play_as, inclusion: { in: Game.sides + ['random'] }
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
    challenger_play_as = play_as || Game.sides[rand(2)]
    challenged_play_as = Game.sides.find{ |x| x != challenger_play_as }

    Game.create!(variant: variant, challenger_play_as => challenger, challenged_play_as => user, action: 'setup')
  end

end
