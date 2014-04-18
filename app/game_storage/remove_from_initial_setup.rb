class RemoveFromInitialSetup

  attr_accessor :game, :object

  def initialize(game, user, coordinate, type)
    @game = game
    @object = game.setup_for_user(user).get(coordinate, type)
  end

  def call
    if should_remove_object?
      game.initial_setup.remove(object)
      game.save
    end
  end

  private

  def should_remove_object?
    !object.nil?
  end

end
