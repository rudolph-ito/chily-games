class RemoveFromInitialSetup

  attr_accessor :game, :object

  def initialize(game, user, coordinate, type)
    @game = game
    @object = game.setup_for_user(user).get(coordinate, type)
  end

  def call
    game.initial_setup.remove(object) if object
  end

end
