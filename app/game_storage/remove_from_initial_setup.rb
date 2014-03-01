class RemoveFromInitialSetup

  attr_accessor :game, :object

  def initialize(game, object)
    @game = game
    @object = object
  end

  def call
    game.initial_setup.remove(object) if should_remove_object?
  end

  private

  def should_remove_object?
    board.coordinate_valid?(coordinate) && board.territory(coordinate) == object.color
  end

  def board
    game.board
  end

  def coordinate
    object.coordinate
  end

end
