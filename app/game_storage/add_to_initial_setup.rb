class AddToInitialSetup

  attr_accessor :game, :object

  def initialize(game, type, attrs)
    @game = game
    @object = type.new(game, attrs)
  end

  def call
    if should_add_object?
      game.initial_setup.add(object)
      game.save
    end
  end

  private

  def should_add_object?
    board.coordinate_valid?(object.coordinate) && board.territory(object.coordinate) == object.color
  end

  def board
    game.board
  end

end
